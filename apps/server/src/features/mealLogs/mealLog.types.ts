import type { Types } from 'mongoose';
import type { PortionCounts } from '@sistem/types';

export interface MealPhotoFields {
  mealId: Types.ObjectId;
  /** The meal's name when the photo was added — an edited plan never renames it. */
  mealName: string;
  /** Cloudinary public id (authenticated asset); never sent to a client. */
  publicId: string;
  uploadedAt: Date;
}

/** One trainee, one day: the portions she marked against that day's plan (Phase 13a+). */
export interface MealLogDocument {
  traineeId: Types.ObjectId;
  coachId: Types.ObjectId;
  /** 'YYYY-MM-DD' in her time zone. */
  date: string;
  planId: Types.ObjectId;
  planVersion: number;
  /** The day's planned portions in that version — a later version never rewrites a past day. */
  planned: PortionCounts;
  eaten: PortionCounts;
  photos: MealPhotoFields[];
  createdAt: Date;
  updatedAt: Date;
}
