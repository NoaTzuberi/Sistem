import { useState } from 'react';
import type { DietTag, FoodCategory, FoodGroup, FoodItem, FoodItemPayload } from '@sistem/types';
import { FOOD_CATEGORIES } from '@sistem/shared';

/** The food sheet's fields. Name and portion are required (the server refuses either empty). */
export function useFoodForm(item: FoodItem | null, defaultGroup: FoodGroup, caps: Record<FoodGroup, number>) {
  const [group, setGroup] = useState<FoodGroup>(item?.group ?? defaultGroup);
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<FoodCategory | null>(item?.category ?? null);
  const [portion, setPortion] = useState(item?.portion ?? '');
  const [grams, setGrams] = useState<number | undefined>(item?.grams ?? undefined);
  const [kcal, setKcal] = useState<number | undefined>(item?.kcal ?? undefined);
  const [dietTags, setDietTags] = useState<DietTag[]>(item?.dietTags ?? []);
  const [isNew, setIsNew] = useState(item?.isNew ?? false);

  const cap = caps[group];
  const isFree = cap <= 0;

  function changeGroup(next: FoodGroup) {
    setGroup(next);
    // A category of the old group doesn't fit the new one; a free group has no kcal.
    if (category && !FOOD_CATEGORIES[next].includes(category)) setCategory(null);
    if (caps[next] <= 0) setKcal(undefined);
  }

  function toggleTag(tag: DietTag) {
    setDietTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));
  }

  const isComplete = name.trim() !== '' && portion.trim() !== '';
  const isKcalOver = !isFree && kcal !== undefined && kcal > cap;

  function toPayload(): FoodItemPayload {
    return {
      group,
      category,
      name: name.trim(),
      portion: portion.trim(),
      grams: grams ?? null,
      kcal: isFree ? null : (kcal ?? null),
      isNew,
      dietTags,
    };
  }

  return {
    values: { group, name, category, portion, grams, kcal, dietTags, isNew },
    cap,
    isFree,
    isComplete,
    isKcalOver,
    changeGroup,
    setName,
    setCategory,
    setPortion,
    setGrams,
    setKcal,
    toggleTag,
    setIsNew,
    toPayload,
  };
}
