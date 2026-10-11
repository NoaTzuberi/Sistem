import type { Muscle, PatternId } from './exercise.constants';
import { cleanExerciseName } from './exerciseName';

// Movement-pattern tagging (Phase 12b): pure, from the factual fields only — the name, the
// body part and the library type. The dataset gives one body part per exercise and it is often
// wrong ("Leg Extension" under hamstrings, deadlifts under middle back), so the NAME decides
// first; the body part only settles generic words ("press", "curl") and fills in when the name
// says nothing. Nothing found → [] = unclear, listed for the coach.

interface NameRule {
  pattern: PatternId;
  match: RegExp;
  /** Skip the rule when this also matches. */
  unless?: RegExp;
}

/** Tier 1: specific names — the body part is ignored. Every matching rule adds its pattern. */
const NAME_RULES: NameRule[] = [
  {
    pattern: 'squat',
    match: /\bsquats?\b|leg press|\bsissy\b|wall sit|\bgoblet\b|thruster|wall ball/,
    unless: /split squat|bulgarian|pistol|single[- ]leg squat|skater squat|jump|squat thrust|cossack|curtsy/,
  },
  { pattern: 'lunge', match: /\blunges?\b|split squat|step[- ]?ups?\b|bulgarian|pistol|single[- ]leg squat|skater squat|curtsy|step[- ]?down|cossack/, unless: /jump/ },
  {
    pattern: 'hinge',
    match: /deadlift|\brdl\b|good ?mornings?|\bswings?\b|hip hinge|pull[- ]through|back extension|hyperextension|reverse hyper|rack pull|superman/,
  },
  { pattern: 'glute_bridge', match: /hip thrust|glute bridge|frog pump|single[- ]leg bridge|hip lift|\bbridges?\b/, unless: /plank|wrestler|neck|side bridge/ },
  { pattern: 'glute_isolation', match: /glute kick|donkey kick|hip extension|glute (?:press|machine)|cable kickback|\bkick[- ]?backs?\b.*\bglute|reverse hyper/ },
  { pattern: 'hip_abduction', match: /abduct|\bclam(?:shell)?s?\b|fire hydrant|band walk|lateral walk|monster walk|side[- ]lying (?:leg|hip) (?:lift|raise)|side[- ]lying abduction/ },
  { pattern: 'hip_adduction', match: /adduct|copenhagen/ },
  { pattern: 'knee_flexion', match: /leg curl|hamstring curl|nordic|glute[- ]ham|ball (?:leg |hamstring )?curl|hamstring slide|slider curl/ },
  { pattern: 'knee_extension', match: /leg extension|knee extension|quad extension/ },
  { pattern: 'calf_raise', match: /\bcalf\b|\bcalves\b|heel raise|toe raise/ },
  { pattern: 'horizontal_push', match: /bench press|push[- ]?ups?\b|press[- ]?ups?\b|chest press|floor press|\bdips?\b|svend press|pec press/, unless: /triceps? dip|bench dip|pike|handstand|close[- ]grip|incline .*pull/ },
  { pattern: 'horizontal_push', match: /\b(?:incline|decline|flat)\b.*\bpress\b/, unless: /shoulder|overhead|leg|calf|close[- ]grip/ },
  { pattern: 'chest_fly', match: /\bfly\b|\bflyes?\b|\bflys\b|cross[- ]?over|butterfly|pec dec/, unless: /reverse|rear|back fl|bent[- ]over|prone/ },
  {
    pattern: 'vertical_push',
    match: /overhead press|shoulder press|military press|\barnold\b|push[- ]press|pike push|handstand|landmine press|\bz[- ]press|\bjerk\b|thruster|behind[- ]the[- ]neck press|bradford|press behind neck/,
  },
  { pattern: 'shoulder_raise', match: /\b(?:lateral|side|front|y|lu|scaption|plate)[- ]raises?\b|upright row|6 way/ },
  {
    pattern: 'rear_delt',
    match: /rear[- ]delt|reverse fl(?:y|ye|yes)\b|face[- ]pulls?\b|back fl(?:y|yes)|bent[- ]over (?:lateral|raise|fly|flye)|pull[- ]aparts?\b|external rotation|internal rotation|prone [yt]\b/,
  },
  { pattern: 'horizontal_pull', match: /\brows?\b|inverted row|renegade/, unless: /upright row/ },
  { pattern: 'vertical_pull', match: /pull[- ]?ups?\b|chin[- ]?ups?\b|chins\b|pull[- ]?downs?\b|lat pull|pull[- ]?overs?\b|muscle[- ]up|rope climb/ },
  { pattern: 'shrug', match: /shrugs?\b/ },
  { pattern: 'elbow_flexion', match: /\bcurls?\b/, unless: /leg curl|hamstring curl|ball (?:leg |hamstring )?curl|nordic|wrist curl|slider curl|curl[- ]?up|toe curl/ },
  {
    pattern: 'elbow_extension',
    match: /triceps?\b|skull ?crushers?|pushdowns?|push[- ]downs?|close[- ]grip (?:bench|press|push)|bench dip|french press|\bjm press|tate press/,
  },
  // "Grip" alone is usually a hand position (close-grip, clean grip): only grip work counts.
  { pattern: 'forearm', match: /wrist|forearm|finger|pinch|grip (?:strength|trainer|hold|squeeze|crush)|gripper/ },
  {
    pattern: 'core',
    match:
      /crunch|sit[- ]?ups?\b|situps?\b|curl[- ]?ups?\b|plank|side bridge|leg raise|knee raise|v[- ]ups?\b|twist|wood ?chop|roll[- ]?outs?\b|ab wheel|dead ?bug|hollow|pallof|mountain climber|flutter kick|bicycle|toes[- ]to[- ]bar|jack ?knife|oblique|side bend|bird ?dog|l[- ]sit|windshield|wiper|anti[- ]rotation|heel touch|scissor|\babs?\b|stir the pot|body saw|dragon flag|hanging knee|tuck/,
    unless: /tuck jump/,
  },
  { pattern: 'carry', match: /carry|farmer|suitcase walk|yoke|waiter walk/ },
  {
    pattern: 'power',
    match: /\bcleans?\b|snatch|\bjerk\b|jump|\bhops?\b|\bbound|plyo|throw|slam|toss|chest pass|ball pass|chest push \(/,
    unless: /(?:clean|snatch)[- ]grip|jump(?:ing)? rope|rope jump/,
  },
  {
    pattern: 'conditioning',
    match: /burpee|sprint|jump(?:ing)? rope|rope jump|\bsled\b|\bdrag\b|tire flip|jumping jack|\bjacks?\b|high knees?|butt kick|shadow box|punch|battle rope|crawl|skater\b|\bskips?\b|stair|\brun\b|jog|man[- ]?maker/,
  },
  { pattern: 'mobility', match: /stretch|foam roll|mobility|\bsmr\b|lacrosse ball/ },
];

/** Tier 2: generic words, trusted only with a matching body part. */
const GUARDED_RULES: { pattern: PatternId; muscles: Muscle[]; match: RegExp }[] = [
  { pattern: 'horizontal_push', muscles: ['chest'], match: /\bpress\b/ },
  { pattern: 'vertical_push', muscles: ['shoulders'], match: /\bpress\b/ },
  { pattern: 'shoulder_raise', muscles: ['shoulders'], match: /\braises?\b/ },
  { pattern: 'elbow_extension', muscles: ['triceps'], match: /extension|kick[- ]?backs?|\bpress\b|\bdips?\b/ },
  { pattern: 'glute_isolation', muscles: ['glutes'], match: /kick|leg lift|leg raise|extension/ },
  { pattern: 'hinge', muscles: ['lower_back', 'hamstrings'], match: /stiff[- ]leg/ },
];

/** Tier 3: when the name says nothing, these body parts are unambiguous. */
const MUSCLE_FALLBACK: Partial<Record<Muscle, PatternId>> = {
  abdominals: 'core',
  calves: 'calf_raise',
  biceps: 'elbow_flexion',
  triceps: 'elbow_extension',
  forearms: 'forearm',
  traps: 'shrug',
  adductors: 'hip_adduction',
  abductors: 'hip_abduction',
};

/** More patterns than this on one exercise = a combo ("Burpee to Biceps Curl"): the coach decides. */
export const MAX_AUTO_PATTERNS = 2;

export interface PatternTagging {
  patterns: PatternId[];
  /** No pattern, or a combo of several: listed for the coach. */
  unclear: boolean;
}

export function tagPatterns(name: string, primaryMuscle: string | undefined, movementType: string): PatternTagging {
  if (movementType === 'cardio') return { patterns: ['conditioning'], unclear: false };
  if (movementType === 'mobility') return { patterns: ['mobility'], unclear: false };

  const lower = cleanExerciseName(name).toLowerCase();
  const found = new Set<PatternId>();
  for (const rule of NAME_RULES) {
    if (rule.match.test(lower) && !rule.unless?.test(lower)) found.add(rule.pattern);
  }
  // A plyometric version is power, not the strength lift it is named after.
  if (found.has('power') && /jump|hop|bound|plyo/.test(lower)) {
    found.delete('squat');
    found.delete('lunge');
    found.delete('horizontal_push');
  }
  // Close-grip pressing and dips on the triceps are a triceps exercise.
  if (found.has('elbow_extension') && found.has('horizontal_push') && primaryMuscle === 'triceps') found.delete('horizontal_push');

  if (found.size === 0) {
    for (const rule of GUARDED_RULES) {
      if (primaryMuscle && rule.muscles.includes(primaryMuscle as Muscle) && rule.match.test(lower)) found.add(rule.pattern);
    }
  }
  if (found.size === 0) {
    const fallback = primaryMuscle ? MUSCLE_FALLBACK[primaryMuscle as Muscle] : undefined;
    if (fallback) found.add(fallback);
  }

  const patterns = [...found].sort();
  return { patterns, unclear: patterns.length === 0 || patterns.length > MAX_AUTO_PATTERNS };
}
