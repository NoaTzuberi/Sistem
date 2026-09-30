import type { Types } from 'mongoose';

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  legs?: number;
}

export interface ProgressDocument {
  userId: Types.ObjectId;
  date: Date;
  weight?: number;
  bodyMeasurements?: BodyMeasurements;
  photos: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
