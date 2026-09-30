/**
 * Seeds the RAG knowledge base — hand-written documents covering training
 * principles, programming, recovery, and coaching style (docs/06_RAG_KNOWLEDGE_PLAN.md
 * categories 2-6; category 1, exercises, is served directly from the Exercise
 * collection via tools and is intentionally not duplicated here).
 *
 * Manual/dev script only, not run automatically at startup — same pattern as
 * every other seed script in this project. Re-running replaces the whole
 * knowledge base. Requires VOYAGE_API_KEY.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { KnowledgeChunk } from '../knowledge.model';
import { embedDocuments } from '../embeddings';
import type { KnowledgeType } from '../knowledge.constants';

interface SeedDoc {
  type: KnowledgeType;
  source: string;
  content: string;
}

const DOCS: SeedDoc[] = [
  // ── Training principles ──────────────────────────────────────────────
  {
    type: 'training',
    source: 'Progressive Overload — Overview',
    content:
      'Progressive overload is the gradual increase of training demand over time, and it is the primary driver of long-term strength and muscle gains. Without a rising demand, the body has no reason to keep adapting — performance plateaus. Overload can be applied gradually and does not require adding weight every single session; consistency over months matters more than any one workout.',
  },
  {
    type: 'training',
    source: 'Progressive Overload — Ways to Apply It',
    content:
      'There are several ways to apply progressive overload besides adding weight: increasing reps at the same weight, adding an extra set, reducing rest between sets, improving range of motion or technique on the same load, or increasing training frequency for a muscle group. When weight increases stall, rotating to one of these other levers is usually more sustainable than forcing heavier weight with worse form.',
  },
  {
    type: 'training',
    source: 'Strength Training — Rep Ranges and Intensity',
    content:
      'Strength-focused training typically uses lower rep ranges (roughly 3-6 reps) at higher intensity (a high percentage of the heaviest weight a person can lift once). This emphasizes neural adaptations and maximal force production over metabolic fatigue. Compound, multi-joint lifts (squat, deadlift, bench press, overhead press, rows) are the most efficient exercises for building raw strength because they load the most muscle mass per set.',
  },
  {
    type: 'training',
    source: 'Strength Training — Rest Periods',
    content:
      'Strength work needs longer rest periods than hypertrophy work — typically 2-5 minutes between sets of heavy compound lifts. Cutting rest short on max-effort sets reduces the weight that can be lifted on the next set and blunts the strength stimulus. For accessory/isolation work in the same session, shorter rest (60-90 seconds) is fine since the load is lighter.',
  },
  {
    type: 'training',
    source: 'Hypertrophy — Muscle Growth Principles',
    content:
      'Muscle growth (hypertrophy) responds most reliably to mechanical tension combined with sufficient training volume, taken close to (but not always all the way to) muscular failure. A moderate rep range (roughly 8-15 reps) at moderate-to-high intensity is a practical, well-tolerated way to accumulate that tension across a session without excessive fatigue.',
  },
  {
    type: 'training',
    source: 'Hypertrophy — Volume and Frequency',
    content:
      'For hypertrophy, weekly volume per muscle group (total hard sets) matters more than any single workout. A common practical range is 10-20 hard sets per muscle group per week, spread across 2 or more sessions hitting that muscle — training a muscle group twice a week generally out-performs once a week at the same total volume, since it distributes fatigue and allows more frequent stimulus.',
  },
  {
    type: 'training',
    source: 'Endurance Training — Cardio Principles',
    content:
      'Endurance training improves the cardiovascular system\'s ability to deliver oxygen and the muscles\' ability to use it efficiently over time. Most of a well-rounded cardio program should be at an easy, conversational intensity (this builds the aerobic base with low fatigue cost), with a smaller portion at harder efforts to raise the ceiling. All-out effort every session leads to burnout and stalls progress rather than accelerating it.',
  },
  {
    type: 'training',
    source: 'Endurance Training — Conditioning and Interval Work',
    content:
      'Interval-style conditioning (alternating hard efforts with easier recovery periods) is an efficient way to improve both aerobic and anaerobic capacity in less total time than steady-state cardio alone. It pairs well with strength training since it can be dosed in short sessions without excessive fatigue carrying into the next lifting day, as long as it isn\'t stacked immediately before a heavy lower-body session.',
  },

  // ── Programming ───────────────────────────────────────────────────────
  {
    type: 'programming',
    source: 'Push Pull Legs Split',
    content:
      'The Push/Pull/Legs (PPL) split groups training by movement pattern: pushing muscles (chest, shoulders, triceps) on push day, pulling muscles (back, biceps) on pull day, and legs (quads, hamstrings, glutes, calves) on leg day. It suits people training 3-6 days a week, since the three-day cycle can repeat once (3 days/week) or twice (6 days/week) without excessive muscle overlap on consecutive days.',
  },
  {
    type: 'programming',
    source: 'Upper Lower Split',
    content:
      'An Upper/Lower split alternates between upper-body and lower-body sessions, commonly 4 days a week (two upper, two lower). It gives each muscle group two sessions of stimulus per week with more recovery between sessions than a daily-bodypart split, and works well for people who want a strength-and-hypertrophy balance without training 5-6 days a week.',
  },
  {
    type: 'programming',
    source: 'Full Body Split',
    content:
      'A Full Body split trains most major muscle groups in every session, typically 2-4 times a week with a rest day between sessions. It is well suited to beginners and to anyone training fewer than 4 days a week, because every session still delivers meaningful frequency per muscle group even with a low total number of weekly sessions.',
  },
  {
    type: 'programming',
    source: 'Workout Structure — Exercise Order',
    content:
      'A well-structured session generally orders exercises from most to least demanding: the main compound movement first (when the lifter is freshest and can lift the most weight safely), followed by secondary compound or multi-joint movements, then isolation work, with core or direct ab work typically last so fatigue there doesn\'t compromise stability on heavier lifts earlier in the session.',
  },
  {
    type: 'programming',
    source: 'Volume Management — Sets Per Muscle Group',
    content:
      'Total weekly sets per muscle group is one of the most useful levers for programming. Roughly 10-20 hard sets per week is a reasonable target range for most trained individuals seeking hypertrophy; beginners often progress well on the lower end of that range, while more advanced trainees may need more volume to keep progressing, as long as recovery keeps pace.',
  },
  {
    type: 'programming',
    source: 'Volume Management — Training Frequency',
    content:
      'Training frequency (how often a muscle group is trained per week) interacts with volume: the same weekly volume split across 2-3 sessions per muscle group is generally tolerated better and drives at least as much progress as cramming it all into one session. Very high per-session volume increases soreness and fatigue disproportionately without a matching benefit.',
  },

  // ── Recovery (including injury-aware modifications) ──────────────────
  {
    type: 'recovery',
    source: 'Rest and Recovery Days',
    content:
      'Rest days allow the adaptations that training stimulates — muscle repair, glycogen replenishment, nervous system recovery — to actually happen. Training the same muscle group hard every day without any lower-intensity or rest days eventually leads to declining performance (overreaching) rather than faster progress. At least one full rest day per week is a reasonable baseline for most training programs.',
  },
  {
    type: 'recovery',
    source: 'Sleep and Recovery',
    content:
      'Sleep is one of the most important recovery factors: most of the hormonal environment that supports muscle repair and growth is most active during deep sleep. Consistently short sleep (well under 7 hours) is associated with slower strength gains, worse workout quality, and higher perceived effort for the same training load, even when nutrition and programming are otherwise solid.',
  },
  {
    type: 'recovery',
    source: 'Mobility and Stretching Basics',
    content:
      'Mobility work (moving a joint through its full range under control) and stretching help maintain the range of motion needed to perform exercises safely and effectively. Dynamic mobility work before training (controlled movement through a range) tends to prepare the body better than long static holds, which are better suited to after training or on rest days when the goal is lengthening a tight muscle.',
  },
  {
    type: 'recovery',
    source: 'Training Around Shoulder Discomfort',
    content:
      'Shoulder discomfort during pressing movements is often related to range of motion, grip width, or bar path rather than a serious injury, but it should never be pushed through. General, non-diagnostic adjustments include reducing range of motion (e.g. a floor press or partial-range press instead of a full-range bench press), switching to a neutral or closer grip, or substituting a movement that keeps the elbows more tucked. A qualified professional should evaluate any discomfort that persists or worsens.',
  },
  {
    type: 'recovery',
    source: 'Training Around Knee Discomfort',
    content:
      'Knee discomfort during squatting or lunging movements can sometimes be reduced with adjustments such as a narrower or wider stance, box squats to control depth, or substituting leg press or split-squat variations that change the joint angles involved. These are general training adjustments, not a diagnosis — persistent or sharp knee pain warrants evaluation by a qualified professional before continuing to load it.',
  },
  {
    type: 'recovery',
    source: 'Training Around Lower Back Discomfort',
    content:
      'Lower back discomfort during hinge movements (deadlifts, rows, good mornings) is often linked to bracing, range of motion, or load management rather than a single cause. General adjustments include reducing the range of motion (e.g. a rack pull instead of a full deadlift), lowering the load and prioritizing bracing and technique, or substituting a machine-based or supported variation. Persistent or radiating pain should be evaluated by a qualified professional, not trained through.',
  },
  {
    type: 'recovery',
    source: 'General Principles for Training With Discomfort',
    content:
      'When a user reports discomfort during training, the safe response is to ask clarifying questions (where exactly, what movement, how long, sharp vs. dull), suggest general, conservative adjustments (reduced range, reduced load, alternative movement), and recommend seeing a qualified professional for anything that sounds acute, sharp, or persistent. It is never appropriate to diagnose a condition or claim certainty about its cause.',
  },

  // ── Coaching style ────────────────────────────────────────────────────
  {
    type: 'coaching',
    source: 'Asking Good Questions Before Recommending',
    content:
      'A good coach gathers enough context before recommending anything: available time, equipment, experience level, current soreness or limitations, and what the person actually enjoys. Recommending a specific workout or change without first checking these basics tends to produce advice that sounds generic and doesn\'t fit the person\'s actual situation.',
  },
  {
    type: 'coaching',
    source: 'Explaining the Reasoning Behind Recommendations',
    content:
      'Explaining the "why" behind a recommendation builds trust and helps the person make better decisions on their own over time. Instead of just stating a change, connect it to the underlying principle — for example, explaining that reducing exercise count preserves quality on the remaining movements when time is short, rather than just cutting the list without explanation.',
  },
  {
    type: 'coaching',
    source: 'Encouraging Consistency Over Intensity',
    content:
      'Long-term results come from consistent, sustainable training far more than from occasional maximal-effort sessions. A good coach frames small, repeatable wins (one more session this week than last week, a slightly better bench technique) as meaningful progress, rather than only celebrating personal records or implying that anything short of maximal effort doesn\'t count.',
  },
  {
    type: 'coaching',
    source: 'Communicating Without Overhyping',
    content:
      'Effective coaching communication is calm, professional, and specific rather than relying on generic hype or excessive enthusiasm. A message like "your consistency improved this month, so a small volume increase would be a good next step" respects the person\'s intelligence more than exaggerated excitement without real content behind it.',
  },
];

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  await mongoose.connect(dbUrl);

  const embeddings = await embedDocuments(DOCS.map((doc) => doc.content));

  await KnowledgeChunk.deleteMany({});

  await KnowledgeChunk.insertMany(
    DOCS.map((doc, i) => ({
      content: doc.content,
      embedding: embeddings[i],
      metadata: { type: doc.type, source: doc.source, exerciseId: null },
    })),
  );

  console.log(`Seeded ${DOCS.length} knowledge chunks.`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
