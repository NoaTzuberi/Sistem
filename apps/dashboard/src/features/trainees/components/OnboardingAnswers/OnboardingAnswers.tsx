import type { MyOnboarding } from '@sistem/types';
import { buildOnboardingSections, describeOnboardingProgress } from '@sistem/shared';
import './OnboardingAnswers.css';

interface OnboardingAnswersProps {
  onboarding: MyOnboarding | null;
}

export function OnboardingAnswers({ onboarding }: OnboardingAnswersProps) {
  if (!onboarding) {
    return <p className="onboarding-empty">This trainee has not started onboarding yet.</p>;
  }

  return (
    <div className="onboarding-answers">
      <p className="onboarding-status">
        {describeOnboardingProgress(onboarding)}
      </p>

      {buildOnboardingSections(onboarding).map((section) => (
        <section key={section.title} className="onboarding-section">
          <h2 className="onboarding-section-title">{section.title}</h2>
          <dl className="onboarding-rows">
            {section.rows.map((row) => (
              <div key={row.label} className="onboarding-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
