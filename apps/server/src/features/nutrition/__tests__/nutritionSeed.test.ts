import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../exercises/__tests__/testDb';
import { Template } from '../../templates/template.model';
import { FoodItem } from '../foodItem.model';
import { applyNutritionSeed, validateNutritionSeed } from '../nutritionSeed';
import type { NutritionSeedData } from '../nutritionSeed';

// seed:nutrition with a FAKE fixture — the coach's real guide data is never committed.

function fixture(): NutritionSeedData {
  return {
    seedKeyPrefix: 'test-guide',
    foods: [
      { key: 'p1', group: 'protein', name: 'Fake protein', portion: '100 g', grams: 100, isNew: false, dietTags: ['dairy'] },
      { key: 'p2', group: 'protein', name: 'Fake eggs', portion: '2 units', grams: null, isNew: true, dietTags: ['eggs'] },
      { key: 'c1', group: 'carb', name: 'Fake bread', portion: '3 slices', grams: null, isNew: false, dietTags: ['gluten'] },
      { key: 'f1', group: 'fat', name: 'Fake oil', portion: '2 tsp', grams: null, isNew: false, dietTags: [] },
    ],
    template: {
      key: 'template',
      name: 'Fake 1,500',
      targetKcal: 1500,
      tips: ['Fake tip'],
      meals: [
        {
          name: 'Fake dinner',
          portions: { protein: 1.5, carb: 1, fat: 1 },
          vegetablesFree: true,
          options: [
            {
              label: 'A',
              lines: [
                { food: 'p1', portions: 1 },
                { food: 'p2', portions: 0.5 },
                { food: 'c1', portions: 1 },
                { food: 'f1', portions: 1 },
                { text: 'Big salad', group: 'vegetable' },
                { text: 'Fake patties', group: 'protein', portions: 2 },
              ],
            },
          ],
        },
      ],
    },
  };
}

describe('nutrition seed', () => {
  const coachId = String(new Types.ObjectId());

  beforeAll(connectTestDatabase);
  afterAll(disconnectTestDatabase);
  beforeEach(async () => {
    await clearTestDatabase();
    await Promise.all([FoodItem.init(), Template.init()]);
  });

  it('creates the items (no kcal, in order) and the template; re-running changes nothing', async () => {
    expect(await applyNutritionSeed(coachId, fixture())).toEqual({ foodsCreated: 4, foodsKept: 0, templateCreated: true, lactoseTagged: 1 });

    const items = await FoodItem.find({ coachId }).sort({ group: 1, order: 1 }).lean();
    expect(items.map((item) => [item.group, item.name, item.order, item.kcal, item.isNewItem])).toEqual([
      ['carb', 'Fake bread', 0, null, false],
      ['fat', 'Fake oil', 0, null, false],
      ['protein', 'Fake protein', 0, null, false],
      ['protein', 'Fake eggs', 1, null, true],
    ]);

    const template = await Template.findOne({ coachId }).lean();
    const lines = template!.nutrition!.meals[0].options[0].lines;
    expect(template).toMatchObject({ type: 'nutrition_plan', name: 'Fake 1,500', nutrition: { targetKcal: 1500 } });
    expect(lines.map((line) => [line.kind, line.group, line.portions])).toEqual([
      ['food', 'protein', 1],
      ['food', 'protein', 0.5],
      ['food', 'carb', 1],
      ['food', 'fat', 1],
      ['text', 'vegetable', null],
      ['text', 'protein', 2],
    ]);

    // The coach edits an item; a re-run keeps her edit and adds nothing.
    await FoodItem.updateOne({ coachId, name: 'Fake oil' }, { $set: { name: 'Olive oil' } });
    expect(await applyNutritionSeed(coachId, fixture())).toEqual({ foodsCreated: 0, foodsKept: 4, templateCreated: false, lactoseTagged: 0 });
    expect(await FoodItem.countDocuments({ coachId })).toBe(4);
    expect(await FoodItem.exists({ coachId, name: 'Olive oil' })).not.toBeNull();
    expect(await Template.countDocuments({ coachId })).toBe(1);
  });

  it('adds the lactose tag to dairy items once per coach — a tag she removes stays removed', async () => {
    await applyNutritionSeed(coachId, fixture());
    const dairy = await FoodItem.findOne({ coachId, name: 'Fake protein' }).lean();
    expect(dairy?.dietTags).toEqual(['dairy', 'lactose']);
    expect((await FoodItem.findOne({ coachId, name: 'Fake eggs' }).lean())?.dietTags).toEqual(['eggs']);

    await FoodItem.updateOne({ _id: dairy!._id }, { $set: { dietTags: ['dairy'] } });
    expect((await applyNutritionSeed(coachId, fixture())).lactoseTagged).toBe(0);
    expect((await FoodItem.findById(dairy!._id).lean())?.dietTags).toEqual(['dairy']);
  });

  it('refuses a broken file before writing anything', async () => {
    const broken = fixture();
    broken.template.meals[0].options[0].lines.push({ food: 'missing', portions: 1 });
    broken.foods[0].dietTags = ['bacon' as never];
    expect(validateNutritionSeed(broken)).toHaveLength(2);
    await expect(applyNutritionSeed(coachId, broken)).rejects.toThrow(/not valid/);
    expect(await FoodItem.countDocuments()).toBe(0);
  });
});
