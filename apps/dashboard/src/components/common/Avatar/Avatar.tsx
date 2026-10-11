import './Avatar.css';

const TINTS = ['pink', 'lilac', 'peach', 'sky'] as const;

interface AvatarProps {
  name: string;
  /** Keeps a person's tint the same everywhere (her id); without it the name decides. */
  seed?: string;
  size?: 'sm' | 'md' | 'lg';
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('');
}

function tintOf(seed: string): (typeof TINTS)[number] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/** Initials on a soft tint. Decorative: the name is always written next to it. */
export function Avatar({ name, seed, size = 'md' }: AvatarProps) {
  return (
    <span className={`avatar avatar-${size} avatar-${tintOf(seed ?? name)}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}
