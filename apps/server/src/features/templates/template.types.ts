import type { Types } from 'mongoose';
import type { PlanWorkoutFields } from '../plans/plan.types';
import type { TemplateType } from './template.constants';

export interface TemplateDocument {
  coachId: Types.ObjectId;
  type: TemplateType;
  name: string;
  description?: string;
  workouts: (PlanWorkoutFields & { _id: Types.ObjectId })[];
  createdAt: Date;
  updatedAt: Date;
}
