import type { ExerciseFacts } from '@sistem/types';
import './ExerciseMediaSlot.css';

interface ExerciseMediaSlotProps {
  exercise: ExerciseFacts | undefined;
}

/**
 * Where the exercise's demo media and original description go (PRD §14 backlog:
 * original descriptions; the coach's own demo videos). The imported library has no
 * media and its text is not cleared for use, so this renders nothing for now — fill
 * it here and every session card shows it.
 */
export function ExerciseMediaSlot({ exercise }: ExerciseMediaSlotProps) {
  if (!exercise) return null;
  return null;
}
