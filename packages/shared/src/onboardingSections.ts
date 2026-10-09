import type { Language, MyOnboarding } from '@sistem/types';
import { sharedCopy } from './copy';
import { fill } from './i18n/copy';
import { isolateLtr } from './i18n/bidi';
import { formatDateShort, formatDateTime, humanizeId, labelList } from './format';
import { describeNutritionPreferences, describeWeightGoal } from './nutritionDisplay';

export interface OnboardingAnswerRow {
  label: string;
  value: string;
}

export interface OnboardingAnswerSection {
  title: string;
  rows: OnboardingAnswerRow[];
}

// Answers are stored as option ids; the coach reads the same option labels the trainee
// chose from (shared copy), in the coach's language. Free text is shown as written.
export function buildOnboardingSections(onboarding: MyOnboarding, language: Language): OnboardingAnswerSection[] {
  const copy = sharedCopy[language];
  const labels = copy.onboardingSections;
  const options = copy.onboardingOptions;
  const answers = onboarding.answers;
  const frequency = answers?.trainingFrequency;
  const text = (value: string | undefined) => value?.trim() || '—';
  const unitLabel = (unit: string | undefined) => (unit ? (copy.units as Record<string, string>)[unit] ?? unit : undefined);

  return [
    {
      title: labels.basicProfile,
      rows: [
        { label: labels.name, value: onboarding.name },
        { label: labels.birthDate, value: answers?.birthDate ? formatDateShort(answers.birthDate.slice(0, 10), language) : '—' },
        { label: labels.height, value: answers?.height !== undefined ? `${answers.height} ${copy.units.cm}` : '—' },
        { label: labels.weight, value: answers?.weight !== undefined ? `${answers.weight} ${copy.units.kg}` : '—' },
        {
          label: labels.gender,
          value: answers?.gender ? ((options.gender as Record<string, string>)[answers.gender] ?? humanizeId(answers.gender)) : '—',
        },
        {
          label: labels.preferredUnits,
          value: onboarding.units
            ? [unitLabel(onboarding.units.weight), unitLabel(onboarding.units.distance)].filter(Boolean).join(' / ') || '—'
            : '—',
        },
      ],
    },
    { title: labels.goals, rows: [{ label: labels.goals, value: labelList(answers?.goals, options.goals, language) }] },
    {
      title: labels.trainingFrequency,
      rows: [
        { label: labels.daysPerWeek, value: frequency ? isolateLtr(`${frequency.minDays}–${frequency.maxDays}`) : '—' },
        { label: labels.flexibleSchedule, value: frequency ? (frequency.flexibleSchedule ? copy.common.yes : copy.common.no) : '—' },
      ],
    },
    {
      title: labels.activities,
      rows: [{ label: labels.preferredActivities, value: labelList(answers?.preferredActivities, options.activities, language) }],
    },
    {
      title: labels.exercisePreferences,
      rows: [
        { label: labels.favoriteExercises, value: text(answers?.exercisePreferences?.favoriteExerciseNotes) },
        { label: labels.wantsToImprove, value: text(answers?.exercisePreferences?.improvementExerciseNotes) },
        { label: labels.muscleFocus, value: labelList(answers?.exercisePreferences?.muscleFocus, options.muscleFocus, language) },
      ],
    },
    {
      title: labels.recovery,
      rows: [
        { label: labels.flags, value: labelList(answers?.recovery?.flags, options.recoveryFlags, language) },
        { label: labels.notes, value: text(answers?.recovery?.notes) },
      ],
    },
    { title: labels.equipment, rows: [{ label: labels.equipment, value: labelList(answers?.equipment, options.equipment, language) }] },
    // Phase 13a. Trainees who finished onboarding before this step show "Not answered".
    // The coach always reads kg.
    {
      title: labels.nutritionAndGoal,
      rows: [
        { label: labels.weightGoal, value: answers?.weightGoal ? describeWeightGoal(answers.weightGoal, 'kg', language) : '—' },
        ...describeNutritionPreferences(answers?.nutritionPreferences, language),
      ],
    },
  ];
}

/** The line above the answers: finished (and when), or how far she got. */
export function describeOnboardingProgress(onboarding: MyOnboarding, language: Language): string {
  const labels = sharedCopy[language].onboardingSections;
  if (onboarding.status === 'completed' && onboarding.completedAt) {
    return fill(labels.completed, { date: formatDateTime(onboarding.completedAt, language) });
  }
  if (!onboarding.lastStep) return labels.inProgress;
  const step = (sharedCopy[language].onboardingOptions.steps as Record<string, string>)[onboarding.lastStep] ?? humanizeId(onboarding.lastStep);
  return fill(labels.inProgressLastStep, { step });
}
