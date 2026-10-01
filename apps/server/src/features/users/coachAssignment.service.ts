import type { Types } from 'mongoose';
import { config } from '../../config/env';
import { User } from './user.model';

/**
 * The coach a new trainee is assigned to (one coach for now, owner decision A):
 * DEFAULT_COACH_EMAIL if it names a coach → else the only coach, if exactly one
 * exists → else null (assigned later by promote:coach / seed:dev). Sign-up never
 * fails because of this.
 */
export async function resolveDefaultCoachId(): Promise<Types.ObjectId | null> {
  if (config.defaultCoachEmail) {
    const coach = await User.findOne({ email: config.defaultCoachEmail, role: 'coach' }).select('_id').lean();
    if (coach) return coach._id;
    console.warn('DEFAULT_COACH_EMAIL does not match a coach account — falling back.');
  }

  const coaches = await User.find({ role: 'coach' }).select('_id').limit(2).lean();
  return coaches.length === 1 ? coaches[0]._id : null;
}

/** Gives every trainee without a coach to `coachId`. Returns how many were assigned. */
export async function assignUnassignedTrainees(coachId: Types.ObjectId): Promise<number> {
  const result = await User.updateMany({ role: 'trainee', coachId: null }, { coachId });
  return result.modifiedCount;
}
