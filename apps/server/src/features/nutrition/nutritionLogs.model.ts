import { Schema, model } from 'mongoose';
import { isDateString } from '../plans/planWeek';
import { FOOD_GROUP_IDS } from './nutrition.constants';
import type {
  MealLogDocument,
  PortionCountsFields,
  RecipeDocument,
  RecipeIngredientFields,
  WaterLogDocument,
} from './nutrition.types';

// Phase 13b models, designed (and approved) in Phase 13a. Nothing reads or writes them
// yet: 13b adds their routes behind the feature flags (config/features.ts) —
// nutritionRecipes, mealLogging, waterTracking — all closed by default.

const portionCountsSchema = new Schema<PortionCountsFields>(
  {
    protein: { type: Number, min: 0, default: 0 },
    carb: { type: Number, min: 0, default: 0 },
    fat: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const recipeIngredientSchema = new Schema<RecipeIngredientFields>({
  kind: { type: String, enum: ['food', 'text'], required: true },
  foodItemId: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
  group: { type: String, enum: [...FOOD_GROUP_IDS, null], default: null },
  portions: { type: Number, min: 0, default: null },
  text: { type: String, trim: true },
});

/** The coach's recipes / menu suggestions; portions per group are computed from the ingredients. */
const recipeSchema = new Schema<RecipeDocument>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    ingredients: { type: [recipeIngredientSchema], default: [] },
    steps: { type: [String], default: [] },
    notes: { type: String, trim: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
recipeSchema.index({ coachId: 1, archivedAt: 1, name: 1 });

export const Recipe = model<RecipeDocument>('Recipe', recipeSchema);

/** What she ate of one meal on one day, against a snapshot of what was planned. */
const mealLogSchema = new Schema<MealLogDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, validate: { validator: isDateString, message: 'date must be YYYY-MM-DD.' } },
    planId: { type: Schema.Types.ObjectId, ref: 'NutritionPlan', required: true },
    planVersion: { type: Number, required: true, min: 1 },
    mealId: { type: Schema.Types.ObjectId, required: true },
    optionId: { type: Schema.Types.ObjectId, default: null },
    eaten: { type: portionCountsSchema, required: true },
    planned: { type: portionCountsSchema, required: true },
  },
  { timestamps: true },
);
mealLogSchema.index({ traineeId: 1, date: 1, mealId: 1 }, { unique: true });

export const MealLog = model<MealLogDocument>('MealLog', mealLogSchema);

const waterLogSchema = new Schema<WaterLogDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, validate: { validator: isDateString, message: 'date must be YYYY-MM-DD.' } },
    totalMl: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);
waterLogSchema.index({ traineeId: 1, date: 1 }, { unique: true });

export const WaterLog = model<WaterLogDocument>('WaterLog', waterLogSchema);
