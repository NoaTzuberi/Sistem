import type { Types } from 'mongoose';
import type { PlanWorkoutFields } from '../plans/plan.types';
import type { MealFields, TipFields } from '../nutrition/nutrition.types';
import type { TemplateType } from './template.constants';

/** A nutrition template's content — the same meal subschema as NutritionPlan, no trainee data. */
export interface TemplateNutritionFields {
  targetKcal?: number | null;
  meals: MealFields[];
  tips: TipFields[];
}

export interface TemplateDocument {
  coachId: Types.ObjectId;
  type: TemplateType;
  name: string;
  description?: string;
  workouts: (PlanWorkoutFields & { _id: Types.ObjectId })[];
  /** type 'nutrition_plan' only (Phase 13a). */
  nutrition?: TemplateNutritionFields | null;
  /** Set by seed:nutrition so re-running it never duplicates a template. */
  seedKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
