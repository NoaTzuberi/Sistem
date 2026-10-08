import type { FoodItem } from '@sistem/types';
import { FOOD_GROUPS, FOOD_GROUP_LABELS } from '@sistem/shared';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './FoodPicker.css';

interface FoodPickerProps {
  foods: FoodItem[];
  onPick: (food: FoodItem) => void;
}

/**
 * Adds a line from her active food list, grouped by group. Conflicts with the trainee's
 * preferences come back from the server as warnings after the autosave.
 */
export function FoodPicker({ foods, onPick }: FoodPickerProps) {
  const active = foods.filter((food) => !food.archivedAt);
  return (
    <select
      className="food-picker"
      value=""
      aria-label={NUTRITION_COPY.addFood}
      onChange={(event) => {
        const food = active.find((item) => item.id === event.target.value);
        if (food) onPick(food);
      }}
    >
      <option value="">{NUTRITION_COPY.addFood}</option>
      {FOOD_GROUPS.map((group) => {
        const items = active.filter((food) => food.group === group);
        if (items.length === 0) return null;
        return (
          <optgroup key={group} label={FOOD_GROUP_LABELS[group]}>
            {items.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name} — {food.portion}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
