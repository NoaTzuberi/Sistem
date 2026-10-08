import { describe, it, expect } from 'vitest';
import type { DietTag, FoodItem, NutritionFeatures, NutritionMeal, NutritionPreferences } from '@sistem/types';
import { DEFAULT_NUTRITION_CONFIG } from '../nutrition.config';
import { findFoodConflicts, hasKetoConflict, hasKosherConflict } from '../nutritionPreferences';
import {
  computeNutritionKcal,
  findNutritionPublishIssues,
  foodKcalProblem,
  parseFoodItemPayload,
  parseNutritionSettingsPayload,
  parseSaveNutritionPlanPayload,
} from '../nutrition.validation';
import type { PublishCheckContext } from '../nutrition.validation';

// Phase 13a: preference checks, the save payload rules and the publish rules — pure, so
// they are tested without the API (the API tests cover the wiring).

const CLOSED: NutritionFeatures = { nutritionRecipes: false, waterTracking: false };
const ID = (n: number) => n.toString(16).padStart(24, '0');

function prefs(overrides: Partial<NutritionPreferences> = {}): NutritionPreferences {
  return { dietType: 'none', dietStyles: [], religious: [], intolerances: [], allergies: [], mealsPerDay: null, ...overrides };
}

describe('preference conflicts', () => {
  const tags = (...list: DietTag[]) => list;

  it('vegetarian rules out meat, poultry, fish and shellfish', () => {
    const vegetarian = prefs({ dietType: 'vegetarian' });
    expect(findFoodConflicts(tags('poultry'), vegetarian)).toEqual([{ kind: 'diet', tag: 'poultry', source: 'vegetarian' }]);
    expect(findFoodConflicts(tags('fish'), vegetarian)).toHaveLength(1);
    expect(findFoodConflicts(tags('shellfish'), vegetarian)).toHaveLength(1);
    expect(findFoodConflicts(tags('dairy', 'eggs'), vegetarian)).toEqual([]);
  });

  it('pescatarian allows fish; vegan also rules out dairy and eggs', () => {
    expect(findFoodConflicts(tags('fish'), prefs({ dietType: 'pescatarian' }))).toEqual([]);
    expect(findFoodConflicts(tags('meat'), prefs({ dietType: 'pescatarian' }))).toHaveLength(1);
    expect(findFoodConflicts(tags('dairy'), prefs({ dietType: 'vegan' }))).toHaveLength(1);
    expect(findFoodConflicts(tags('eggs'), prefs({ dietType: 'vegan' }))).toHaveLength(1);
  });

  it('an allergy matches its diet tag (and is the reason shown); "other" is text only', () => {
    const allergic = prefs({ dietType: 'vegan', allergies: [{ id: 'dairy' }, { id: 'tree_nuts' }, { id: 'other', details: 'kiwi' }] });
    expect(findFoodConflicts(tags('tree_nuts'), allergic)).toEqual([{ kind: 'allergy', tag: 'tree_nuts', source: 'tree_nuts' }]);
    expect(findFoodConflicts(tags('dairy'), allergic)).toEqual([{ kind: 'allergy', tag: 'dairy', source: 'dairy' }]);
    expect(findFoodConflicts(tags('gluten'), allergic)).toEqual([]);
    expect(findFoodConflicts(tags('shellfish'), prefs({ allergies: [{ id: 'shellfish' }] }))).toHaveLength(1);
  });

  it('religious: kosher rules out pork and shellfish, halal pork and alcohol', () => {
    const kosher = prefs({ religious: [{ id: 'kosher' }] });
    expect(findFoodConflicts(tags('pork', 'shellfish', 'fish'), kosher).map((reason) => reason.tag)).toEqual(['pork', 'shellfish']);
    const halal = prefs({ religious: [{ id: 'halal', details: 'halal meat only' }] });
    expect(findFoodConflicts(tags('pork', 'alcohol', 'meat'), halal)).toEqual([
      { kind: 'religious', tag: 'pork', source: 'halal' },
      { kind: 'religious', tag: 'alcohol', source: 'halal' },
    ]);
  });

  it('intolerances: lactose-free → lactose (dairy itself is fine), gluten-free / celiac → gluten, low-FODMAP → high_fodmap', () => {
    const lactose = prefs({ intolerances: [{ id: 'lactose_free', details: 'ok in yogurt' }] });
    expect(findFoodConflicts(tags('dairy', 'lactose'), lactose)).toEqual([{ kind: 'intolerance', tag: 'lactose', source: 'lactose_free' }]);
    expect(findFoodConflicts(tags('dairy'), lactose)).toEqual([]);
    expect(findFoodConflicts(tags('gluten'), prefs({ intolerances: [{ id: 'celiac' }] }))).toHaveLength(1);
    expect(findFoodConflicts(tags('gluten'), prefs({ intolerances: [{ id: 'gluten_free' }] }))).toHaveLength(1);
    expect(findFoodConflicts(tags('high_fodmap'), prefs({ intolerances: [{ id: 'low_fodmap' }] }))).toHaveLength(1);
    expect(findFoodConflicts(tags('gluten'), prefs({ intolerances: [{ id: 'other', details: 'histamine' }] }))).toEqual([]);
  });

  it('the strongest reason wins: allergy > intolerance > religious > diet', () => {
    const both = prefs({ intolerances: [{ id: 'celiac' }], allergies: [{ id: 'gluten' }] });
    expect(findFoodConflicts(tags('gluten'), both)).toEqual([{ kind: 'allergy', tag: 'gluten', source: 'gluten' }]);
  });

  it('keto: more carb portions a day than the limit', () => {
    expect(hasKetoConflict({ protein: 5, carb: 1, fat: 5 }, 1)).toBe(false);
    expect(hasKetoConflict({ protein: 5, carb: 1.5, fat: 5 }, 1)).toBe(true);
  });

  it('kosher: meat or poultry with dairy in one option', () => {
    expect(hasKosherConflict([tags('poultry'), tags('dairy')])).toBe(true);
    expect(hasKosherConflict([tags('meat'), tags('dairy', 'eggs')])).toBe(true);
    expect(hasKosherConflict([tags('fish'), tags('dairy')])).toBe(false);
    expect(hasKosherConflict([tags('poultry'), tags('eggs')])).toBe(false);
  });
});

describe('food items', () => {
  it('needs group, name and portion on create; any subset on update', () => {
    expect(parseFoodItemPayload({ group: 'protein', name: ' Cottage ', portion: '150 g' }, false).value).toEqual({
      group: 'protein',
      name: 'Cottage',
      portion: '150 g',
    });
    expect(parseFoodItemPayload({ name: 'Cottage' }, false).error).toMatch(/Group/);
    expect(parseFoodItemPayload({ dietTags: ['bacon'] }, true).error).toMatch(/Diet tags/);
    expect(parseFoodItemPayload({ grams: null, kcal: 120 }, true).value).toEqual({ grams: null, kcal: 120 });
    expect(parseFoodItemPayload({}, true).error).toMatch(/Nothing/);
  });

  it("kcal may never be above the group's value; vegetables have none", () => {
    expect(foodKcalProblem('protein', 150, DEFAULT_NUTRITION_CONFIG)).toBeNull();
    expect(foodKcalProblem('protein', 151, DEFAULT_NUTRITION_CONFIG)).toMatch(/150/);
    expect(foodKcalProblem('fat', 91, DEFAULT_NUTRITION_CONFIG)).toMatch(/90/);
    expect(foodKcalProblem('vegetable', 10, DEFAULT_NUTRITION_CONFIG)).toMatch(/free/);
    expect(foodKcalProblem('carb', null, DEFAULT_NUTRITION_CONFIG)).toBeNull();
  });
});

describe('settings payload', () => {
  const valid = {
    groupKcal: { protein: 150, carb: 120, fat: 90 },
    goalAdjustments: { fat_loss: -20, fat_loss_aggressive: -25, recomp: -10, muscle_gain: 10, maintenance: 0 },
    activityFactors: [1.375, 1.375, 1.55, 1.55, 1.55, 1.725, 1.725],
    floorKcal: 1200,
    kcalPerKg: 7700,
    maxLossRatePctPerWeek: 1,
    maxGainRatePctPerWeek: 0.5,
    maxDeficitPct: 25,
    portionSplit: { protein: 45, carb: 32, fat: 23 },
    ketoMaxCarbPortions: 1,
  };

  it('accepts the whole config and refuses values out of bounds', () => {
    expect(parseNutritionSettingsPayload(valid).value).toEqual(valid);
    expect(parseNutritionSettingsPayload({ ...valid, floorKcal: 500 }).error).toMatch(/floor/);
    expect(parseNutritionSettingsPayload({ ...valid, activityFactors: [1.5] }).error).toMatch(/Activity/);
    expect(parseNutritionSettingsPayload({ ...valid, goalAdjustments: { ...valid.goalAdjustments, fat_loss: -60 } }).error).toMatch(/Goal/);
    expect(parseNutritionSettingsPayload({ ...valid, maxLossRatePctPerWeek: 5 }).error).toMatch(/loss rate/);
    expect(parseNutritionSettingsPayload({ ...valid, maxDeficitPct: 60 }).error).toMatch(/deficit/);
    expect(parseNutritionSettingsPayload({ ...valid, portionSplit: { protein: 50, carb: 30, fat: 30 } }).error).toMatch(/100/);
  });
});

function meal(overrides: Partial<NutritionMeal> = {}): NutritionMeal {
  return {
    id: ID(1),
    name: 'Breakfast',
    portions: { protein: 1, carb: 1, fat: 1 },
    vegetablesFree: true,
    options: [
      {
        id: ID(2),
        label: 'A',
        lines: [
          { id: ID(3), kind: 'food', foodItemId: ID(100), group: 'protein', portions: 1 },
          { id: ID(4), kind: 'food', foodItemId: ID(101), group: 'carb', portions: 1 },
          { id: ID(5), kind: 'food', foodItemId: ID(102), group: 'fat', portions: 1 },
          { id: ID(6), kind: 'text', group: 'vegetable', portions: null, text: 'Cut vegetables — free' },
        ],
      },
    ],
    ...overrides,
  };
}

type Food = Pick<FoodItem, 'group' | 'name' | 'archivedAt' | 'dietTags'>;

function context(overrides: Partial<PublishCheckContext> = {}, foods: Record<string, Food> = {}): PublishCheckContext {
  const base: Record<string, Food> = {
    [ID(100)]: { group: 'protein', name: 'Chicken', archivedAt: null, dietTags: ['poultry'] },
    [ID(101)]: { group: 'carb', name: 'Bread', archivedAt: null, dietTags: ['gluten'] },
    [ID(102)]: { group: 'fat', name: 'Cheese-ish fat', archivedAt: null, dietTags: ['dairy'] },
  };
  return {
    foods: new Map(Object.entries({ ...base, ...foods })),
    config: DEFAULT_NUTRITION_CONFIG,
    preferences: null,
    features: CLOSED,
    recipeIds: new Set(),
    ...overrides,
  };
}

const TARGET = { kcal: 1500, floorConfirmation: null };

describe('publish rules', () => {
  it('a complete plan has no issues', () => {
    expect(findNutritionPublishIssues({ calorieTarget: TARGET, meals: [meal()] }, context())).toEqual([]);
  });

  it('needs a target, a meal, and a floor confirmation for that exact target', () => {
    const codes = (target: { kcal: number | null; floorConfirmation: { kcal: number } | null }, meals = [meal()]) =>
      findNutritionPublishIssues({ calorieTarget: target, meals }, context()).map((issue) => `${issue.severity}:${issue.code}`);

    expect(codes({ kcal: null, floorConfirmation: null }, [])).toEqual(['error:target_missing', 'error:no_meals']);
    expect(codes({ kcal: 1100, floorConfirmation: null })).toEqual(['error:floor_unconfirmed']);
    expect(codes({ kcal: 1100, floorConfirmation: { kcal: 1150 } })).toEqual(['error:floor_unconfirmed']);
    expect(codes({ kcal: 1100, floorConfirmation: { kcal: 1100 } })).toEqual([]);
    expect(codes({ kcal: 1200, floorConfirmation: null })).toEqual([]);
  });

  it('blocks missing, archived and wrong-group items, and empty options', () => {
    const plan = meal({
      options: [
        { id: ID(2), label: 'A', lines: [{ id: ID(3), kind: 'food', foodItemId: ID(999), group: 'protein', portions: 1 }] },
        { id: ID(7), label: 'B', lines: [] },
        { id: ID(8), label: 'C', lines: [{ id: ID(9), kind: 'food', foodItemId: ID(103), group: 'carb', portions: 1 }] },
      ],
    });
    const issues = findNutritionPublishIssues(
      { calorieTarget: TARGET, meals: [plan] },
      context({}, { [ID(103)]: { group: 'protein', name: 'Old', archivedAt: '2026-01-01T00:00:00.000Z', dietTags: [] } }),
    );
    const errors = issues.filter((issue) => issue.severity === 'error');
    expect(errors.map((issue) => [issue.code, issue.optionIndex, issue.lineIndex])).toEqual([
      ['food_missing', 0, 0],
      ['option_empty', 1, undefined],
      ['food_archived', 2, 0],
      ['food_group_mismatch', 2, 0],
    ]);
  });

  it('an option whose portions differ from its meal is a warning; counted text lines count', () => {
    const plan = meal({
      portions: { protein: 2, carb: 1, fat: 1 },
      options: [
        {
          id: ID(2),
          label: 'B',
          lines: [
            { id: ID(3), kind: 'text', group: 'protein', portions: 2, text: '150 g patties' },
            { id: ID(4), kind: 'food', foodItemId: ID(101), group: 'carb', portions: 1 },
            { id: ID(5), kind: 'food', foodItemId: ID(102), group: 'fat', portions: 0.5 },
          ],
        },
      ],
    });
    const issues = findNutritionPublishIssues({ calorieTarget: TARGET, meals: [plan] }, context());
    expect(issues).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'option_portions_mismatch', mealIndex: 0, optionIndex: 0 }),
    ]);
  });

  it('warns (never blocks) on diet, allergy and kosher conflicts', () => {
    const issues = findNutritionPublishIssues(
      { calorieTarget: TARGET, meals: [meal()] },
      context({ preferences: prefs({ dietType: 'vegetarian', religious: [{ id: 'kosher' }], allergies: [{ id: 'gluten' }] }) }),
    );
    expect(issues.every((issue) => issue.severity === 'warning')).toBe(true);
    expect(issues.map((issue) => [issue.code, issue.lineIndex])).toEqual([
      ['preference_conflict', 0],
      ['preference_conflict', 1],
      ['kosher_conflict', undefined],
    ]);
    expect(issues[0].message).toMatch(/\(vegetarian\)/);
    expect(issues[1].message).toMatch(/her allergy/);
  });

  it('warns when a keto / low-carb trainee has more carb portions a day than the limit', () => {
    const keto = prefs({ dietStyles: [{ id: 'keto_low_carb' }] });
    const issues = findNutritionPublishIssues({ calorieTarget: TARGET, meals: [meal(), meal({ id: ID(90) })] }, context({ preferences: keto }));
    expect(issues).toContainEqual(expect.objectContaining({ severity: 'warning', code: 'keto_conflict' }));
    const without = findNutritionPublishIssues({ calorieTarget: TARGET, meals: [meal()] }, context());
    expect(without.map((issue) => issue.code)).not.toContain('keto_conflict');
  });

  it('a recipe line is not publishable while recipes are closed', () => {
    const plan = meal({
      options: [{ id: ID(2), label: 'A', lines: [{ id: ID(3), kind: 'recipe', recipeId: ID(50), group: null, portions: 1 }] }],
    });
    const issues = findNutritionPublishIssues({ calorieTarget: TARGET, meals: [plan] }, context());
    expect(issues.map((issue) => issue.code)).toContain('recipe_unavailable');
  });
});

describe('kcal', () => {
  it("comes from portions × the group values, never from foods (the guide's day = 1,515)", () => {
    const meals = [
      { id: 'b', portions: { protein: 1, carb: 1, fat: 1 } },
      { id: 'l', portions: { protein: 2, carb: 1, fat: 1 } },
      { id: 's', portions: { protein: 0, carb: 1, fat: 1 } },
      { id: 'd', portions: { protein: 1.5, carb: 1, fat: 1 } },
    ];
    expect(computeNutritionKcal(meals, DEFAULT_NUTRITION_CONFIG.groupKcal)).toEqual({
      meals: [
        { mealId: 'b', kcal: 360 },
        { mealId: 'l', kcal: 510 },
        { mealId: 's', kcal: 210 },
        { mealId: 'd', kcal: 435 },
      ],
      day: 1515,
    });
  });
});

describe('save payload', () => {
  const target = { kcal: 1500, source: 'override', goal: 'fat_loss', formulaSex: null, confirmBelowFloor: false };

  it('accepts a plan and normalizes it', () => {
    const { value } = parseSaveNutritionPlanPayload(
      {
        calorieTarget: target,
        meals: [
          {
            name: ' Breakfast ',
            portions: { protein: 1.5, carb: 1 },
            vegetablesFree: true,
            options: [
              {
                label: 'A',
                lines: [
                  { kind: 'food', foodItemId: ID(100), portions: 0.5, group: 'fat' },
                  { kind: 'text', text: 'Salad', group: 'vegetable', portions: 3 },
                ],
              },
            ],
          },
        ],
        tips: [{ text: ' Drink water ' }],
      },
      CLOSED,
    );
    expect(value).toEqual({
      calorieTarget: { ...target, source: 'override' },
      meals: [
        {
          id: undefined,
          name: 'Breakfast',
          portions: { protein: 1.5, carb: 1, fat: 0 },
          vegetablesFree: true,
          options: [
            {
              id: undefined,
              label: 'A',
              // The client's group on a food line is ignored (the server copies the item's).
              lines: [
                { id: undefined, kind: 'food', foodItemId: ID(100), portions: 0.5 },
                { id: undefined, kind: 'text', text: 'Salad', group: 'vegetable', portions: null },
              ],
            },
          ],
        },
      ],
      tips: [{ id: undefined, text: 'Drink water' }],
    });
  });

  it('portions go in steps of 0.5', () => {
    const bad = (portions: unknown) =>
      parseSaveNutritionPlanPayload({ calorieTarget: target, meals: [{ name: 'M', portions, options: [] }], tips: [] }, CLOSED);
    expect(bad({ protein: 1.25 }).value).toBeNull();
    expect(bad({ protein: -1 }).value).toBeNull();
    expect(bad({ protein: 11 }).value).toBeNull();
    expect(bad({ protein: 0.5 }).value).not.toBeNull();
  });

  it('refuses the closed (13b) features: recipe lines and a water goal', () => {
    const withRecipe = parseSaveNutritionPlanPayload(
      {
        calorieTarget: target,
        meals: [{ name: 'M', portions: {}, options: [{ label: 'A', lines: [{ kind: 'recipe', recipeId: ID(5), portions: 1 }] }] }],
        tips: [],
      },
      CLOSED,
    );
    expect(withRecipe.issues[0].message).toMatch(/Recipes are not available/);

    const withWater = parseSaveNutritionPlanPayload({ calorieTarget: target, meals: [], tips: [], waterGoalMl: 2000 }, CLOSED);
    expect(withWater.issues[0].message).toMatch(/Water tracking is not available/);

    const open = parseSaveNutritionPlanPayload({ calorieTarget: target, meals: [], tips: [], waterGoalMl: 2000 }, { ...CLOSED, waterTracking: true });
    expect(open.value?.waterGoalMl).toBe(2000);
  });

  it('a target without kcal has no source; limits apply', () => {
    const empty = parseSaveNutritionPlanPayload({ calorieTarget: { ...target, kcal: null, source: 'suggested' }, meals: [], tips: [] }, CLOSED);
    expect(empty.value?.calorieTarget.source).toBeNull();
    const tooLow = parseSaveNutritionPlanPayload({ calorieTarget: { ...target, kcal: 100 }, meals: [], tips: [] }, CLOSED);
    expect(tooLow.value).toBeNull();
  });
});
