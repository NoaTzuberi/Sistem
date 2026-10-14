import type { FoodGroup, FoodItem, NutritionIssue } from '@sistem/types';
import { sharedCopy, useCopy } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionCopy } from '../../copy';
import { neededGroup, newFoodLine, newTextLine } from '../../nutritionDraft';
import type { DraftLine, DraftMeal, DraftOption } from '../../nutritionDraft';
import { FoodPicker } from '../FoodPicker/FoodPicker';
import { IssueList } from '../IssueList/IssueList';
import { PortionStepper } from '../PortionStepper/PortionStepper';
import './OptionPanel.css';

const TEXT_GROUPS: (FoodGroup | '')[] = ['', 'vegetable', 'protein', 'carb', 'fat', 'snack'];

interface OptionPanelProps {
  meal: DraftMeal;
  option: DraftOption;
  canMoveUp: boolean;
  foods: FoodItem[];
  recentFoodIds: Partial<Record<FoodGroup, string[]>>;
  foodsById: Map<string, FoodItem>;
  issues: NutritionIssue[];
  onChange: (option: DraftOption) => void;
  onMoveUp: () => void;
  onRemove: () => void;
}

/** The open option of a meal: its name, the coach's food items and text lines, and what to add. */
export function OptionPanel({ meal, option, canMoveUp, foods, recentFoodIds, foodsById, issues, onChange, onMoveUp, onRemove }: OptionPanelProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const setLine = (index: number, line: DraftLine) => onChange({ ...option, lines: option.lines.map((current, i) => (i === index ? line : current)) });

  return (
    <div className="nb-option">
      <div className="nb-option-head">
        <input
          className="nb-inline-input"
          dir="auto"
          value={option.label}
          aria-label={copy.optionLabel}
          onChange={(event) => onChange({ ...option, label: event.target.value })}
        />
        <button className="nb-tool" type="button" onClick={onMoveUp} disabled={!canMoveUp} aria-label={copy.moveUp}>
          <Icon name="arrowUp" size="sm" />
        </button>
        <button className="nb-tool nb-tool-delete" type="button" onClick={onRemove} aria-label={copy.removeOption}>
          <Icon name="trash" size="sm" />
        </button>
      </div>

      {option.lines.length > 0 && (
        <ul className="nb-lines">
          {option.lines.map((line, index) => {
            const food = line.foodItemId ? foodsById.get(line.foodItemId) : undefined;
            const counted = line.group !== null && line.group !== 'vegetable';
            return (
              <li key={line.key} className="nb-line">
                {line.kind === 'food' && (
                  <span className="nb-line-food">
                    <span dir="auto">{food?.name ?? '—'}</span>
                    {food && (
                      <span className="nb-line-portion" dir="auto">
                        <bdi>{food.portion}</bdi>
                      </span>
                    )}
                    {food && <Badge>{shared.nutrition.groups[food.group]}</Badge>}
                    {food?.archivedAt && <Badge tone="alert">{copy.archived}</Badge>}
                  </span>
                )}
                {line.kind === 'text' && (
                  <span className="nb-line-food">
                    <input
                      className="nb-inline-input"
                      dir="auto"
                      value={line.text}
                      placeholder={copy.lineText}
                      aria-label={copy.lineText}
                      onChange={(event) => setLine(index, { ...line, text: event.target.value })}
                    />
                    <select
                      className="nb-line-select"
                      aria-label={copy.lineGroup}
                      value={line.group ?? ''}
                      onChange={(event) => {
                        const group = (event.target.value || null) as FoodGroup | null;
                        const nowCounted = group !== null && group !== 'vegetable';
                        setLine(index, { ...line, group, portions: nowCounted ? (line.portions ?? 1) : null });
                      }}
                    >
                      {TEXT_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group ? shared.nutrition.groups[group] : copy.lineGroupNone}
                        </option>
                      ))}
                    </select>
                  </span>
                )}
                {line.kind === 'recipe' && <span className="nb-line-food">{copy.recipe}</span>}
                {(line.kind !== 'text' || counted) && (
                  <PortionStepper label={copy.portions} value={line.portions ?? 1} min={0.5} onChange={(portions) => setLine(index, { ...line, portions })} />
                )}
                <button className="nb-tool" type="button" aria-label={copy.removeLine} onClick={() => onChange({ ...option, lines: option.lines.filter((_, i) => i !== index) })}>
                  <Icon name="close" size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="nb-option-add">
        <FoodPicker
          foods={foods}
          recentFoodIds={recentFoodIds}
          initialGroup={neededGroup(meal, option)}
          onPick={(food) => onChange({ ...option, lines: [...option.lines, newFoodLine(food.id, food.group)] })}
        />
        <button className="nb-pill-button" type="button" onClick={() => onChange({ ...option, lines: [...option.lines, newTextLine()] })}>
          {copy.addText}
        </button>
      </div>
      <IssueList issues={issues} />
    </div>
  );
}
