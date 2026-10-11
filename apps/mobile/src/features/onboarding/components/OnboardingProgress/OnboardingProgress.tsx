import { fill, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import './OnboardingProgress.css';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

/** One segment per real step; the ones reached so far are filled. */
export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const copy = useCopy(onboardingCopy);
  return (
    <div
      className="onboarding-progress"
      role="img"
      aria-label={fill(copy.flow.step, { current: currentStep, total: totalSteps })}
      data-deck-rise
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <span
          key={index}
          className={
            index < currentStep
              ? 'onboarding-progress-segment onboarding-progress-segment-reached'
              : 'onboarding-progress-segment'
          }
        />
      ))}
    </div>
  );
}
