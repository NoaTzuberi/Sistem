import type { MyOnboarding } from '@sistem/types';
import { formatDateTime, humanizeId, humanizeList } from '../../../../utils/format';
import './OnboardingAnswers.css';

interface OnboardingAnswersProps {
  onboarding: MyOnboarding | null;
}

interface AnswerRow {
  label: string;
  value: string;
}

// Answers are stored as option ids; they are shown humanized ('build_muscle' →
// 'Build muscle') until the owner supplies the dashboard wording.
function buildSections(onboarding: MyOnboarding): { title: string; rows: AnswerRow[] }[] {
  const answers = onboarding.answers;
  const frequency = answers?.trainingFrequency;
  const text = (value: string | undefined) => value?.trim() || '—';

  return [
    {
      title: 'Basic profile',
      rows: [
        { label: 'Name', value: onboarding.name },
        { label: 'Birth date', value: text(answers?.birthDate?.slice(0, 10)) },
        { label: 'Height', value: answers?.height !== undefined ? `${answers.height} cm` : '—' },
        { label: 'Weight', value: answers?.weight !== undefined ? `${answers.weight} kg` : '—' },
        { label: 'Gender', value: answers?.gender ? humanizeId(answers.gender) : '—' },
        {
          label: 'Preferred units',
          value: onboarding.units ? [onboarding.units.weight, onboarding.units.distance].filter(Boolean).join(' / ') || '—' : '—',
        },
      ],
    },
    { title: 'Goals', rows: [{ label: 'Goals', value: humanizeList(answers?.goals) }] },
    {
      title: 'Training frequency',
      rows: [
        { label: 'Days per week', value: frequency ? `${frequency.minDays}–${frequency.maxDays}` : '—' },
        { label: 'Flexible schedule', value: frequency ? (frequency.flexibleSchedule ? 'Yes' : 'No') : '—' },
      ],
    },
    { title: 'Activities', rows: [{ label: 'Preferred activities', value: humanizeList(answers?.preferredActivities) }] },
    {
      title: 'Exercise preferences',
      rows: [
        { label: 'Favorite exercises', value: text(answers?.exercisePreferences?.favoriteExerciseNotes) },
        { label: 'Wants to improve', value: text(answers?.exercisePreferences?.improvementExerciseNotes) },
        { label: 'Muscle focus', value: humanizeList(answers?.exercisePreferences?.muscleFocus) },
      ],
    },
    {
      title: 'Recovery',
      rows: [
        { label: 'Flags', value: humanizeList(answers?.recovery?.flags) },
        { label: 'Notes', value: text(answers?.recovery?.notes) },
      ],
    },
    { title: 'Equipment', rows: [{ label: 'Equipment', value: humanizeList(answers?.equipment) }] },
  ];
}

export function OnboardingAnswers({ onboarding }: OnboardingAnswersProps) {
  if (!onboarding) {
    return <p className="onboarding-empty">This trainee has not started onboarding yet.</p>;
  }

  return (
    <div className="onboarding-answers">
      <p className="onboarding-status">
        {onboarding.status === 'completed' && onboarding.completedAt
          ? `Completed ${formatDateTime(onboarding.completedAt)}`
          : `In progress${onboarding.lastStep ? ` — last step saved: ${humanizeId(onboarding.lastStep)}` : ''}`}
      </p>

      {buildSections(onboarding).map((section) => (
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
