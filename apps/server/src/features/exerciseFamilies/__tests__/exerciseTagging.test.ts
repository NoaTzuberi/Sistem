import { describe, it, expect } from 'vitest';
import type { ExerciseFacts } from '@sistem/types';
import { cleanExerciseName } from '../../exercises/exerciseName';
import { tagPatterns } from '../../exercises/exercisePatterns';
import { familyDisplayName, groupExercises, movementKey, variantOf } from '../exerciseFamilyGrouping';
import type { GroupingInput } from '../exerciseFamilyGrouping';

// Phase 12b, steps 0a / 0b and the tagging: pure functions over the factual fields only.

describe('cleanExerciseName (0a)', () => {
  it('drops the source program prefix with its body-part word', () => {
    expect(cleanExerciseName('30 Arms Hammer Curl')).toBe('Hammer Curl');
    expect(cleanExerciseName('30 Day Back Barbell Rack Pull')).toBe('Barbell Rack Pull');
    expect(cleanExerciseName('30 back Wide-Grip Seated Cable Row')).toBe('Wide-Grip Seated Cable Row');
    expect(cleanExerciseName('30 Cable Reverse Crunch')).toBe('Cable Reverse Crunch');
  });

  it('keeps numbers that are part of the name, and drops a stray trailing dash', () => {
    for (const name of ['3/4 sit-up', '1.5-rep push-up', '90/90 Hamstring', '3D dumbbell lunge', '90-degree jump squat', '6 Way Shoulder Raise', '180 Jump']) {
      expect(cleanExerciseName(name)).toBe(name);
    }
    expect(cleanExerciseName('Barbell hip thrust-')).toBe('Barbell hip thrust');
    expect(cleanExerciseName(cleanExerciseName('30 Legs Leg Press'))).toBe('Leg Press');
  });
});

describe('tagPatterns', () => {
  const tag = (name: string, muscle: string, type = 'strength') => tagPatterns(name, muscle, type);

  it('reads the pattern from the name, whatever body part the dataset gave', () => {
    expect(tag('Barbell Bench Press', 'chest').patterns).toEqual(['horizontal_push']);
    expect(tag('Dumbbell Shoulder Press', 'shoulders').patterns).toEqual(['vertical_push']);
    expect(tag('Leg Extension - Gethin Variation', 'hamstrings').patterns).toEqual(['knee_extension']);
    expect(tag('TBS Deficit Deadlift', 'middle_back').patterns).toEqual(['hinge']);
    expect(tag('Lying Leg Curl', 'quadriceps').patterns).toEqual(['knee_flexion']);
    expect(tag('Barbell Hip Thrust', 'glutes').patterns).toEqual(['glute_bridge']);
    expect(tag('Face Pull', 'shoulders').patterns).toEqual(['rear_delt']);
    expect(tag('Side Bridge', 'abdominals').patterns).toEqual(['core']);
    expect(tag('Reverse Fly', 'shoulders').patterns).toEqual(['rear_delt']);
  });

  it('keeps horizontal push and power tight', () => {
    expect(tag('Close-grip bench press', 'triceps').patterns).toEqual(['elbow_extension']);
    expect(tag('Chest Push (single response)', 'chest').patterns).toEqual(['power']);
    expect(tag('Front Squat (Clean Grip)', 'quadriceps').patterns).toEqual(['squat']);
    expect(tag('HM Squat Jump', 'quadriceps').patterns).toEqual(['power']);
    expect(tag('Box Jump', 'quadriceps').patterns).toEqual(['power']);
    expect(tag('Jumping Rope', 'quadriceps').patterns).toEqual(['conditioning']);
    expect(tag('Machine press', 'chest').patterns).toEqual(['horizontal_push']);
  });

  it('uses the body part only for generic words or when the name says nothing', () => {
    expect(tag('Concentration thing', 'biceps').patterns).toEqual(['elbow_flexion']);
    expect(tag('Weird crunchless move', 'abdominals').patterns).toEqual(['core']);
    expect(tag('Cardio thing', 'quadriceps', 'cardio').patterns).toEqual(['conditioning']);
    expect(tag('Pigeon', 'glutes', 'mobility').patterns).toEqual(['mobility']);
  });

  it('marks unclear: nothing found, or a combo of more than two patterns', () => {
    expect(tag('HM Turkish Get-Up', 'quadriceps')).toEqual({ patterns: [], unclear: true });
    expect(tag('Holman Straight-Arm Side Plank Overhead Press to Chest Press', 'abdominals').unclear).toBe(true);
    expect(tag('Barbell Squat', 'quadriceps').unclear).toBe(false);
  });
});

describe('exercise families (0b)', () => {
  let id = 0;
  function input(name: string, muscle: string, equipment: string, fields: Partial<GroupingInput> = {}): GroupingInput {
    id += 1;
    const facts: ExerciseFacts = { id: `e${id}`, name, primaryMuscles: [muscle], equipment: [equipment], difficulty: 'beginner', movementType: 'strength' };
    return { ...facts, ...tagPatterns(name, muscle, 'strength'), ...fields };
  }

  it('strips source prefixes, equipment words and spelling differences from the key', () => {
    expect(movementKey('HM Dumbbell Bent-Over Row')).toBe(movementKey('Barbell bent over rows'));
    expect(movementKey('Push-ups')).toBe(movementKey('UN Push-Up'));
    expect(movementKey('Squat with Bands')).toBe(movementKey('Barbell Squat'));
    expect(movementKey('Incline Dumbbell Flyes - With A Twist')).not.toBe(movementKey('Incline Dumbbell Fly'));
  });

  it('labels the variant from the name first (Smith machine is filed as machine or barbell)', () => {
    expect(variantOf('Smith machine squat', ['barbell'])).toBe('smith_machine');
    expect(variantOf('EZ-Bar Curl', ['ez_curl_bar'])).toBe('ez_bar');
    expect(variantOf('Push-up', ['bodyweight'])).toBe('bodyweight');
    expect(variantOf('Crunch', ['resistance_band'])).toBe('band');
    expect(familyDisplayName('Dumbbell bent-over row')).toBe('Bent-Over Row');
  });

  it('groups by name + pattern across body parts, one primary per variant (the coach\'s pick, then the plainest name)', () => {
    const plain = input('Barbell Deadlift', 'lower_back', 'barbell');
    const copy = input('FYR2 Barbell Deadlift', 'hamstrings', 'barbell');
    const used = input('King Maker Barbell Deadlift', 'middle_back', 'barbell');
    const dumbbell = input('Dumbbell Deadlift', 'hamstrings', 'dumbbell');
    const families = groupExercises([plain, copy, used, dumbbell], { preferredIds: [used.id] });

    expect(families).toHaveLength(1);
    const [family] = families;
    expect(family.muscles).toEqual(['hamstrings', 'lower_back', 'middle_back']);
    expect(family.patterns).toEqual(['hinge']);
    const primaries = family.members.filter((member) => member.primary);
    expect(primaries.map((member) => member.exerciseId).sort()).toEqual([used.id, dumbbell.id].sort());
    expect(family.members.find((member) => member.exerciseId === plain.id)).toMatchObject({ variant: 'barbell', primary: false });
    expect(family.reviewReasons).toEqual([]);
  });

  it('keeps a name apart when its pattern differs or is unclear, and lists it for the coach', () => {
    const families = groupExercises([
      input('Bear Crawl', 'abdominals', 'bodyweight', { patterns: ['core'], unclear: false }),
      input('Bear Crawl', 'glutes', 'bodyweight', { patterns: ['conditioning'], unclear: false }),
      input('Turkish Get-Up', 'quadriceps', 'kettlebell'),
      input('Turkish Get-Up', 'shoulders', 'kettlebell'),
    ]);
    expect(families).toHaveLength(4);
    expect(families.filter((family) => family.name === 'Bear Crawl').every((family) => family.reviewReasons.includes('pattern_differs'))).toBe(true);
    const getUps = families.filter((family) => family.name === 'Turkish Get-Up');
    expect(getUps.every((family) => family.reviewReasons.includes('ambiguous_name') && family.reviewReasons.includes('unclear_pattern'))).toBe(true);
  });

  it('lists a variant with more than 4 copies (a real setup difference may hide in there)', () => {
    const curls = ['Hammer Curl', 'HM Hammer Curl', 'FYR Hammer Curl', 'TBS Hammer Curl', 'AM Hammer Curls'].map((name) => input(name, 'biceps', 'dumbbell'));
    const [family] = groupExercises(curls);
    expect(family.members.filter((member) => member.primary)).toHaveLength(1);
    expect(family.reviewReasons).toEqual(['many_copies']);
  });
});
