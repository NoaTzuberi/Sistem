import type { Types } from 'mongoose';
import type { ProgressPhotoPose } from '@sistem/types';

export interface ProgressPhotoFields {
  // Cloudinary public id of an authenticated asset — delivered only via signed URLs.
  publicId: string;
  pose: ProgressPhotoPose;
  uploadedAt: Date;
}

export interface StartingPhotoFields {
  publicId: string;
  tag: 'starting';
  uploadedAt: Date;
}

export interface BodyMetricDocument {
  traineeId: Types.ObjectId;
  date: string;
  weight?: number;
  measurements?: Map<string, number>;
  photos: ProgressPhotoFields[];
  startingPhoto?: StartingPhotoFields;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
