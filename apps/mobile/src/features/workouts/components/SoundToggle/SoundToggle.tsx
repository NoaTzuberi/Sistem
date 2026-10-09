import { useCopy } from '@sistem/shared';
import { unlockAudio } from '../../data/intervalSounds';
import { workoutCopy } from '../../copy';
import { useSoundMuted } from '../../hooks/useSoundMuted';
import './SoundToggle.css';

interface SoundToggleProps {
  className?: string;
}

/** Sound on / off for every workout timer (rest, holds, intervals) — one shared setting. */
export function SoundToggle({ className }: SoundToggleProps) {
  const copy = useCopy(workoutCopy);
  const [muted, toggle] = useSoundMuted();

  function handleClick() {
    // Turning sound on is a tap: let the browser play from now on.
    if (muted) unlockAudio();
    toggle();
  }

  return (
    <button
      type="button"
      className={['sound-toggle', className].filter(Boolean).join(' ')}
      aria-label={muted ? copy.session.soundOn : copy.session.soundOff}
      aria-pressed={muted}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="sound-toggle-speaker" d="M4 9h4l5-4v14l-5-4H4z" />
        {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
      </svg>
    </button>
  );
}
