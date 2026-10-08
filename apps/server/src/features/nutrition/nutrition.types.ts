import type { Types } from 'mongoose';
import type {
  CalorieSuggestion,
  CalorieTargetSource,
  DietTag,
  FoodGroup,
  FormulaSex,
  NutritionGoal,
  NutritionLineKind,
  PortionGroup,
} from '@sistem/types';

export interface FoodItemDocument {
  coachId: Types.ObjectId;
  group: FoodGroup;
  name: string;
  portion: string;
  grams?: number | null;
  kcal?: number | null;
  isNewItem: boolean;
  dietTags: DietTag[];
  order: number;
  archivedAt?: Date | null;
  /** Set by seed:nutrition so re-running it never duplicates an item. */
  seedKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PortionCountsFields = Record<PortionGroup, number>;

export interface OptionLineFields {
  _id: Types.ObjectId;
  kind: NutritionLineKind;
  foodItemId?: Types.ObjectId;
  recipeId?: Types.ObjectId;
  group?: FoodGroup | null;
  portions?: number | null;
  text?: string;
}

export interface MealOptionFields {
  _id: Types.ObjectId;
  label: string;
  lines: OptionLineFields[];
}

export interface MealFields {
  _id: Types.ObjectId;
  name: string;
  portions: PortionCountsFields;
  vegetablesFree: boolean;
  options: MealOptionFields[];
}

export interface TipFields {
  _id: Types.ObjectId;
  text: string;
}

export interface FloorConfirmationFields {
  kcal: number;
  floorKcal: number;
  confirmedAt: Date;
}

export interface CalorieTargetFields {
  kcal?: number | null;
  source?: CalorieTargetSource | null;
  goal: NutritionGoal;
  formulaSex?: FormulaSex | null;
  /** The estimate when last saved (inputs included) — Mixed, shape = CalorieSuggestion. */
  suggestion?: CalorieSuggestion | null;
  floorConfirmation?: FloorConfirmationFields | null;
}

export interface NutritionPlanDocument {
  traineeId: Types.ObjectId;
  coachId: Types.ObjectId;
  calorieTarget: CalorieTargetFields;
  meals: MealFields[];
  tips: TipFields[];
  /** 13b (waterTracking). */
  waterGoalMl?: number | null;
  templateId?: Types.ObjectId | null;
  publishedVersion: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionPlanVersionDocument {
  planId: Types.ObjectId;
  traineeId: Types.ObjectId;
  coachId: Types.ObjectId;
  version: number;
  publishedAt: Date;
  calorieTarget: CalorieTargetFields;
  meals: MealFields[];
  tips: TipFields[];
  waterGoalMl?: number | null;
  /** The group values and kcal at publish time, so a later config change never rewrites history. */
  groupKcal: Record<FoodGroup, number>;
  mealKcal: { mealId: Types.ObjectId; kcal: number }[];
  dayKcal: number;
  createdAt: Date;
}

export interface NutritionSettingsDocument {
  coachId: Types.ObjectId;
  groupKcal?: Partial<PortionCountsFields>;
  goalAdjustments?: Partial<Record<NutritionGoal, number>>;
  activityFactors?: number[];
  floorKcal?: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- 13b (closed behind feature flags; designed in 13a, used from 13b) -------------

export interface RecipeIngredientFields {
  _id: Types.ObjectId;
  kind: 'food' | 'text';
  foodItemId?: Types.ObjectId;
  group?: FoodGroup | null;
  portions?: number | null;
  text?: string;
}

export interface RecipeDocument {
  coachId: Types.ObjectId;
  name: string;
  ingredients: RecipeIngredientFields[];
  steps: string[];
  notes?: string;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealLogDocument {
  traineeId: Types.ObjectId;
  coachId: Types.ObjectId;
  /** 'YYYY-MM-DD' in her time zone. */
  date: string;
  planId: Types.ObjectId;
  planVersion: number;
  mealId: Types.ObjectId;
  optionId?: Types.ObjectId | null;
  eaten: PortionCountsFields;
  /** The meal's portions in that version — an edited plan never rewrites history. */
  planned: PortionCountsFields;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaterLogDocument {
  traineeId: Types.ObjectId;
  date: string;
  totalMl: number;
  createdAt: Date;
  updatedAt: Date;
}
