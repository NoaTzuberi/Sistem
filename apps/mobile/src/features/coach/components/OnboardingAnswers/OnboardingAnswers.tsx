import type { MyOnboarding } from '@sistem/types';
import { buildOnboardingSections, describeOnboardingProgress } from '@sistem/shared';
import { CoachMessage } from '../CoachMessage/CoachMessage';
import './OnboardingAnswers.css';

interface OnboardingAnswersProps {
  onboarding: MyOnboarding | null;
}

export function OnboardingAnswers({ onboarding }: OnboardingAnswersProps) {
  if (!onboarding) return <CoachMessage>This trainee has not started onboarding yet.</CoachMessage>;

  return (
    <div className="onboarding-answers">
      <p className="onboarding-answers-status">{describeOnboardingProgress(onboarding)}</p>

      {buildOnboardingSections(onboarding).map((section) => (
        <section key={section.title} className="onboarding-answers-section">
          <h2 className="onboarding-answers-title">{section.title}</h2>
          <dl className="onboarding-answers-rows">
            {section.rows.map((row) => (
              <div key={row.label} className="onboarding-answers-row">
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
