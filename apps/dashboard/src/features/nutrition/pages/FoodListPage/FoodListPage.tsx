import { useState } from 'react';
import type { FoodItem, FoodItemPayload } from '@sistem/types';
import { DIET_TAG_LABELS, FOOD_GROUPS, FOOD_GROUP_LABELS, useLoad } from '@sistem/shared';
import { createFood, deleteFood, getNutritionSettings, listFoods, restoreFood, updateFood } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { NutritionSubnav } from '../../components/NutritionSubnav/NutritionSubnav';
import { FoodForm } from '../../components/FoodForm/FoodForm';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './FoodListPage.css';

async function loadFoods() {
  const [foods, settings] = await Promise.all([listFoods(), getNutritionSettings()]);
  return { foods, config: settings.config };
}

/** The coach's food list (PRD §5.6): exchange-list items per group, stored as she writes them. */
export function FoodListPage() {
  const { data, error, isLoading, reload } = useLoad(loadFoods, "Couldn't load the food list.");
  const [editingId, setEditingId] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);
  const [message, setMessage] = useState<string>();

  async function run(action: () => Promise<string | void>): Promise<boolean> {
    setMessage(undefined);
    try {
      const done = await action();
      if (done) setMessage(done);
      reload();
      return true;
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Couldn't save.");
      return false;
    }
  }

  const add = (payload: FoodItemPayload) => run(async () => void (await createFood(payload)));
  const save = (item: FoodItem, payload: FoodItemPayload) =>
    run(async () => {
      await updateFood(item.id, payload);
      setEditingId(undefined);
    });
  const remove = (item: FoodItem) =>
    run(async () => {
      const result = await deleteFood(item.id);
      return result.outcome === 'archived' ? NUTRITION_COPY.removedArchived(item.name) : NUTRITION_COPY.removedDeleted(item.name);
    });

  return (
    <div className="food-list-page">
      <NutritionSubnav />
      <h1 className="food-list-title">{NUTRITION_COPY.foodsTitle}</h1>
      <p className="food-list-note">{NUTRITION_COPY.foodsIntro}</p>

      <h2 className="food-list-subtitle">{NUTRITION_COPY.addFoodTitle}</h2>
      <FoodForm onSubmit={add} />

      {message && (
        <p className="food-list-message" role="status">
          {message}
        </p>
      )}
      <label className="food-list-archived">
        <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> {NUTRITION_COPY.showArchived}
      </label>

      {isLoading && !data && <p>Loading…</p>}
      {error && !data && (
        <p role="alert">
          {error} <Button size="sm" onClick={reload}>Try again</Button>
        </p>
      )}

      {data &&
        FOOD_GROUPS.map((group) => {
          const items = data.foods.filter((food) => food.group === group && (showArchived || !food.archivedAt));
          const cap = data.config.groupKcal[group];
          return (
            <section key={group} className="food-list-group" aria-labelledby={`food-group-${group}`}>
              <h2 className="food-list-subtitle" id={`food-group-${group}`}>
                {FOOD_GROUP_LABELS[group]} <span className="food-list-cap">· {cap > 0 ? NUTRITION_COPY.groupCap(cap) : NUTRITION_COPY.groupFree}</span>
              </h2>
              {items.length === 0 ? (
                <p className="food-list-note">{NUTRITION_COPY.emptyGroup}</p>
              ) : (
                <table className="food-list-table">
                  <thead>
                    <tr>
                      <th>{NUTRITION_COPY.name}</th>
                      <th>{NUTRITION_COPY.portion}</th>
                      <th>{NUTRITION_COPY.grams}</th>
                      <th>{NUTRITION_COPY.kcal}</th>
                      <th>{NUTRITION_COPY.dietTags}</th>
                      <th>
                        <span className="visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) =>
                      editingId === item.id ? (
                        <tr key={item.id}>
                          <td colSpan={6}>
                            <FoodForm item={item} onSubmit={(payload) => save(item, payload)} onCancel={() => setEditingId(undefined)} />
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id} className={item.archivedAt ? 'food-list-row-archived' : undefined}>
                          <td dir="auto">
                            {item.name} {item.isNew && <Badge tone="accent">{NUTRITION_COPY.isNew}</Badge>}{' '}
                            {item.archivedAt && <Badge tone="alert">{NUTRITION_COPY.archived}</Badge>}
                          </td>
                          <td dir="auto">{item.portion}</td>
                          <td>{item.grams ?? '—'}</td>
                          <td>{item.kcal ?? '—'}</td>
                          <td>{item.dietTags.map((tag) => DIET_TAG_LABELS[tag]).join(', ') || '—'}</td>
                          <td className="food-list-actions">
                            <Button size="sm" onClick={() => setEditingId(item.id)}>
                              {NUTRITION_COPY.edit}
                            </Button>
                            {item.archivedAt ? (
                              <Button size="sm" onClick={() => run(async () => void (await restoreFood(item.id)))}>
                                {NUTRITION_COPY.restore}
                              </Button>
                            ) : (
                              <Button size="sm" variant="danger" onClick={() => remove(item)}>
                                {NUTRITION_COPY.remove}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
    </div>
  );
}
