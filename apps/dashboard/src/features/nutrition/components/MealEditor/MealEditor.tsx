import type { FoodGroup, FoodItem, NutritionIssue } from '@sistem/types';
import { FOOD_GROUP_LABELS, PORTION_GROUPS, formatKcal } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { PortionStepper } from '../PortionStepper/PortionStepper';
import { FoodPicker } from '../FoodPicker/FoodPicker';
import { IssueList } from '../IssueList/IssueList';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import { move, neededGroup, newFoodLine, newOption, newTextLine } from '../../nutritionDraft';
import type { DraftLine, DraftMeal, DraftOption } from '../../nutritionDraft';
import './MealEditor.css';

interface MealEditorProps {
  meal: DraftMeal;
  index: number;
  count: number;
  foods: FoodItem[];
  /** Her recently used items per group (the picker's "Recently used" row). */
  recentFoodIds: Partial<Record<FoodGroup, string[]>>;
  foodsById: Map<string, FoodItem>;
  /** The meal's kcal as the server last computed it. */
  kcal: number | undefined;
  /** Issues of this meal (mealIndex = index), from the last save. */
  issues: NutritionIssue[];
  onChange: (meal: DraftMeal) => void;
  onRemove: () => void;
  onMove: (offset: -1 | 1) => void;
}

const TEXT_GROUPS: (FoodGroup | '')[] = ['', 'vegetable', 'protein', 'carb', 'fat', 'snack'];

// Placeholder labels for new options — she renames them ("Option A", "Classic combo", …).
function nextOptionLabel(count: number): string {
  return `Option ${String.fromCharCode(65 + count)}`;
}

function LineRow({
  line,
  food,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  food: FoodItem | undefined;
  onChange: (line: DraftLine) => void;
  onRemove: () => void;
}) {
  const counted = line.group !== null && line.group !== 'vegetable';
  return (
    <li className="meal-line">
      {line.kind === 'food' && (
        <span className="meal-line-food">
          <span dir="auto">{food?.name ?? '—'}</span>
          {food && (
            <span className="meal-line-portion" dir="auto">
              {food.portion}
            </span>
          )}
          {food && <Badge>{FOOD_GROUP_LABELS[food.group]}</Badge>}
          {food?.archivedAt && <Badge tone="alert">{NUTRITION_COPY.archived}</Badge>}
        </span>
      )}
      {line.kind === 'text' && (
        <span className="meal-line-text">
          <input
            className="meal-input"
            dir="auto"
            value={line.text}
            placeholder={NUTRITION_COPY.lineText}
            aria-label={NUTRITION_COPY.lineText}
            onChange={(event) => onChange({ ...line, text: event.target.value })}
          />
          <select
            className="meal-select"
            aria-label={NUTRITION_COPY.lineGroup}
            value={line.group ?? ''}
            onChange={(event) => {
              const group = (event.target.value || null) as FoodGroup | null;
              const nowCounted = group !== null && group !== 'vegetable';
              onChange({ ...line, group, portions: nowCounted ? (line.portions ?? 1) : null });
            }}
          >
            {TEXT_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group ? FOOD_GROUP_LABELS[group] : NUTRITION_COPY.lineGroupNone}
              </option>
            ))}
          </select>
        </span>
      )}
      {line.kind === 'recipe' && <span className="meal-line-food">Recipe</span>}

      {(line.kind !== 'text' || counted) && (
        <PortionStepper
          label={NUTRITION_COPY.portions}
          value={line.portions ?? 1}
          min={0.5}
          onChange={(portions) => onChange({ ...line, portions })}
        />
      )}
      <Button size="sm" onClick={onRemove} aria-label={NUTRITION_COPY.removeLine}>
        ✕
      </Button>
    </li>
  );
}

/** One meal: name, portions per group (vegetables free), kcal, and the coach's options. */
export function MealEditor({ meal, index, count, foods, recentFoodIds, foodsById, kcal, issues, onChange, onRemove, onMove }: MealEditorProps) {
  function updateOption(optionIndex: number, option: DraftOption) {
    onChange({ ...meal, options: meal.options.map((current, i) => (i === optionIndex ? option : current)) });
  }

  const mealIssues = issues.filter((issue) => issue.optionIndex === undefined);

  return (
    <article className="meal-editor">
      <header className="meal-editor-header">
        <input
          className="meal-input meal-editor-name"
          dir="auto"
          value={meal.name}
          aria-label={NUTRITION_COPY.mealName}
          onChange={(event) => onChange({ ...meal, name: event.target.value })}
        />
        {kcal !== undefined && <span className="meal-editor-kcal">{formatKcal(kcal)}</span>}
        <div className="meal-editor-actions">
          <Button size="sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label={NUTRITION_COPY.moveUp}>
            ↑
          </Button>
          <Button size="sm" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={NUTRITION_COPY.moveDown}>
            ↓
          </Button>
          <Button size="sm" variant="danger" onClick={onRemove} aria-label={NUTRITION_COPY.removeMeal}>
            ✕
          </Button>
        </div>
      </header>

      <div className="meal-editor-portions">
        {PORTION_GROUPS.map((group) => (
          <PortionStepper
            key={group}
            label={FOOD_GROUP_LABELS[group]}
            value={meal.portions[group]}
            onChange={(value) => onChange({ ...meal, portions: { ...meal.portions, [group]: value } })}
          />
        ))}
        <label className="meal-editor-vegetables">
          <input
            type="checkbox"
            checked={meal.vegetablesFree}
            onChange={(event) => onChange({ ...meal, vegetablesFree: event.target.checked })}
          />{' '}
          {NUTRITION_COPY.vegetablesFree}
        </label>
      </div>
      <IssueList issues={mealIssues} />

      <div className="meal-editor-options">
        {meal.options.map((option, optionIndex) => (
          <section key={option.key} className="meal-option">
            <div className="meal-option-header">
              <input
                className="meal-input"
                dir="auto"
                value={option.label}
                aria-label={NUTRITION_COPY.optionLabel}
                onChange={(event) => updateOption(optionIndex, { ...option, label: event.target.value })}
              />
              <Button size="sm" onClick={() => onChange({ ...meal, options: move(meal.options, optionIndex, -1) })} disabled={optionIndex === 0} aria-label={NUTRITION_COPY.moveUp}>
                ↑
              </Button>
              <Button
                size="sm"
                variant="danger"
                aria-label={NUTRITION_COPY.removeOption}
                onClick={() => onChange({ ...meal, options: meal.options.filter((_, i) => i !== optionIndex) })}
              >
                ✕
              </Button>
            </div>
            <ul className="meal-lines">
              {option.lines.map((line, lineIndex) => (
                <LineRow
                  key={line.key}
                  line={line}
                  food={line.foodItemId ? foodsById.get(line.foodItemId) : undefined}
                  onChange={(next) => updateOption(optionIndex, { ...option, lines: option.lines.map((current, i) => (i === lineIndex ? next : current)) })}
                  onRemove={() => updateOption(optionIndex, { ...option, lines: option.lines.filter((_, i) => i !== lineIndex) })}
                />
              ))}
            </ul>
            <div className="meal-option-add">
              <FoodPicker
                foods={foods}
                recentFoodIds={recentFoodIds}
                initialGroup={neededGroup(meal, option)}
                onPick={(food) => updateOption(optionIndex, { ...option, lines: [...option.lines, newFoodLine(food.id, food.group)] })}
              />
              <Button size="sm" onClick={() => updateOption(optionIndex, { ...option, lines: [...option.lines, newTextLine()] })}>
                {NUTRITION_COPY.addText}
              </Button>
            </div>
            <IssueList issues={issues.filter((issue) => issue.optionIndex === optionIndex)} />
          </section>
        ))}
        <Button size="sm" onClick={() => onChange({ ...meal, options: [...meal.options, newOption(nextOptionLabel(meal.options.length))] })}>
          {NUTRITION_COPY.addOption}
        </Button>
      </div>
    </article>
  );
}
