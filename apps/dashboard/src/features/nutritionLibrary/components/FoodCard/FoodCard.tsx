import type { CSSProperties } from 'react';
import type { FoodItem } from '@sistem/types';
import { fill, formatNumber, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { capShare, kcalStatus } from '../../data/foodLibrary';
import { nutritionLibraryCopy } from '../../copy';
import './FoodCard.css';

interface FoodCardProps {
  item: FoodItem;
  /** The group's kcal per portion; 0 = free (vegetables). */
  cap: number;
  onEdit: (item: FoodItem) => void;
  onRemove: (item: FoodItem) => void;
  onRestore: (item: FoodItem) => void;
}

/**
 * One portion of a food: its category, name, how she measures it, grams and kcal against the group's
 * cap, and what it contains. A missing kcal or one over the cap is flagged in amber (the coach fixes it).
 */
export function FoodCard({ item, cap, onEdit, onRemove, onRestore }: FoodCardProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy);
  const status = kcalStatus(item, cap);
  const isWarn = status === 'missing' || status === 'over';
  const classNames = ['food-card', isWarn && 'food-card-warn', item.archivedAt && 'food-card-archived'].filter(Boolean).join(' ');

  return (
    <article className={classNames}>
      <div className="food-card-top">
        {item.category && <span className="food-card-category">{shared.nutrition.categories[item.category]}</span>}
        {item.isNew && <span className="food-card-new">{copy.isNew}</span>}
        {item.archivedAt && <span className="food-card-archived-tag">{copy.archived}</span>}
        <span className="food-card-actions">
          <button className="food-card-action" type="button" aria-label={fill(copy.editNamed, { name: item.name })} onClick={() => onEdit(item)}>
            <Icon name="pencil" size="sm" />
          </button>
          {item.archivedAt ? (
            <button
              className="food-card-action"
              type="button"
              aria-label={fill(copy.restoreNamed, { name: item.name })}
              onClick={() => onRestore(item)}
            >
              <Icon name="refresh" size="sm" />
            </button>
          ) : (
            <button
              className="food-card-action"
              type="button"
              aria-label={fill(copy.removeNamed, { name: item.name })}
              onClick={() => onRemove(item)}
            >
              <Icon name="archive" size="sm" />
            </button>
          )}
        </span>
      </div>

      <h3 className="food-card-name" dir="auto">
        {item.name}
      </h3>
      <p className="food-card-portion" dir="auto">
        {item.portion}
      </p>

      <div className="food-card-numbers">
        <span>
          <b className="food-card-number">{item.grams ?? '—'}</b> {item.grams !== null && copy.grams}
        </span>
        <span className={isWarn ? 'food-card-kcal-warn' : undefined}>
          <b className="food-card-number">{item.kcal !== null ? formatNumber(item.kcal, language) : '—'}</b> {copy.kcal}
          {status === 'missing' && ` ${copy.kcalMissing}`}
          {status === 'over' && ` ${copy.kcalOver}`}
        </span>
      </div>
      {cap > 0 && item.kcal !== null && (
        <span
          className="food-card-bar"
          role="img"
          aria-label={fill(copy.kcalOfCap, { kcal: item.kcal, cap })}
          style={{ '--share': capShare(item.kcal, cap) } as CSSProperties}
        >
          <span className="food-card-bar-fill" />
        </span>
      )}

      {item.dietTags.length > 0 ? (
        <ul className="food-card-tags" aria-label={copy.containsLabel}>
          {item.dietTags.map((tag) => (
            <li key={tag} className="food-card-tag">
              {shared.nutrition.dietTags[tag]}
            </li>
          ))}
        </ul>
      ) : (
        <p className="food-card-no-tags">{copy.noContains}</p>
      )}
    </article>
  );
}
