import { useMemo, useState } from 'react';
import type { MyOnboarding } from '@sistem/types';
import { describeOnboardingProgress, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { buildQuestionnaireProfile } from '../../data/questionnaireProfile';
import { useLatestWeight } from '../../hooks/useLatestWeight';
import { AnswerSection } from '../AnswerSection/AnswerSection';
import { AttentionCard } from '../AttentionCard/AttentionCard';
import { GoalCard } from '../GoalCard/GoalCard';
import { KeyNumbers } from '../KeyNumbers/KeyNumbers';
import { MissingFieldsCard } from '../MissingFieldsCard/MissingFieldsCard';
import './OnboardingAnswers.css';

interface OnboardingAnswersProps {
  traineeId: string;
  onboarding: MyOnboarding | null;
}

/**
 * Her questionnaire as a profile sheet: the key numbers, her goal, the sections in the order that helps a
 * coach, and beside them what to notice before building and what she left empty. The mapping of
 * answers to places is in data/questionnaireProfile.ts.
 */
export function OnboardingAnswers({ traineeId, onboarding }: OnboardingAnswersProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const [showEmpty, setShowEmpty] = useState(false);
  const latestWeightKg = useLatestWeight(traineeId, onboarding?.answers?.weightGoal !== undefined);
  const profile = useMemo(
    () => (onboarding ? buildQuestionnaireProfile(onboarding, language, new Date(), latestWeightKg) : null),
    [onboarding, language, latestWeightKg],
  );

  if (!onboarding || !profile) {
    return <p className="onboarding-empty">{shared.coach.onboardingNotStarted}</p>;
  }

  return (
    <div className="onboarding-sheet">
      <div className="onboarding-main">
        <KeyNumbers numbers={profile.keyNumbers} />
        {profile.goal && <GoalCard goal={profile.goal} />}
        {profile.sections.map((section) => (
          <AnswerSection key={section.id} section={section} showEmpty={showEmpty} />
        ))}
      </div>
      <aside className="onboarding-side">
        <AttentionCard items={profile.attention} />
        <MissingFieldsCard fields={profile.missing} isShowing={showEmpty} onToggle={() => setShowEmpty((shown) => !shown)} />
        <p className="onboarding-status">{describeOnboardingProgress(onboarding, language)}</p>
      </aside>
    </div>
  );
}
