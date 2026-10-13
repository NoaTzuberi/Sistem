import type { Language, MyOnboarding, PreferenceItem, WeightGoal } from '@sistem/types';
import { fill, formatDateShort, formatPlural, humanizeId, isolateAuto, isolateLtr, sharedCopy } from '@sistem/shared';
import { traineesCopy } from '../copy';

// The Questionnaire tab as a profile sheet: WHICH answer goes WHERE. Everything below reads her
// existing onboarding answers and the existing labels — nothing is asked or stored here.

export type AnswerValue =
  | { kind: 'text'; text: string }
  /** Several choices: small pills. */
  | { kind: 'pills'; items: string[] }
  | { kind: 'weightGoal'; goal: WeightGoalView };

export interface AnswerRow {
  id: string;
  label: string;
  /** null = she left it empty (hidden until "show empty fields"). */
  value: AnswerValue | null;
}

export interface AnswerSectionView {
  id: 'goals' | 'training' | 'exercises' | 'personal';
  title: string;
  rows: AnswerRow[];
}

export interface KeyNumber {
  id: 'age' | 'height' | 'weight' | 'days';
  label: string;
  value: string;
  unit?: string;
}

/** Something that can change how the coach programs for her, with where it came from. */
export interface AttentionItem {
  id: string;
  source: string;
  text: string;
}

export interface WeightGoalView {
  /** Where the bar starts: her questionnaire weight (kg); undefined when she gave none. */
  startKg: number | undefined;
  /** Her newest weigh-in (kg) when she has one after the questionnaire. */
  latestKg: number | undefined;
  targetKg: number;
  /** 0–1: how far she is from the start to the target. */
  progress: number;
  /** "−6 kg · 12 weeks · about 0.5 kg a week" — the parts that can be computed. */
  summary: string;
}

export interface QuestionnaireProfile {
  keyNumbers: KeyNumber[];
  sections: AnswerSectionView[];
  attention: AttentionItem[];
  /** Labels of the rows she left empty. */
  missing: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole years between her birth date and `today`. */
export function ageInYears(birthDate: string, today: Date): number {
  const born = new Date(birthDate);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const hadBirthday = today.getUTCMonth() > born.getUTCMonth() || (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() >= born.getUTCDate());
  if (!hadBirthday) age -= 1;
  return age;
}

/** The weeks her goal gives itself: as she typed them, or from the day she set it to her date. */
function goalWeeks(goal: WeightGoal): number | undefined {
  if (!goal.timeframe) return undefined;
  if (goal.timeframe.kind === 'weeks') return goal.timeframe.weeks;
  const days = (new Date(`${goal.timeframe.date}T00:00:00Z`).getTime() - new Date(goal.setAt).getTime()) / DAY_MS;
  return days > 0 ? days / 7 : undefined;
}

function weightGoalView(goal: WeightGoal, startKg: number | undefined, latestKg: number | undefined, language: Language): WeightGoalView {
  const copy = traineesCopy[language];
  const shared = sharedCopy[language];
  const number = (value: number) => String(Math.round(value * 10) / 10);
  const change = startKg !== undefined ? goal.targetWeightKg - startKg : undefined;
  const weeks = goalWeeks(goal);
  const current = latestKg ?? startKg;
  const progress = change && current !== undefined && startKg !== undefined ? Math.max(0, Math.min(1, (current - startKg) / change)) : 0;
  const timeframe = !goal.timeframe
    ? undefined
    : goal.timeframe.kind === 'weeks'
      ? formatPlural(language, shared.nutrition.goalWeeks, goal.timeframe.weeks)
      : fill(shared.nutrition.goalByDate, { date: formatDateShort(goal.timeframe.date, language) });
  return {
    startKg,
    latestKg: latestKg !== undefined && latestKg !== startKg ? latestKg : undefined,
    targetKg: goal.targetWeightKg,
    progress,
    summary: [
      // A signed number keeps its sign in front in Hebrew too.
      change ? `${isolateLtr(`${change > 0 ? '+' : '−'}${number(Math.abs(change))}`)} ${shared.units.kg}` : undefined,
      timeframe,
      change && weeks ? fill(copy.goalRate, { amount: isolateLtr(number(Math.abs(change) / weeks)) }) : undefined,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function text(value: string | undefined): AnswerValue | null {
  const trimmed = value?.trim();
  return trimmed ? { kind: 'text', text: trimmed } : null;
}

function pills(items: string[]): AnswerValue | null {
  return items.length > 0 ? { kind: 'pills', items } : null;
}

/**
 * Her answers, arranged for the coach: the key numbers, what to notice before building, and the
 * sections in the order they help — goals & nutrition, training, exercise preferences, personal
 * details last. `latestWeightKg` = her newest weigh-in, when one is known.
 */
export function buildQuestionnaireProfile(onboarding: MyOnboarding, language: Language, today: Date, latestWeightKg?: number): QuestionnaireProfile {
  const copy = traineesCopy[language];
  const shared = sharedCopy[language];
  const labels = shared.onboardingSections;
  const options = shared.onboardingOptions;
  const nutrition = shared.nutrition;
  const answers = onboarding.answers;
  const frequency = answers?.trainingFrequency;
  const preferences = answers?.nutritionPreferences;
  const optionLabels = (ids: string[] | undefined, map: Readonly<Record<string, string>>) => (ids ?? []).map((id) => map[id] ?? humanizeId(id));
  // A chosen option with her own words about it: "Lactose-free (yogurt is fine)".
  const itemLabels = <T extends string>(items: readonly PreferenceItem<T>[] | undefined, map: Readonly<Record<T, string>>) =>
    (items ?? []).map((item) => (item.details ? fill(nutrition.itemWithDetails, { label: map[item.id] ?? item.id, details: isolateAuto(item.details) }) : (map[item.id] ?? item.id)));
  const days = frequency ? (frequency.minDays === frequency.maxDays ? String(frequency.minDays) : `${frequency.minDays}–${frequency.maxDays}`) : undefined;
  const age = answers?.birthDate ? ageInYears(answers.birthDate, today) : undefined;
  const unitLabel = (unit: string | undefined) => (unit ? ((shared.units as Record<string, string>)[unit] ?? unit) : undefined);
  const dietType = preferences ? (nutrition.dietTypes[preferences.dietType] ?? preferences.dietType) : undefined;

  const keyNumbers: KeyNumber[] = [];
  if (age !== undefined) keyNumbers.push({ id: 'age', label: copy.age, value: String(age) });
  if (answers?.height !== undefined) keyNumbers.push({ id: 'height', label: labels.height, value: String(answers.height), unit: shared.units.cm });
  if (answers?.weight !== undefined) keyNumbers.push({ id: 'weight', label: labels.weight, value: String(answers.weight), unit: shared.units.kg });
  if (days) keyNumbers.push({ id: 'days', label: labels.daysPerWeek, value: days });

  const sections: AnswerSectionView[] = [
    {
      id: 'goals',
      title: labels.nutritionAndGoal,
      rows: [
        { id: 'goals', label: labels.goals, value: pills(optionLabels(answers?.goals, options.goals)) },
        {
          id: 'weightGoal',
          label: labels.weightGoal,
          value: answers?.weightGoal ? { kind: 'weightGoal', goal: weightGoalView(answers.weightGoal, answers.weight, latestWeightKg, language) } : null,
        },
        {
          id: 'diet',
          label: nutrition.preferences.diet,
          value: text(dietType && preferences?.dietTypeDetails ? fill(nutrition.itemWithDetails, { label: dietType, details: isolateAuto(preferences.dietTypeDetails) }) : dietType),
        },
        { id: 'dietStyle', label: nutrition.preferences.dietStyle, value: pills(itemLabels(preferences?.dietStyles, nutrition.dietStyles)) },
        { id: 'religious', label: nutrition.preferences.religious, value: pills(itemLabels(preferences?.religious, nutrition.religious)) },
        // She answered the step and chose none: that is an answer ("None"), not an empty field.
        {
          id: 'intolerances',
          label: nutrition.preferences.intolerances,
          value: preferences ? (pills(itemLabels(preferences.intolerances, nutrition.intolerances)) ?? text(shared.common.noneChosen)) : null,
        },
        {
          id: 'allergies',
          label: nutrition.preferences.allergies,
          value: preferences ? (pills(itemLabels(preferences.allergies, nutrition.allergies)) ?? text(shared.common.noneChosen)) : null,
        },
        { id: 'loves', label: nutrition.preferences.loves, value: text(preferences?.foodsLoved) },
        { id: 'dislikes', label: nutrition.preferences.dislikes, value: text(preferences?.foodsDisliked) },
        {
          id: 'mealsPerDay',
          label: nutrition.preferences.mealsPerDay,
          value: preferences ? text(preferences.mealsPerDay ? String(preferences.mealsPerDay) : shared.common.noPreference) : null,
        },
      ],
    },
    {
      id: 'training',
      title: copy.workouts,
      rows: [
        { id: 'daysPerWeek', label: labels.daysPerWeek, value: text(days ? isolateLtr(days) : undefined) },
        { id: 'flexibleSchedule', label: labels.flexibleSchedule, value: text(frequency ? (frequency.flexibleSchedule ? shared.common.yes : shared.common.no) : undefined) },
        { id: 'trainingExperience', label: labels.trainingExperience, value: text(answers?.trainingExperience ? options.trainingExperience[answers.trainingExperience] : undefined) },
        { id: 'preferredActivities', label: labels.preferredActivities, value: pills(optionLabels(answers?.preferredActivities, options.activities)) },
        { id: 'equipment', label: labels.equipment, value: pills(optionLabels(answers?.equipment, options.equipment)) },
      ],
    },
    {
      id: 'exercises',
      title: labels.exercisePreferences,
      rows: [
        { id: 'muscleFocus', label: labels.muscleFocus, value: pills(optionLabels(answers?.exercisePreferences?.muscleFocus, options.muscleFocus)) },
        { id: 'favoriteExercises', label: labels.favoriteExercises, value: text(answers?.exercisePreferences?.favoriteExerciseNotes) },
        { id: 'wantsToImprove', label: labels.wantsToImprove, value: text(answers?.exercisePreferences?.improvementExerciseNotes) },
      ],
    },
    {
      id: 'personal',
      title: labels.basicProfile,
      rows: [
        { id: 'name', label: labels.name, value: text(onboarding.name) },
        {
          id: 'birthDate',
          label: labels.birthDate,
          value: text(
            answers?.birthDate
              ? [formatDateShort(answers.birthDate.slice(0, 10), language), age !== undefined ? fill(copy.ageYears, { age }) : undefined].filter(Boolean).join(' · ')
              : undefined,
          ),
        },
        { id: 'gender', label: labels.gender, value: text(answers?.gender ? ((options.gender as Record<string, string>)[answers.gender] ?? humanizeId(answers.gender)) : undefined) },
        // Height and weight are key numbers; they only get a row here while they are missing.
        ...(answers?.height === undefined ? [{ id: 'height', label: labels.height, value: null }] : []),
        ...(answers?.weight === undefined ? [{ id: 'weight', label: labels.weight, value: null }] : []),
        {
          id: 'preferredUnits',
          label: labels.preferredUnits,
          value: text(onboarding.units ? [unitLabel(onboarding.units.weight), unitLabel(onboarding.units.distance)].filter(Boolean).join(' / ') : undefined),
        },
      ],
    },
  ];

  // What can change the programming: her recovery flags and note, and what she must not eat.
  const attention: AttentionItem[] = [
    ...(answers?.recovery?.notes?.trim() ? [{ id: 'recovery-notes', source: copy.noteSource, text: answers.recovery.notes.trim() }] : []),
    ...optionLabels(answers?.recovery?.flags, options.recoveryFlags).map((flag, index) => ({ id: `recovery-${index}`, source: labels.recovery, text: flag })),
    ...itemLabels(preferences?.allergies, nutrition.allergies).map((item, index) => ({ id: `allergy-${index}`, source: nutrition.preferences.allergies, text: item })),
    ...itemLabels(preferences?.intolerances, nutrition.intolerances).map((item, index) => ({ id: `intolerance-${index}`, source: nutrition.preferences.intolerances, text: item })),
  ];

  return {
    keyNumbers,
    sections,
    attention,
    missing: sections.flatMap((section) => section.rows.filter((row) => row.value === null).map((row) => row.label)),
  };
}
