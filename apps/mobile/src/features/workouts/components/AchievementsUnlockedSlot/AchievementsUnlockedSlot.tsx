import type { WorkoutLog } from '@sistem/types';

interface AchievementsUnlockedSlotProps {
  log: WorkoutLog;
}

/**
 * PRD §5.3 "achievements unlocked by this workout are revealed here". Phase 11 fills
 * this slot (server-side evaluation after each finish + a GSAP reveal); until then it
 * renders nothing. Kept as a component so the summary screen doesn't change then.
 */
export function AchievementsUnlockedSlot(_props: AchievementsUnlockedSlotProps) {
  return null;
}
