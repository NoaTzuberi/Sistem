/**
 * Seeds Sistem's ready-made workout templates (createdBy: null) — 10 per
 * category (upper_body/push/pull/legs/full_body/core), each with 6-8
 * exercises drawn from a curated real-exercise pool per category. Manual/dev
 * script only — not run automatically at startup, same pattern as
 * importExercises.ts. Re-running replaces the whole system template set; it
 * never touches user-created templates (createdBy !== null).
 *
 * Publishes whatever exercises it references (reviewStatus: 'published') so
 * they're consistently visible in both the Exercise Library and Workouts —
 * most of this pool sits unpublished in the wider ~2,900-exercise Kaggle
 * import until a template (or the sample-publish script) surfaces it.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Exercise } from '../../exercises/exercise.model';
import { WorkoutTemplate } from '../workoutTemplate.model';
import type { WorkoutCategory, WorkoutGoal } from '../workoutTemplate.constants';
import type { Difficulty } from '../../exercises/exercise.constants';

interface PoolExercise {
  slug: string;
  defaultSets: number;
  defaultReps: string;
  restTime: number;
}

const PUSH_POOL: PoolExercise[] = [
  { slug: 'bench-press', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'incline-bench-press', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'dumbbell-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'incline-dumbbell-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'decline-dumbbell-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'close-grip-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'wide-grip-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'dumbbell-flyes', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'pushups', defaultSets: 3, defaultReps: '12-20', restTime: 60 },
  { slug: 'incline-push-up', defaultSets: 3, defaultReps: '12-15', restTime: 60 },
  { slug: 'decline-push-up', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'military-press', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'barbell-shoulder-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'seated-barbell-shoulder-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'behind-the-neck-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'side-lying-lateral-raise', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'plate-loaded-lateral-raise', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'dumbbell-reverse-fly', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'dumbbell-skullcrusher', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'standing-dumbbell-triceps-extension', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'tricep-dumbbell-kickback', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
];

const PULL_POOL: PoolExercise[] = [
  { slug: 'pull-up', defaultSets: 4, defaultReps: '6-10', restTime: 90 },
  { slug: 'pullups', defaultSets: 4, defaultReps: '6-10', restTime: 90 },
  { slug: 'chin-up', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'lat-pull-down', defaultSets: 3, defaultReps: '8-12', restTime: 75 },
  { slug: 'close-grip-pull-down', defaultSets: 3, defaultReps: '8-12', restTime: 75 },
  { slug: 'reverse-grip-lat-pulldown', defaultSets: 3, defaultReps: '8-12', restTime: 75 },
  { slug: 'seated-cable-rows', defaultSets: 3, defaultReps: '8-12', restTime: 75 },
  { slug: 'bent-over-barbell-row', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'pendlay-row', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'one-arm-kettlebell-row', defaultSets: 3, defaultReps: '10-12', restTime: 75 },
  { slug: 'barbell-curl', defaultSets: 3, defaultReps: '8-10', restTime: 60 },
  { slug: 'hammer-curls', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'dumbbell-bicep-curl', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'incline-db-curl', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'concentration-curl', defaultSets: 3, defaultReps: '10-12', restTime: 45 },
  { slug: 'preacher-curl', defaultSets: 3, defaultReps: '8-10', restTime: 60 },
  { slug: 'dumbbell-preacher-curl', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
];

const UPPER_BODY_POOL: PoolExercise[] = [
  { slug: 'bench-press', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'incline-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'dumbbell-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'pushups', defaultSets: 3, defaultReps: '12-20', restTime: 60 },
  { slug: 'military-press', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'barbell-shoulder-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'side-lying-lateral-raise', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'dumbbell-reverse-fly', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'pull-up', defaultSets: 4, defaultReps: '6-10', restTime: 90 },
  { slug: 'chin-up', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'lat-pull-down', defaultSets: 3, defaultReps: '8-12', restTime: 75 },
  { slug: 'seated-cable-rows', defaultSets: 3, defaultReps: '8-12', restTime: 75 },
  { slug: 'bent-over-barbell-row', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'pendlay-row', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'barbell-curl', defaultSets: 3, defaultReps: '8-10', restTime: 60 },
  { slug: 'hammer-curls', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'preacher-curl', defaultSets: 3, defaultReps: '8-10', restTime: 60 },
  { slug: 'dumbbell-skullcrusher', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'standing-dumbbell-triceps-extension', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'tricep-dumbbell-kickback', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
];

const LEGS_POOL: PoolExercise[] = [
  { slug: 'barbell-squat', defaultSets: 4, defaultReps: '5-8', restTime: 150 },
  { slug: 'front-squat', defaultSets: 4, defaultReps: '6-8', restTime: 120 },
  { slug: 'smith-machine-front-squat', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'cossack-squat', defaultSets: 3, defaultReps: '10-12', restTime: 75 },
  { slug: 'leg-press', defaultSets: 4, defaultReps: '10-12', restTime: 90 },
  { slug: 'leg-extensions', defaultSets: 3, defaultReps: '12-15', restTime: 60 },
  { slug: 'bodyweight-squat', defaultSets: 3, defaultReps: '15-20', restTime: 60 },
  { slug: 'forward-lunge', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'barbell-walking-lunge', defaultSets: 3, defaultReps: '10-12', restTime: 75 },
  { slug: 'barbell-deadlift', defaultSets: 4, defaultReps: '5-6', restTime: 150 },
  { slug: 'romanian-deadlift', defaultSets: 3, defaultReps: '8-10', restTime: 120 },
  { slug: 'stiff-legged-deadlift', defaultSets: 3, defaultReps: '8-10', restTime: 120 },
  { slug: 'lying-leg-curls', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'leg-curl', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'glute-bridge', defaultSets: 3, defaultReps: '12-15', restTime: 60 },
  { slug: 'barbell-hip-thrust', defaultSets: 4, defaultReps: '8-10', restTime: 90 },
  { slug: 'standing-calf-raises', defaultSets: 4, defaultReps: '12-15', restTime: 45 },
  { slug: 'seated-calf-raise', defaultSets: 4, defaultReps: '12-15', restTime: 45 },
];

const CORE_POOL: PoolExercise[] = [
  { slug: 'crunch', defaultSets: 3, defaultReps: '15-20', restTime: 45 },
  { slug: 'banded-crunch', defaultSets: 3, defaultReps: '15-20', restTime: 45 },
  { slug: 'mountain-climbers', defaultSets: 3, defaultReps: '30s', restTime: 45 },
  { slug: 'bench-leg-pull-in', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'stability-ball-knee-tuck', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'barbell-side-bend', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'barbell-roll-out', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'decline-plate-sit-up', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'kettlebell-swing', defaultSets: 3, defaultReps: '15-20', restTime: 60 },
  { slug: 'burpee-over-kettlebell', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'kettlebell-windmill', defaultSets: 3, defaultReps: '8-10', restTime: 45 },
  { slug: 'seated-bar-twist', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'band-low-to-high-twist', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'kettlebell-crab-reach', defaultSets: 3, defaultReps: '8-10', restTime: 45 },
  { slug: 'kettlebell-toe-touch', defaultSets: 3, defaultReps: '12-15', restTime: 45 },
  { slug: 'two-way-swing', defaultSets: 3, defaultReps: '12-15', restTime: 60 },
];

const FULL_BODY_POOL: PoolExercise[] = [
  { slug: 'barbell-deadlift', defaultSets: 3, defaultReps: '5-6', restTime: 150 },
  { slug: 'front-squat', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'bench-press', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'pull-up', defaultSets: 3, defaultReps: '6-10', restTime: 90 },
  { slug: 'military-press', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'bent-over-barbell-row', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'barbell-squat', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'dumbbell-bench-press', defaultSets: 3, defaultReps: '8-10', restTime: 90 },
  { slug: 'pendlay-row', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'barbell-walking-lunge', defaultSets: 3, defaultReps: '10-12', restTime: 75 },
  { slug: 'romanian-deadlift', defaultSets: 3, defaultReps: '8-10', restTime: 120 },
  { slug: 'push-press', defaultSets: 3, defaultReps: '6-8', restTime: 120 },
  { slug: 'kettlebell-swing', defaultSets: 3, defaultReps: '15-20', restTime: 60 },
  { slug: 'burpee', defaultSets: 3, defaultReps: '10-12', restTime: 60 },
  { slug: 'mountain-climbers', defaultSets: 3, defaultReps: '30s', restTime: 45 },
];

interface CategoryConfig {
  category: WorkoutCategory;
  pool: PoolExercise[];
  templates: Array<{ name: string; description: string }>;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    category: 'upper_body',
    pool: UPPER_BODY_POOL,
    templates: [
      { name: 'Upper Body A', description: 'A bench-press-first session covering chest, back, and arms in one workout.' },
      { name: 'Upper Body B', description: 'An overhead-press-and-pull-up session for shoulders, back, and arms.' },
      { name: 'Upper Body Strength', description: 'Heavy, low-rep pressing and pulling work across the whole upper body.' },
      { name: 'Upper Body Hypertrophy', description: 'Higher-volume pressing, pulling, and arm work for upper-body size.' },
      { name: 'Push & Pull Circuit', description: 'A circuit alternating pressing and pulling movements for full upper-body coverage.' },
      { name: 'Chest, Back & Arms', description: 'A complete session touching chest, back, shoulders, biceps, and triceps.' },
      { name: 'Beginner Upper Body', description: 'A straightforward upper-body session covering the pressing and pulling basics.' },
      { name: 'Advanced Upper Body Strength', description: 'A demanding session combining heavy barbell pressing with weighted pulling.' },
      { name: 'Upper Body Pump', description: 'A higher-rep session built to maximize pump across chest, back, and arms.' },
      { name: 'Complete Upper Body', description: 'A well-rounded upper-body session covering every major pushing and pulling pattern.' },
    ],
  },
  {
    category: 'push',
    pool: PUSH_POOL,
    templates: [
      { name: 'Push Day A', description: 'A classic bench-press-first push session for chest, shoulders, and triceps.' },
      { name: 'Push Day B', description: 'An incline-focused push session for upper chest and shoulder development.' },
      { name: 'Push Power', description: 'Heavy, low-rep pressing work for raw pushing strength.' },
      { name: 'Push Hypertrophy', description: 'Higher-volume pressing and isolation work for chest, shoulder, and triceps size.' },
      { name: 'Chest & Shoulders Focus', description: 'A chest-and-shoulder-dominant session with lighter triceps finishing work.' },
      { name: 'Triceps & Chest Blast', description: 'Close-grip and isolation work to hammer the triceps alongside chest pressing.' },
      { name: 'Beginner Push', description: 'A straightforward push session covering the pressing basics for newer lifters.' },
      { name: 'Advanced Push Strength', description: 'A demanding push session combining heavy barbell pressing with targeted accessories.' },
      { name: 'Push Pyramid', description: 'A pressing-focused session moving from compound lifts into isolation work.' },
      { name: 'Upper Push Circuit', description: 'A varied push circuit mixing barbell, dumbbell, and bodyweight pressing.' },
    ],
  },
  {
    category: 'pull',
    pool: PULL_POOL,
    templates: [
      { name: 'Pull Day A', description: 'A pull-up-first back session finished with curls for the biceps.' },
      { name: 'Pull Day B', description: 'A rowing-focused pull session for back thickness and bicep strength.' },
      { name: 'Back Width Focus', description: 'Pull-downs and pull-ups to emphasize lat width.' },
      { name: 'Back Thickness Focus', description: 'Heavy rowing work to build a thicker, denser back.' },
      { name: 'Pull Hypertrophy', description: 'Higher-volume pulling and curling work for back and bicep size.' },
      { name: 'Row & Curl Circuit', description: 'A circuit alternating rowing movements with bicep isolation.' },
      { name: 'Beginner Pull', description: 'A straightforward pull session covering the rowing and pulldown basics.' },
      { name: 'Advanced Pull Strength', description: 'A demanding pull session combining heavy rows with weighted pull-ups.' },
      { name: 'Lat Focus', description: 'A lat-dominant session of pulldowns, pull-ups, and rows.' },
      { name: 'Back & Biceps Blast', description: 'A complete back-and-biceps session covering pulling and curling patterns.' },
    ],
  },
  {
    category: 'legs',
    pool: LEGS_POOL,
    templates: [
      { name: 'Leg Day A', description: 'A squat-first leg session covering quads, hamstrings, and calves.' },
      { name: 'Leg Day B', description: 'A deadlift-first leg session for posterior chain and quad development.' },
      { name: 'Quad Focus', description: 'Squat and leg-extension work to emphasize the quads.' },
      { name: 'Posterior Chain Focus', description: 'Deadlift variations and leg curls for hamstrings and glutes.' },
      { name: 'Glute Builder', description: 'Hip thrusts, bridges, and lunges to target the glutes.' },
      { name: 'Leg Hypertrophy', description: 'Higher-volume leg work across squats, lunges, and isolation movements.' },
      { name: 'Beginner Legs', description: 'A straightforward leg session covering the squat and lunge basics.' },
      { name: 'Advanced Leg Strength', description: 'A demanding leg session combining heavy squats and deadlifts.' },
      { name: 'Squat & Deadlift Day', description: 'A strength-focused session built around the two big compound lifts.' },
      { name: 'Lower Body Circuit', description: 'A varied lower-body circuit mixing barbell, machine, and bodyweight work.' },
    ],
  },
  {
    category: 'full_body',
    pool: FULL_BODY_POOL,
    templates: [
      { name: 'Full Body A', description: 'A compound-lift-driven full-body session covering squat, press, and pull patterns.' },
      { name: 'Full Body B', description: 'A deadlift-first full-body session balancing pulling, pressing, and leg work.' },
      { name: 'Full Body Strength', description: 'Heavy, low-rep compound lifts across every major movement pattern.' },
      { name: 'Full Body Conditioning', description: 'A full-body session covering push, pull, legs, and conditioning.' },
      { name: 'Full Body Circuit', description: 'A circuit-style session moving quickly between compound lifts.' },
      { name: 'Beginner Full Body', description: 'A straightforward full-body session covering the core compound lifts.' },
      { name: 'Advanced Full Body', description: 'A demanding full-body session combining heavy compounds with conditioning finishers.' },
      { name: 'Full Body Power', description: 'Explosive and heavy compound work across the whole body.' },
      { name: 'Total Body Blast', description: 'A high-effort full-body session mixing strength work with conditioning.' },
      { name: 'Functional Full Body', description: 'A full-body session built around fundamental human movement patterns.' },
    ],
  },
  {
    category: 'core',
    pool: CORE_POOL,
    templates: [
      { name: 'Core Circuit A', description: 'A varied core circuit covering flexion, rotation, and anti-extension.' },
      { name: 'Core Circuit B', description: 'A kettlebell-driven core and conditioning circuit.' },
      { name: 'Ab Blast', description: 'A high-rep session targeting the abdominals directly.' },
      { name: 'Core Stability', description: 'Anti-rotation and stability-focused core work.' },
      { name: 'Rotational Core', description: 'Twisting and rotational movements for obliques and core control.' },
      { name: 'Weighted Core', description: 'Loaded core work using barbells and kettlebells.' },
      { name: 'Beginner Core', description: 'A straightforward core session covering the fundamentals.' },
      { name: 'Advanced Core', description: 'A demanding core session combining loaded and dynamic movements.' },
      { name: 'Core & Conditioning', description: 'Core work paired with kettlebell conditioning movements.' },
      { name: 'Core Endurance', description: 'Higher-rep, longer-duration core work for muscular endurance.' },
    ],
  },
];

const WINDOW_SIZES = [6, 7, 8, 6, 7, 8, 6, 7, 8, 7];
const GOAL_CYCLE: WorkoutGoal[][] = [
  ['strength'],
  ['hypertrophy'],
  ['endurance'],
  ['strength', 'hypertrophy'],
  ['hypertrophy', 'endurance'],
];

function difficultyFor(index: number): Difficulty {
  if (index < 3) return 'beginner';
  if (index < 8) return 'intermediate';
  return 'advanced';
}

function pickExercises(pool: PoolExercise[], offset: number, windowSize: number): PoolExercise[] {
  const result: PoolExercise[] = [];
  for (let i = 0; i < windowSize; i += 1) {
    result.push(pool[(offset + i) % pool.length]);
  }
  return result;
}

interface SeedTemplate {
  name: string;
  description: string;
  category: WorkoutCategory;
  goal: WorkoutGoal[];
  difficulty: Difficulty;
  duration: number;
  exercises: Array<PoolExercise & { order: number }>;
}

function buildTemplates(): SeedTemplate[] {
  const templates: SeedTemplate[] = [];

  for (const config of CATEGORY_CONFIGS) {
    config.templates.forEach((meta, index) => {
      const windowSize = WINDOW_SIZES[index];
      const offset = (index * 3) % config.pool.length;
      const picked = pickExercises(config.pool, offset, windowSize);
      const difficulty = difficultyFor(index);

      templates.push({
        name: meta.name,
        description: meta.description,
        category: config.category,
        goal: GOAL_CYCLE[index % GOAL_CYCLE.length],
        difficulty,
        duration: 25 + windowSize * 4,
        exercises: picked.map((entry, i) => ({ ...entry, order: i + 1 })),
      });
    });
  }

  return templates;
}

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  await mongoose.connect(dbUrl);

  const templates = buildTemplates();
  const allSlugs = [...new Set(templates.flatMap((t) => t.exercises.map((e) => e.slug)))];

  const exercises = await Exercise.find({ slug: { $in: allSlugs } }).select('slug').lean();
  const slugToId = new Map(exercises.map((e) => [e.slug, e._id]));

  const missing = allSlugs.filter((slug) => !slugToId.has(slug));
  if (missing.length > 0) {
    throw new Error(`Missing exercises for slugs: ${missing.join(', ')}`);
  }

  await Exercise.updateMany({ slug: { $in: allSlugs } }, { $set: { reviewStatus: 'published' } });

  await WorkoutTemplate.deleteMany({ createdBy: null });

  const docs = templates.map((template) => ({
    name: template.name,
    description: template.description,
    goal: template.goal,
    difficulty: template.difficulty,
    duration: template.duration,
    category: template.category,
    createdBy: null,
    exercises: template.exercises.map((e) => ({
      exerciseId: slugToId.get(e.slug),
      order: e.order,
      defaultSets: e.defaultSets,
      defaultReps: e.defaultReps,
      restTime: e.restTime,
    })),
  }));

  await WorkoutTemplate.insertMany(docs);

  console.log(`Published ${allSlugs.length} exercises and seeded ${docs.length} ready-made workout templates.`);
  CATEGORY_CONFIGS.forEach((c) => {
    const count = docs.filter((d) => d.category === c.category).length;
    console.log(`  ${c.category}: ${count}`);
  });

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
