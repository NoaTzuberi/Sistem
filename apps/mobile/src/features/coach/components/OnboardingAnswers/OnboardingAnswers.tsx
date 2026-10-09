import type { MyOnboarding } from '@sistem/types';
import { buildOnboardingSections, describeOnboardingProgress, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import './OnboardingAnswers.css';

interface OnboardingAnswersProps {
  onboarding: MyOnboarding | null;
}

export function OnboardingAnswers({ onboarding }: OnboardingAnswersProps) {
  const shared = useCopy(sharedCopy);
  const language = useLanguage();
  if (!onboarding) return <StateMessage>{shared.coach.onboardingNotStarted}</StateMessage>;

  return (
    <div className="onboarding-answers">
      <p className="onboarding-answers-status">{describeOnboardingProgress(onboarding, language)}</p>

      {buildOnboardingSections(onboarding, language).map((section) => (
        <section key={section.title} className="onboarding-answers-section">
          <h2 className="onboarding-answers-title">{section.title}</h2>
          <dl className="onboarding-answers-rows">
            {section.rows.map((row) => (
              <div key={row.label} className="onboarding-answers-row">
                <dt>{row.label}</dt>
                <dd dir="auto">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
