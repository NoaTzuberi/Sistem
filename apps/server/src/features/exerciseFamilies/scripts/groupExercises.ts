/**
 * Tags every library exercise with movement patterns and groups equipment variants into
 * families (Phase 12b). Safe to re-run: what the coach changed is kept. Writes the coach's
 * review list (unclear patterns, ambiguous names, many copies) to data/processed/.
 *
 *   npm run group:exercises
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '../../../config/database';
import { Exercise } from '../../exercises/exercise.model';
import { ExerciseFamily } from '../exerciseFamily.model';
import { regroupLibrary } from '../exerciseFamilyGrouping.service';

const REPORT_DIR = join(__dirname, '../../../../data/processed');

export async function writeReviewReport(): Promise<string> {
  const families = await ExerciseFamily.find({ 'reviewReasons.0': { $exists: true }, reviewedAt: null })
    .sort({ name: 1 })
    .lean();
  const members = await Exercise.find({ familyId: { $in: families.map((family) => family._id) } })
    .select('name familyId variant isPrimaryVariant primaryMuscles')
    .lean();
  const byFamily = new Map<string, typeof members>();
  for (const member of members) {
    const id = String(member.familyId);
    byFamily.set(id, [...(byFamily.get(id) ?? []), member]);
  }
  const report = {
    runAt: new Date().toISOString(),
    count: families.length,
    families: families.map((family) => ({
      id: String(family._id),
      name: family.name,
      reasons: family.reviewReasons,
      patterns: family.patterns,
      muscles: family.muscles,
      members: (byFamily.get(String(family._id)) ?? []).map(
        (member) => `${member.isPrimaryVariant ? '' : '(copy) '}${member.variant}: ${member.name} [${member.primaryMuscles[0] ?? '-'}]`,
      ),
    })),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const path = join(REPORT_DIR, `exercise-review-${Date.now()}.json`);
  writeFileSync(path, JSON.stringify(report, null, 2), 'utf-8');
  return path;
}

if (require.main === module) {
  (async () => {
    await connectDatabase();
    try {
      const summary = await regroupLibrary();
      console.log(JSON.stringify(summary, null, 2));
      console.log(`Review list: ${await writeReviewReport()}`);
    } finally {
      await mongoose.disconnect();
    }
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
