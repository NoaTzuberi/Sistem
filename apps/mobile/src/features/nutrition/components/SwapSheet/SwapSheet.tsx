import type { FoodGroup, NutritionFoodFacts } from '@sistem/types';
import { FOOD_GROUP_LABELS } from '@sistem/shared';
import { Modal } from '../../../../components/common/Modal/Modal';
import { Badge } from '../../../../components/common/Badge/Badge';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './SwapSheet.css';

interface SwapSheetProps {
  /** The group whose swaps are open; null = closed. */
  group: FoodGroup | null;
  swaps: Record<FoodGroup, NutritionFoodFacts[]>;
  /** The item she tapped, marked in the list. */
  currentFoodId?: string;
  onClose: () => void;
}

/** Grams only when the coach's portion text doesn't already say them ("150 גרם"). */
function showGrams(food: NutritionFoodFacts): boolean {
  return food.grams !== null && !food.portion.includes(String(food.grams));
}

/**
 * Every item of one group — any of them is one portion (the swap rule, PRD §5.6).
 * Names and portions are the coach's text, shown as written; no calories.
 */
export function SwapSheet({ group, swaps, currentFoodId, onClose }: SwapSheetProps) {
  const items = group ? swaps[group] : [];

  return (
    <Modal isOpen={group !== null} onClose={onClose} title={group ? NUTRITION_COPY.swapsTitle(FOOD_GROUP_LABELS[group]) : undefined}>
      <p className="swap-sheet-intro">{NUTRITION_COPY.swapsIntro}</p>
      {items.length === 0 ? (
        <p className="swap-sheet-empty">{NUTRITION_COPY.swapsEmpty}</p>
      ) : (
        <ul className="swap-sheet-list">
          {items.map((food) => (
            <li key={food.id} className={'swap-sheet-item' + (food.id === currentFoodId ? ' swap-sheet-item-current' : '')}>
              <div className="swap-sheet-text">
                <span className="swap-sheet-name" dir="auto">
                  {food.name}
                </span>
                <span className="swap-sheet-portion" dir="auto">
                  {food.portion}
                  {showGrams(food) && <span className="swap-sheet-grams"> · {NUTRITION_COPY.grams(food.grams!)}</span>}
                </span>
              </div>
              <div className="swap-sheet-tags">
                {food.id === currentFoodId && <span className="swap-sheet-current-label">{NUTRITION_COPY.swapsCurrent}</span>}
                {food.isNew && <Badge variant="accent">{NUTRITION_COPY.newTag}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
