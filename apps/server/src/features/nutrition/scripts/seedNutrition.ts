/**
 * Seeds a coach's food list and the "1,500 kcal" template from the coach's guide
 * (Phase 13a). DEV + first setup.
 *
 *   npm run seed:nutrition -- <coachEmail>                  (local database)
 *   npm run seed:nutrition -- <coachEmail> --allow-remote   (non-local dev database)
 *   npm run seed:nutrition -- <coachEmail> --file <path>    (another data file)
 *
 * The data (apps/server/data/nutrition/guide-1500.json) is the coach's own content:
 * gitignored, never committed. Re-running is safe — items and the template that were
 * already seeded are left as they are (the coach may have edited them).
 * Same database guard as seed:dev.
 */
import path from 'node:path';
import { existsSync } from 'node:fs';
import mongoose from 'mongoose';
import { connectDatabase } from '../../../config/database';
import { User } from '../../users/user.model';
import { assertDevDatabase } from '../../users/scripts/devDatabaseGuard';
import { DEFAULT_NUTRITION_SEED_FILE, applyNutritionSeed, readNutritionSeedFile } from '../nutritionSeed';

function readArgs(argv: string[]) {
  const fileIndex = argv.indexOf('--file');
  return {
    email: argv.find((arg, index) => !arg.startsWith('--') && argv[index - 1] !== '--file')?.trim().toLowerCase(),
    allowRemote: argv.includes('--allow-remote'),
    file: fileIndex >= 0 ? path.resolve(argv[fileIndex + 1] ?? '') : DEFAULT_NUTRITION_SEED_FILE,
  };
}

async function main() {
  const { email, allowRemote, file } = readArgs(process.argv.slice(2));
  if (!email) {
    console.error('Usage: npm run seed:nutrition -- <coachEmail> [--allow-remote] [--file <path>]');
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`No seed file at ${file}. It is the coach's own content (gitignored) — see the Phase 13a report.`);
    process.exit(1);
  }
  assertDevDatabase(allowRemote);
  await connectDatabase();
  try {
    const coach = await User.findOne({ email, role: 'coach' }).select('_id').lean();
    if (!coach) {
      console.error('No coach with that email.');
      process.exitCode = 1;
      return;
    }
    const result = await applyNutritionSeed(String(coach._id), await readNutritionSeedFile(file));
    console.log(
      `Food items: ${result.foodsCreated} created, ${result.foodsKept} already there. ` +
        `Template: ${result.templateCreated ? 'created' : 'already there'}. ` +
        `Lactose tag added to ${result.lactoseTagged} dairy item(s) (once per coach).`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
