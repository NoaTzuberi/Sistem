import { useState } from 'react';
import type { FormEvent } from 'react';
import type { DietTag, FoodCategory, FoodGroup, FoodItem, FoodItemPayload } from '@sistem/types';
import { FOOD_CATEGORIES, FOOD_GROUPS, sharedCopy, useCopy } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { nutritionCopy } from '../../copy';
import './FoodForm.css';

const DIET_TAGS = Object.keys(sharedCopy.en.nutrition.dietTags) as DietTag[];

interface FoodFormProps {
  /** Editing this item; a new item when unset. */
  item?: FoodItem;
  onSubmit: (payload: FoodItemPayload) => Promise<boolean>;
  onCancel?: () => void;
}

/** Add or edit one food item. The kcal cap is checked by the server. */
export function FoodForm({ item, onSubmit, onCancel }: FoodFormProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const [group, setGroup] = useState<FoodGroup>(item?.group ?? 'protein');
  const [name, setName] = useState(item?.name ?? '');
  const [portion, setPortion] = useState(item?.portion ?? '');
  const [grams, setGrams] = useState<number | undefined>(item?.grams ?? undefined);
  const [kcal, setKcal] = useState<number | undefined>(item?.kcal ?? undefined);
  const [isNew, setIsNew] = useState(item?.isNew ?? false);
  const [dietTags, setDietTags] = useState<DietTag[]>(item?.dietTags ?? []);
  const [category, setCategory] = useState<FoodCategory | null>(item?.category ?? null);
  const [busy, setBusy] = useState(false);
  const categories = FOOD_CATEGORIES[group];

  function changeGroup(next: FoodGroup) {
    setGroup(next);
    // A category of the old group doesn't fit the new one.
    if (category && !FOOD_CATEGORIES[next].includes(category)) setCategory(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const saved = await onSubmit({ group, category, name, portion, grams: grams ?? null, kcal: kcal ?? null, isNew, dietTags });
    setBusy(false);
    if (saved && !item) {
      setName('');
      setPortion('');
      setGrams(undefined);
      setKcal(undefined);
      setIsNew(false);
      setDietTags([]);
      setCategory(null);
    }
  }

  return (
    <form className="food-form" onSubmit={submit}>
      <label className="food-form-field">
        <span>{copy.group}</span>
        <select value={group} onChange={(event) => changeGroup(event.target.value as FoodGroup)}>
          {FOOD_GROUPS.map((id) => (
            <option key={id} value={id}>
              {shared.nutrition.groups[id]}
            </option>
          ))}
        </select>
      </label>
      {categories.length > 0 && (
        <label className="food-form-field">
          <span>{copy.category}</span>
          <select value={category ?? ''} onChange={(event) => setCategory((event.target.value || null) as FoodCategory | null)}>
            <option value="">{copy.categoryNone}</option>
            {categories.map((id) => (
              <option key={id} value={id}>
                {shared.nutrition.categories[id]}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="food-form-field food-form-wide">
        <span>{copy.name}</span>
        <input dir="auto" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
      </label>
      <label className="food-form-field">
        <span>{copy.portion}</span>
        <input dir="auto" value={portion} onChange={(event) => setPortion(event.target.value)} required maxLength={120} />
      </label>
      <NumberField label={copy.grams} value={grams} onChange={setGrams} />
      <NumberField label={copy.kcal} value={kcal} onChange={setKcal} disabled={group === 'vegetable'} />
      <label className="food-form-check">
        <input type="checkbox" checked={isNew} onChange={(event) => setIsNew(event.target.checked)} /> {copy.isNew}
      </label>
      <fieldset className="food-form-tags">
        <legend>{copy.dietTags}</legend>
        {DIET_TAGS.map((tag) => (
          <label key={tag} className="food-form-check">
            <input
              type="checkbox"
              checked={dietTags.includes(tag)}
              onChange={(event) => setDietTags(event.target.checked ? [...dietTags, tag] : dietTags.filter((current) => current !== tag))}
            />{' '}
            {shared.nutrition.dietTags[tag]}
          </label>
        ))}
      </fieldset>
      <div className="food-form-actions">
        <Button type="submit" variant="primary" size="sm" disabled={busy}>
          {item ? copy.save : copy.add}
        </Button>
        {onCancel && (
          <Button size="sm" onClick={onCancel}>
            {copy.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
