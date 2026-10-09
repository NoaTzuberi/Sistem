import { useState } from 'react';
import type { FoodGroup, FoodItem, FoodItemPayload } from '@sistem/types';
import { fill, FOOD_GROUPS, sharedCopy, useCopy, useLoad } from '@sistem/shared';
import { createFood, deleteFood, getNutritionSettings, listFoods, restoreFood, updateFood } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { NutritionSubnav } from '../../components/NutritionSubnav/NutritionSubnav';
import { FoodForm } from '../../components/FoodForm/FoodForm';
import { GroupTabs } from '../../components/GroupTabs/GroupTabs';
import { CategoryChips } from '../../components/CategoryChips/CategoryChips';
import { matchesCategory } from '../../data/foodFilters';
import type { CategoryFilter } from '../../data/foodFilters';
import { nutritionCopy } from '../../copy';
import './FoodListPage.css';

async function loadFoods() {
  const [foods, settings] = await Promise.all([listFoods(), getNutritionSettings()]);
  return { foods, config: settings.config };
}

/** The coach's food list (PRD §5.6): exchange-list items per group, stored as she writes them. */
export function FoodListPage() {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const { data, error, isLoading, reload } = useLoad(loadFoods, copy.foodsLoadError);
  const [editingId, setEditingId] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);
  // Filters (13a+): one group (or all), then a category of that group.
  const [groupFilter, setGroupFilter] = useState<FoodGroup | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [message, setMessage] = useState<string>();

  async function run(action: () => Promise<string | void>): Promise<boolean> {
    setMessage(undefined);
    try {
      const done = await action();
      if (done) setMessage(done);
      reload();
      return true;
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : copy.foodSaveError);
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
      return result.outcome === 'archived' ? fill(copy.removedArchived, { name: item.name }) : fill(copy.removedDeleted, { name: item.name });
    });

  return (
    <div className="food-list-page">
      <NutritionSubnav />
      <h1 className="food-list-title">{copy.foodsTitle}</h1>
      <p className="food-list-note">{copy.foodsIntro}</p>

      <h2 className="food-list-subtitle">{copy.addFoodTitle}</h2>
      <FoodForm onSubmit={add} />

      {message && (
        <p className="food-list-message" role="status">
          {message}
        </p>
      )}
      <div className="food-list-filters">
        <GroupTabs
          groups={[null, ...FOOD_GROUPS]}
          value={groupFilter}
          onChange={(next) => {
            setGroupFilter(next);
            setCategoryFilter(null);
          }}
          label={copy.groupFilter}
          allLabel={copy.groupAll}
        />
        {data && groupFilter && (
          <CategoryChips
            group={groupFilter}
            items={data.foods.filter((food) => food.group === groupFilter && (showArchived || !food.archivedAt))}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        )}
        <label className="food-list-archived">
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> {copy.showArchived}
        </label>
      </div>

      {isLoading && !data && <p>{shared.common.loading}</p>}
      {error && !data && (
        <p role="alert">
          {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
        </p>
      )}

      {data &&
        FOOD_GROUPS.filter((group) => groupFilter === null || group === groupFilter).map((group) => {
          const items = data.foods.filter(
            (food) => food.group === group && (showArchived || !food.archivedAt) && matchesCategory(food, categoryFilter),
          );
          const cap = data.config.groupKcal[group];
          return (
            <section key={group} className="food-list-group" aria-labelledby={`food-group-${group}`}>
              <h2 className="food-list-subtitle" id={`food-group-${group}`}>
                {shared.nutrition.groups[group]} <span className="food-list-cap">· {cap > 0 ? fill(copy.groupCap, { kcal: cap }) : copy.groupFree}</span>
              </h2>
              {items.length === 0 ? (
                <p className="food-list-note">{copy.emptyGroup}</p>
              ) : (
                <table className="food-list-table">
                  <thead>
                    <tr>
                      <th>{copy.name}</th>
                      <th>{copy.category}</th>
                      <th>{copy.portion}</th>
                      <th>{copy.grams}</th>
                      <th>{copy.kcal}</th>
                      <th>{copy.dietTags}</th>
                      <th>
                        <span className="visually-hidden">{copy.actions}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) =>
                      editingId === item.id ? (
                        <tr key={item.id}>
                          <td colSpan={7}>
                            <FoodForm item={item} onSubmit={(payload) => save(item, payload)} onCancel={() => setEditingId(undefined)} />
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id} className={item.archivedAt ? 'food-list-row-archived' : undefined}>
                          <td dir="auto">
                            <bdi>{item.name}</bdi> {item.isNew && <Badge tone="accent">{copy.isNew}</Badge>}{' '}
                            {item.archivedAt && <Badge tone="alert">{copy.archived}</Badge>}
                          </td>
                          <td>{item.category ? shared.nutrition.categories[item.category] : '—'}</td>
                          <td dir="auto">{item.portion}</td>
                          <td>{item.grams ?? '—'}</td>
                          <td>{item.kcal ?? '—'}</td>
                          <td>{item.dietTags.map((tag) => shared.nutrition.dietTags[tag]).join(', ') || '—'}</td>
                          <td className="food-list-actions">
                            <Button size="sm" onClick={() => setEditingId(item.id)}>
                              {copy.edit}
                            </Button>
                            {item.archivedAt ? (
                              <Button size="sm" onClick={() => run(async () => void (await restoreFood(item.id)))}>
                                {copy.restore}
                              </Button>
                            ) : (
                              <Button size="sm" variant="danger" onClick={() => remove(item)}>
                                {copy.remove}
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
