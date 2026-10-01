import mongoose from 'mongoose';

export function validatePlanIdParam(id: unknown): string | null {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    return 'Invalid plan id.';
  }
  return null;
}
