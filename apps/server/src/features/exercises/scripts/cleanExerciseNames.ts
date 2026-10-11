/**
 * Cleans the display names of imported exercises (Phase 12b, step 0a): drops the source
 * program prefix ("30 Arms Hammer Curl" → "Hammer Curl") and a stray trailing dash. The name is
 * rebuilt from source.originalTitle, so re-running changes nothing; slugs and ids never change.
 *
 *   npm run clean:exercise-names
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../../../config/database';
import { Exercise } from '../exercise.model';
import { cleanExerciseName } from '../exerciseName';

export async function cleanExerciseNames(): Promise<{ checked: number; renamed: number }> {
  const docs = await Exercise.find().select('name source.originalTitle').lean();
  const ops = docs.flatMap((doc) => {
    const cleaned = cleanExerciseName(doc.source?.originalTitle ?? doc.name);
    return cleaned === doc.name ? [] : [{ updateOne: { filter: { _id: doc._id }, update: { $set: { name: cleaned } } } }];
  });
  if (ops.length > 0) await Exercise.bulkWrite(ops);
  return { checked: docs.length, renamed: ops.length };
}

if (require.main === module) {
  (async () => {
    await connectDatabase();
    try {
      const result = await cleanExerciseNames();
      console.log(`${result.checked} exercises checked, ${result.renamed} renamed.`);
    } finally {
      await mongoose.disconnect();
    }
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
