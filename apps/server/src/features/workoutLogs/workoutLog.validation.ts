import mongoose from 'mongoose';

export function validateWorkoutLogIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'Invalid workout log id.';
  }
  return null;
}
