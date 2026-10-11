import { useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';

export function WelcomeStep() {
  const copy = useCopy(onboardingCopy).welcome;
  return <p className="text-body">{copy.body}</p>;
}
