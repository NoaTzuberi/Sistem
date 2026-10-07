import type { AiTraineeProfile } from '@sistem/types';
import type { OnboardingAnswersFields } from '../../onboarding/onboardingResponse.model';
import { FREE_TEXT_MAX_LENGTH } from './trainingPlan.constants';

// What the model may know about a trainee (owner decision, Phase 12): her answers by
// option id, rounded numbers, her age instead of her birth date, and her three free-text
// answers cleaned up. Never her name, email, ids, photos, logs or body history.

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// A run of digits with phone-like separators; replaced only when it holds 7+ digits,
// so "3x10", "2019" or "60-80 kg" stay.
const PHONE_CANDIDATE_PATTERN = /\+?\d[\d\s().-]{5,}\d/g;
const PHONE_MIN_DIGITS = 7;

export function scrubFreeText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(EMAIL_PATTERN, '[email removed]')
    .replace(PHONE_CANDIDATE_PATTERN, (match) =>
      match.replace(/\D/g, '').length >= PHONE_MIN_DIGITS ? '[phone removed]' : match,
    )
    .trim();
  if (!cleaned) return undefined;
  return cleaned.length > FREE_TEXT_MAX_LENGTH ? `${cleaned.slice(0, FREE_TEXT_MAX_LENGTH).trimEnd()}…` : cleaned;
}

export function ageInYears(birthDate: Date, now: Date): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function buildTraineeProfile(answers: OnboardingAnswersFields, now: Date): AiTraineeProfile {
  const frequency = answers.trainingFrequency;
  return {
    ageYears: answers.birthDate ? ageInYears(answers.birthDate, now) : undefined,
    heightCm: answers.height !== undefined ? Math.round(answers.height) : undefined,
    weightKg: answers.weight !== undefined ? Math.round(answers.weight) : undefined,
    gender: answers.gender || undefined,
    goals: answers.goals ?? [],
    trainingDays: frequency
      ? { min: frequency.minDays, max: frequency.maxDays, flexible: Boolean(frequency.flexibleSchedule) }
      : undefined,
    preferredActivities: answers.preferredActivities ?? [],
    muscleFocus: answers.exercisePreferences?.muscleFocus ?? [],
    equipment: answers.equipment ?? [],
    recoveryFlags: (answers.recovery?.flags ?? []).filter((flag) => flag !== 'nothing_to_add'),
    notes: {
      favoriteExercises: scrubFreeText(answers.exercisePreferences?.favoriteExerciseNotes),
      exercisesToImprove: scrubFreeText(answers.exercisePreferences?.improvementExerciseNotes),
      recovery: scrubFreeText(answers.recovery?.notes),
    },
  };
}

/**
 * The search text for the training-knowledge passages (RAG). Built from option ids
 * only — her free text is not sent to the embeddings provider.
 */
export function buildKnowledgeQuery(profile: AiTraineeProfile): string {
  const words = (ids: string[]) => ids.map((id) => id.replace(/_/g, ' ')).join(', ');
  const parts = [
    profile.goals.length > 0 ? `Goals: ${words(profile.goals)}.` : '',
    profile.trainingDays ? `Training ${profile.trainingDays.min}-${profile.trainingDays.max} days a week.` : '',
    profile.muscleFocus.length > 0 ? `Muscle focus: ${words(profile.muscleFocus)}.` : '',
    profile.recoveryFlags.length > 0 ? `Recovery: ${words(profile.recoveryFlags)}.` : '',
    profile.preferredActivities.length > 0 ? `Enjoys: ${words(profile.preferredActivities)}.` : '',
  ];
  return parts.filter(Boolean).join(' ') || 'General fitness training plan.';
}
