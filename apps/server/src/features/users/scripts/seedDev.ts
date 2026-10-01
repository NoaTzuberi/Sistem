/**
 * DEV ONLY: creates one coach and two trainees with completed onboarding.
 * Trainee 1 lands on the waiting screen; trainee 2 also gets a published plan for
 * the current week (so the app opens on Home) that shows the plan features:
 * a rep range, a superset, a time-based exercise and per-set targets.
 *
 *   npm run seed:dev                   (local database)
 *   npm run seed:dev -- --allow-remote (non-local dev database)
 *
 * Re-running is safe: existing seed accounts and plans are left as they are.
 * Same database guard as promote:coach.
 */
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import type { Types } from 'mongoose';
import type { OnboardingAnswersPayload } from '@sistem/types';
import { connectDatabase } from '../../../config/database';
import { User } from '../user.model';
import { DEFAULT_TIMEZONE } from '../users.constants';
import { resolveDefaultCoachId, assignUnassignedTrainees } from '../coachAssignment.service';
import { completeOnboarding } from '../../onboarding/onboarding.service';
import { validateCompleteOnboardingPayload } from '../../onboarding/onboarding.validation';
import { Plan } from '../../plans/plan.model';
import { currentWeekStart } from '../../plans/planWeek';
import type { PlanSetTargetFields } from '../../plans/plan.types';
import { Exercise } from '../../exercises/exercise.model';
import { assertDevDatabase } from './devDatabaseGuard';

const SEED_PASSWORD = 'sistem-dev-1234';
const SALT_ROUNDS = 12;

const COACH = { name: 'Dev Coach', email: 'coach@sistem.dev' };

const TRAINEES: { name: string; email: string; withPlan: boolean; onboarding: OnboardingAnswersPayload }[] = [
  {
    name: 'Dev Trainee One',
    email: 'trainee1@sistem.dev',
    withPlan: false,
    onboarding: {
      birthDate: '1995-04-12',
      height: 165,
      weight: 60,
      gender: 'female',
      units: { weight: 'kg', distance: 'km' },
      goals: ['build_muscle', 'increase_strength'],
      trainingFrequency: { minDays: 3, maxDays: 4, flexibleSchedule: true },
      preferredActivities: ['gym_strength_training', 'pilates'],
      exercisePreferences: { favoriteExerciseNotes: 'Hip thrusts', muscleFocus: ['glutes', 'legs'] },
      equipment: ['full_gym'],
      recovery: { flags: ['nothing_to_add'] },
    },
  },
  {
    name: 'Dev Trainee Two',
    email: 'trainee2@sistem.dev',
    withPlan: true,
    onboarding: {
      birthDate: '1990-09-30',
      height: 170,
      weight: 68,
      gender: 'female',
      units: { weight: 'kg', distance: 'km' },
      goals: ['lose_weight', 'improve_endurance'],
      trainingFrequency: { minDays: 2, maxDays: 3, flexibleSchedule: false },
      preferredActivities: ['running', 'functional_training'],
      exercisePreferences: { muscleFocus: ['core', 'full_body'] },
      equipment: ['dumbbells', 'resistance_bands'],
      recovery: { flags: ['prefers_low_impact'], notes: 'Knees get sore on long runs.' },
    },
  },
];

async function findOrCreateUser(name: string, email: string, fields: Record<string, unknown>) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`  exists   ${email} (${existing.role}) — left unchanged`);
    return { user: existing, created: false };
  }
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, timezone: DEFAULT_TIMEZONE, ...fields });
  console.log(`  created  ${email} (${user.role})`);
  return { user, created: true };
}

async function seedPlan(traineeId: Types.ObjectId, coachId: Types.ObjectId, timezone: string) {
  const weekStartDate = currentWeekStart(timezone);
  if (await Plan.exists({ traineeId, weekStartDate })) {
    console.log(`  exists   plan for week ${weekStartDate} — left unchanged`);
    return;
  }

  const exercises = await Exercise.find({ isActive: true }).sort({ name: 1 }).limit(4).select('_id').lean();
  if (exercises.length < 4) {
    console.warn('  note     fewer than 4 exercises in the library — run `npm run import:exercises` for a full plan.');
  }
  const [first, second, third, fourth] = exercises.map((exercise) => exercise._id);

  const lowerBody = [
    // Per-set targets: a warm-up, a pyramid and a drop set (sets is derived: 4).
    first && {
      exerciseId: first,
      sets: 4,
      notes: 'Slow on the way down, full range.',
      setTargets: [
        { type: 'warmup', reps: 12, targetWeight: 20, restSec: 60 },
        { type: 'working', reps: 10, targetWeight: 40, restSec: 90 },
        { type: 'working', reps: 8, targetWeight: 45, restSec: 90 },
        { type: 'drop', reps: 12, targetWeight: 30 },
      ] satisfies PlanSetTargetFields[],
    },
    // A superset: A1 + A2 back to back, with a rep range.
    second && { exerciseId: second, sets: 3, reps: 8, repsMax: 12, targetWeight: 12, restSec: 0, supersetGroup: 'A' },
    third && { exerciseId: third, sets: 3, reps: 10, restSec: 75, supersetGroup: 'A' },
  ].filter(Boolean);

  const core = [
    // Time-based: 3 × 45 s.
    fourth && { exerciseId: fourth, sets: 3, durationSec: 45, restSec: 30, notes: 'Keep your hips level.' },
  ].filter(Boolean);

  await Plan.create({
    traineeId,
    coachId,
    weekStartDate,
    status: 'published',
    publishedAt: new Date(),
    notes: 'Seed plan (DEV).',
    workouts: [
      { title: 'Lower Body', dayOfWeek: 0, order: 0, exercises: lowerBody },
      { title: 'Core & Conditioning', dayOfWeek: 3, order: 1, exercises: core },
    ],
  });
  console.log(`  created  published plan for week ${weekStartDate}`);
}

async function main() {
  const allowRemote = process.argv.slice(2).includes('--allow-remote');
  assertDevDatabase(allowRemote);

  await connectDatabase();
  try {
    console.log('Coach:');
    const { user: coach } = await findOrCreateUser(COACH.name, COACH.email, { role: 'coach', coachId: null });
    if (coach.role !== 'coach') {
      console.error(`${COACH.email} exists but is not a coach — stopping.`);
      process.exitCode = 1;
      return;
    }

    console.log('Trainees:');
    for (const trainee of TRAINEES) {
      const { user, created } = await findOrCreateUser(trainee.name, trainee.email, { coachId: coach._id });
      if (!created) continue;

      const payload = { name: trainee.name, ...trainee.onboarding };
      const validationError = validateCompleteOnboardingPayload(payload);
      if (validationError) throw new Error(`Seed onboarding for ${trainee.email} is invalid: ${validationError}`);
      await completeOnboarding(String(user._id), payload);
      console.log('           onboarding completed');

      if (trainee.withPlan) {
        await seedPlan(user._id, coach._id, user.timezone);
      }
    }

    const defaultCoachId = await resolveDefaultCoachId();
    if (defaultCoachId?.equals(coach._id)) {
      const assigned = await assignUnassignedTrainees(coach._id);
      if (assigned > 0) console.log(`Assigned ${assigned} other unassigned trainee(s) to ${COACH.email}.`);
    } else {
      console.log(`Note: ${COACH.email} is not the default coach for new sign-ups (see DEFAULT_COACH_EMAIL).`);
    }

    console.log(`\nPassword for every seed account: ${SEED_PASSWORD}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
