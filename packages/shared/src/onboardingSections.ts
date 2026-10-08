import type { MyOnboarding } from '@sistem/types';
import { formatDateTime, humanizeId, humanizeList } from './format';
import { describeNutritionPreferences, describeWeightGoal } from './nutritionDisplay';

export interface OnboardingAnswerRow {
  label: string;
  value: string;
}

export interface OnboardingAnswerSection {
  title: string;
  rows: OnboardingAnswerRow[];
}

// Answers are stored as option ids; they are shown humanized ('build_muscle' →
// 'Build muscle') until the owner supplies the coach-side wording.
export function buildOnboardingSections(onboarding: MyOnboarding): OnboardingAnswerSection[] {
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
    // Phase 13a. Trainees who finished onboarding before this step show "Not answered".
    // The coach always reads kg.
    {
      title: 'Nutrition & goal',
      rows: [
        { label: 'Weight goal', value: answers?.weightGoal ? describeWeightGoal(answers.weightGoal) : '—' },
        ...describeNutritionPreferences(answers?.nutritionPreferences),
      ],
    },
  ];
}

/** The line above the answers: finished (and when), or how far she got. */
export function describeOnboardingProgress(onboarding: MyOnboarding): string {
  if (onboarding.status === 'completed' && onboarding.completedAt) {
    return `Completed ${formatDateTime(onboarding.completedAt)}`;
  }
  return `In progress${onboarding.lastStep ? ` — last step saved: ${humanizeId(onboarding.lastStep)}` : ''}`;
}
