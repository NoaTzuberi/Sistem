import type {
  AllergyId,
  DietTag,
  DietType,
  FoodGroup,
  FormulaSex,
  NutritionGoal,
  NutritionLineKind,
  PortionGroup,
} from '@sistem/types';

export const FOOD_GROUP_IDS = ['protein', 'carb', 'fat', 'vegetable'] as const satisfies readonly FoodGroup[];
/** The groups a meal counts — vegetables are free (PRD §5.6). */
export const PORTION_GROUP_IDS = ['protein', 'carb', 'fat'] as const satisfies readonly PortionGroup[];

export const DIET_TAG_IDS = [
  'meat',
  'poultry',
  'fish',
  'dairy',
  'eggs',
  'gluten',
  'peanuts',
  'tree_nuts',
  'sesame',
  'soy',
] as const satisfies readonly DietTag[];

// Onboarding "Nutrition preferences" (Phase 13a). Mirrored in the mobile onboarding options.
export const DIET_TYPE_IDS = ['none', 'vegetarian', 'vegan', 'pescatarian'] as const satisfies readonly DietType[];
export const ALLERGY_IDS = [
  'dairy',
  'eggs',
  'gluten',
  'peanuts',
  'tree_nuts',
  'sesame',
  'soy',
  'fish',
] as const satisfies readonly AllergyId[];
export const MAX_PREFERENCE_TEXT_LENGTH = 500;

/** The tags each diet type rules out. */
export const DIET_TYPE_EXCLUDED_TAGS: Record<DietType, readonly DietTag[]> = {
  none: [],
  vegetarian: ['meat', 'poultry', 'fish'],
  pescatarian: ['meat', 'poultry'],
  vegan: ['meat', 'poultry', 'fish', 'dairy', 'eggs'],
};

/** Each allergy id is the diet tag of the same name. */
export const ALLERGY_TAG: Record<AllergyId, DietTag> = {
  dairy: 'dairy',
  eggs: 'eggs',
  gluten: 'gluten',
  peanuts: 'peanuts',
  tree_nuts: 'tree_nuts',
  sesame: 'sesame',
  soy: 'soy',
  fish: 'fish',
};

/** Kosher: meat (poultry counts as meat) and dairy never in the same option. */
export const KOSHER_MEAT_TAGS: readonly DietTag[] = ['meat', 'poultry'];
export const KOSHER_DAIRY_TAGS: readonly DietTag[] = ['dairy'];

export const NUTRITION_GOAL_IDS = ['fat_loss', 'recomp', 'muscle_gain', 'maintenance'] as const satisfies readonly NutritionGoal[];
export const FORMULA_SEX_IDS = ['male', 'female'] as const satisfies readonly FormulaSex[];
export const CALORIE_TARGET_SOURCE_IDS = ['suggested', 'override'] as const;

export const LINE_KIND_IDS = ['food', 'text', 'recipe'] as const satisfies readonly NutritionLineKind[];

// Limits for the coach's input.
export const PORTION_STEP = 0.5;
export const MAX_MEAL_PORTIONS = 10;
export const MAX_LINE_PORTIONS = 10;
export const MAX_MEALS = 10;
export const MAX_MEAL_OPTIONS = 6;
export const MAX_OPTION_LINES = 20;
export const MAX_TIPS = 20;
export const MAX_FOOD_NAME_LENGTH = 120;
export const MAX_FOOD_PORTION_LENGTH = 120;
export const MAX_MEAL_NAME_LENGTH = 60;
export const MAX_OPTION_LABEL_LENGTH = 60;
export const MAX_LINE_TEXT_LENGTH = 200;
export const MAX_TIP_LENGTH = 1000;
export const MAX_TEMPLATE_NAME_LENGTH = 80;
export const MAX_TEMPLATE_DESCRIPTION_LENGTH = 500;
export const MAX_FOOD_GRAMS = 5000;
export const MIN_TARGET_KCAL = 500;
export const MAX_TARGET_KCAL = 6000;
export const MAX_WATER_GOAL_ML = 10000;
