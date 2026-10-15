import type { MealLogDay } from '@sistem/types';
import { describeMarked, PORTION_GROUPS, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionCopy } from '../../copy';
import './DayPortionDetails.css';

interface DayPortionDetailsProps {
  day: MealLogDay;
  /** "Sun, 11 Oct". */
  title: string;
  onClose: () => void;
}

/** An opened day: marked of planned per group, and the day's meals with the photos she added. */
export function DayPortionDetails({ day, title, onClose }: DayPortionDetailsProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const photoOf = new Map(day.photos.map((photo) => [photo.mealId, photo]));
  // Photos of meals the plan no longer has still show (by the name stored with them).
  const extraPhotos = day.photos.filter((photo) => !day.meals.some((meal) => meal.id === photo.mealId));

  return (
    <section className="nb-day-details" aria-label={title}>
      <header className="nb-day-details-head">
        <h3 className="nb-day-details-title">{title}</h3>
        <button className="nb-day-details-close" type="button" aria-label={shared.common.close} onClick={onClose}>
          <Icon name="close" size="sm" />
        </button>
      </header>
      <ul className="nb-day-details-groups">
        {PORTION_GROUPS.filter((group) => day.planned[group] > 0 || day.eaten[group] > 0).map((group) => (
          <li key={group} className="nb-day-details-group" data-group={group}>
            <span>{shared.nutrition.groups[group]}</span>
            <b>
              <bdi>{describeMarked(day.eaten[group], day.planned[group], language)}</bdi>
            </b>
          </li>
        ))}
      </ul>
      {day.meals.length + extraPhotos.length > 0 && (
        <>
          <h4 className="nb-day-details-subtitle">{copy.tracking.dayMeals}</h4>
          <ul className="nb-day-details-meals">
            {[...day.meals.map((meal) => ({ id: meal.id, name: meal.name, photo: photoOf.get(meal.id) })), ...extraPhotos.map((photo) => ({ id: photo.mealId, name: photo.mealName, photo }))].map((meal) => (
              <li key={meal.id} className="nb-day-details-meal">
                <span className="nb-day-details-meal-name" dir="auto">
                  {meal.name}
                </span>
                {meal.photo && (
                  // A short-lived signed link made for this coach only; a click opens it full size.
                  <a className="nb-day-details-photo" href={meal.photo.url} target="_blank" rel="noreferrer">
                    <img src={meal.photo.url} alt={meal.name} loading="lazy" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
