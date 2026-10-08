import { Schema, model } from 'mongoose';
import { planWorkoutSchema } from '../plans/planWorkout.schema';
import { nutritionMealSchema, nutritionTipSchema } from '../nutrition/nutritionMeal.schema';
import { TEMPLATE_TYPE_IDS } from './template.constants';
import type { TemplateDocument, TemplateNutritionFields } from './template.types';

const templateNutritionSchema = new Schema<TemplateNutritionFields>(
  {
    targetKcal: { type: Number, min: 0, default: null },
    meals: { type: [nutritionMealSchema], default: [] },
    tips: { type: [nutritionTipSchema], default: [] },
  },
  { _id: false },
);

// The coach's reusable workouts, plans and nutrition plans (PRD §6, §5.6). Typed content —
// the same workout subschema as Plan and the same meal subschema as NutritionPlan — so a
// template copies into a plan as-is.
const templateSchema = new Schema<TemplateDocument>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TEMPLATE_TYPE_IDS, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    workouts: { type: [planWorkoutSchema], default: [] },
    nutrition: { type: templateNutritionSchema, default: undefined },
    seedKey: { type: String, default: undefined },
  },
  { timestamps: true },
);

// One rule per type: each type holds only its own content.
templateSchema.pre('validate', function checkTemplateShape() {
  if (this.type === 'workout' && this.workouts.length !== 1) {
    this.invalidate('workouts', 'A workout template holds exactly one workout.');
  }
  if (this.type === 'plan' && this.workouts.length === 0) {
    this.invalidate('workouts', 'A plan template needs at least one workout.');
  }
  if (this.type !== 'nutrition_plan' && this.nutrition) {
    this.invalidate('nutrition', 'Only a nutrition template holds nutrition content.');
  }
  if (this.type === 'nutrition_plan') {
    if (this.workouts.length > 0) {
      this.invalidate('workouts', 'A nutrition template holds no workouts.');
    }
    if (!this.nutrition || this.nutrition.meals.length === 0) {
      this.invalidate('nutrition', 'A nutrition template needs at least one meal.');
    }
  }
});

templateSchema.index({ coachId: 1, type: 1, updatedAt: -1 });
templateSchema.index(
  { coachId: 1, seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } },
);

export const Template = model<TemplateDocument>('Template', templateSchema);
