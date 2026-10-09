import { fill, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import './OnboardingProgress.css';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const copy = useCopy(onboardingCopy);
  return (
    <div className="onboarding-progress">
      <div className="onboarding-progress-track">
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            key={index}
            className={
              index < currentStep
                ? 'onboarding-progress-dot onboarding-progress-dot-filled'
                : 'onboarding-progress-dot'
            }
          />
        ))}
      </div>
      <span className="onboarding-progress-label text-caption">
        {fill(copy.flow.step, { current: currentStep, total: totalSteps })}
      </span>
    </div>
  );
}
