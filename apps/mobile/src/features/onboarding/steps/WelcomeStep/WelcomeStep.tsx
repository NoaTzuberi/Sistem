import { useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import './WelcomeStep.css';

export function WelcomeStep() {
  const copy = useCopy(onboardingCopy).welcome;
  return (
    <div className="onboarding-step welcome-step">
      <h1>{copy.title}</h1>
      <p className="text-body">{copy.body}</p>
    </div>
  );
}
