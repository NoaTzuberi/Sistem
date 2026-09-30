/**
 * DEV-ONLY throwaway script. Flips a small sample of 'imported' exercises to
 * 'published' in the local/dev database so the frontend can be verified
 * against real data before a real curation workflow exists. Not wired into
 * any app startup path — run manually via `npx tsx` only. Do not run
 * against a shared/staging/production database.
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../../../config/database';
import { Exercise } from '../exercise.model';

const SAMPLE_SIZE = 30;

async function main() {
  await connectDatabase();

  const sample = await Exercise.find({ reviewStatus: 'imported' }).limit(SAMPLE_SIZE).select('_id');
  const ids = sample.map((doc) => doc._id);

  const result = await Exercise.updateMany(
    { _id: { $in: ids } },
    { $set: { reviewStatus: 'published' } },
  );

  console.log(`Published ${result.modifiedCount} sample exercises for local verification.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('publishSampleExercises failed:', error);
  process.exitCode = 1;
});
