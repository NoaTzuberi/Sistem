// Workout countdown beeps (Web Audio) and vibration — one module, one beep pattern and
// one mute setting for the interval timer, the free timer and holds (plank ▶ 45s).
// Browsers only allow audio started by a tap, so `unlockAudio()` runs from the Start
// tap (and any tap on the interval screen).
// Best effort everywhere: on iPhone in the browser the silent switch mutes Web Audio,
// nothing plays while the screen is locked, and there is no Vibration API. Native
// audio comes with Capacitor (Phase 5b).

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

const SHORT = { frequency: 880, seconds: 0.12, vibrateMs: 80 };
const LONG = { frequency: 520, seconds: 0.6, vibrateMs: 400 };
const VOLUME = 0.4;
const FADE_SEC = 0.01;

/** Dev only: what the audio was doing when a beep fired (Phase 8 "no beeps" bug). */
function logState(label: string): void {
  if (import.meta.env.DEV) {
    console.debug(`[intervalSounds] ${label} — AudioContext: ${context ? context.state : 'none'}`);
  }
}

/**
 * Creates (once) and resumes the audio context. Must run inside a tap. The context is
 * kept even if a later step fails — dropping it is what silenced every beep before.
 */
export function unlockAudio(): void {
  if (!context) {
    const Constructor: AudioContextConstructor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
    if (!Constructor) return;
    try {
      context = new Constructor();
    } catch {
      return;
    }
  }
  if (context.state === 'suspended') void context.resume().catch(() => undefined);
  try {
    // An empty buffer played inside the tap is what unlocks audio on iOS.
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, 22050);
    source.connect(context.destination);
    source.start(0);
  } catch {
    // Unlock helper only; the context itself is fine.
  }
}

function playTone(frequency: number, seconds: number): void {
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  // Short fade in / out (no clicks). Every time is ≥ start: Web Audio throws on
  // negative times, and a fresh context starts at currentTime 0.
  const peakAt = start + Math.min(FADE_SEC, seconds / 2);
  const fadeOutAt = Math.max(peakAt, start + seconds - FADE_SEC * 3);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(VOLUME, peakAt);
  gain.gain.setValueAtTime(VOLUME, fadeOutAt);
  gain.gain.linearRampToValueAtTime(0, start + seconds);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds);
}

function vibrate(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not supported.
  }
}

/** 'short' = 10 s and 3-2-1 left · 'long' = the phase switches. */
export function beep(kind: 'short' | 'long', muted: boolean): void {
  const tone = kind === 'short' ? SHORT : LONG;
  vibrate(tone.vibrateMs);
  logState(`beep ${kind}${muted ? ' (muted)' : ''}`);
  if (muted || !context) return;
  // Suspended again (e.g. the OS paused audio): try once more; works if a tap allowed it.
  if (context.state === 'suspended') void context.resume().catch(() => undefined);
  try {
    playTone(tone.frequency, tone.seconds);
  } catch {
    // Audio unavailable: the vibration (where supported) and the screen still tell her.
  }
}

/** Dev only (free timer setup): the 10 s beep, then the phase-switch beep. Call from a tap. */
export function playTestSound(): void {
  unlockAudio();
  beep('short', false);
  window.setTimeout(() => beep('long', false), 500);
}

/** Seconds left at which a short beep plays (only when the countdown is longer than that). */
const BEEP_AT_SECONDS = [10, 3, 2, 1];

/**
 * Whether a short beep belongs at `leftSec` seconds left of a `durationSec` countdown:
 * 10, 3, 2, 1 — never at the very start (a 10 s hold gets no 10 s beep, only 3-2-1).
 */
export function isCountdownBeep(leftSec: number, durationSec: number): boolean {
  return BEEP_AT_SECONDS.includes(leftSec) && leftSec < durationSec;
}

const MUTED_KEY = 'sistem.interval.muted';
const mutedListeners = new Set<() => void>();

/** The one mute setting for every timer (rest, holds, intervals), remembered on the phone. */
export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return mutedFallback;
  }
}

let mutedFallback = false;

export function setSoundMuted(muted: boolean): void {
  mutedFallback = muted;
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    // Storage blocked: remembered for this visit only (mutedFallback).
  }
  // Every toggle on screen (session header, interval screen) shows the same state.
  mutedListeners.forEach((listener) => listener());
}

export function subscribeSoundMuted(listener: () => void): () => void {
  mutedListeners.add(listener);
  return () => {
    mutedListeners.delete(listener);
  };
}
