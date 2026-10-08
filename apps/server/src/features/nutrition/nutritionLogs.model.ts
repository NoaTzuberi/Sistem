import { Schema, model } from 'mongoose';
import { isDateString } from '../plans/planWeek';
import { FOOD_GROUP_IDS } from './nutrition.constants';
import type {
  RecipeDocument,
  RecipeIngredientFields,
  WaterLogDocument,
} from './nutrition.types';

// Phase 13b models, designed (and approved) in Phase 13a. Nothing reads or writes them
// yet: 13b adds their routes behind the feature flags (config/features.ts) —
// nutritionRecipes, waterTracking — closed by default. (Meal logging opened in 13a+ as
// portion tracking: features/mealLogs.)

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
