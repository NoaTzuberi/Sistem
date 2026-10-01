/**
 * DEV ONLY: promote an existing user to role=coach, so coach mode and the coach
 * dashboard can be tested with a real account.
 *
 *   npm run promote:coach -- <email>                  (local database)
 *   npm run promote:coach -- <email> --allow-remote   (non-local dev database)
 *
 * Refuses to run when NODE_ENV=production. Refuses a non-local database unless
 * --allow-remote is passed, and always prints which database it is about to touch.
 * If the promoted coach is now the default coach (DEFAULT_COACH_EMAIL, or the only
 * coach), trainees without a coach are assigned to her.
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../../../config/database';
import { User } from '../user.model';
import { resolveDefaultCoachId, assignUnassignedTrainees } from '../coachAssignment.service';
import { assertDevDatabase } from './devDatabaseGuard';

async function main() {
  const args = process.argv.slice(2);
  const allowRemote = args.includes('--allow-remote');
  const email = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();

  if (!email) {
    console.error('Usage: npm run promote:coach -- <email> [--allow-remote]');
    process.exit(1);
  }

  assertDevDatabase(allowRemote);

  await connectDatabase();
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`No user with email ${email}.`);
      process.exitCode = 1;
      return;
    }
    if (user.role === 'coach') {
      console.log(`${email} is already a coach. Nothing changed.`);
    } else {
      user.role = 'coach';
      // A coach has no coach of her own.
      user.coachId = null;
      await user.save();
      console.log(`${email} is now a coach.`);
    }

    const defaultCoachId = await resolveDefaultCoachId();
    if (defaultCoachId?.equals(user._id)) {
      const assigned = await assignUnassignedTrainees(user._id);
      console.log(`Assigned ${assigned} unassigned trainee(s) to ${email}.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
