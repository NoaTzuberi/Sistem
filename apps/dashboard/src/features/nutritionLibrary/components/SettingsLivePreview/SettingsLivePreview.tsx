import type { CalorieSuggestion } from '@sistem/types';
import { fill, formatNumber, formatPortionCount, mealPortionList, sharedCopy, useCopy, useI18n } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsLivePreview.css';

interface SettingsLivePreviewProps {
  suggestion: CalorieSuggestion | null;
  /** A field is marked: the numbers on screen are from the last valid values. */
  isInvalid: boolean;
  hasError: boolean;
}

/**
 * "How this plays out": the server's fixed example trainee and what the unsaved numbers give her —
 * the daily kcal and portions, from the same calculation the builder uses.
 */
export function SettingsLivePreview({ suggestion, isInvalid, hasError }: SettingsLivePreviewProps) {
  const { language, plural } = useI18n();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy).preview;
  const inputs = suggestion?.inputs;

  return (
    <aside className="settings-preview" aria-labelledby="settings-preview-title">
      <span className="settings-preview-eyebrow">{copy.eyebrow}</span>
      <h2 className="settings-preview-title" id="settings-preview-title">
        {copy.title}
      </h2>
      {inputs && inputs.weightKg !== null && inputs.heightCm !== null && inputs.ageYears !== null && inputs.trainingDays !== null && (
        <p className="settings-preview-sample">
          {fill(copy.sample, {
            weight: formatNumber(inputs.weightKg, language),
            height: formatNumber(inputs.heightCm, language),
            age: formatNumber(inputs.ageYears, language),
            days: plural(copy.trainingDays, inputs.trainingDays),
            goal: shared.nutrition.goals[inputs.goal],
          })}
        </p>
      )}

      <div className="settings-preview-result" aria-live="polite">
        {suggestion?.kcal != null && (
          <>
            <p className="settings-preview-kcal">
              <b className="settings-preview-number">{formatNumber(suggestion.kcal, language)}</b>
              <span className="settings-preview-unit">{copy.perDay}</span>
              {suggestion.raisedToFloor && <span className="settings-preview-floor">{copy.raisedToFloor}</span>}
            </p>
            {suggestion.portions && (
              <ul className="settings-preview-portions" aria-label={copy.portionsLabel}>
                {mealPortionList(suggestion.portions).map(({ group, count }) => (
                  <li key={group} className={`settings-preview-portion food-group-${group}`}>
                    <b dir="ltr">{formatPortionCount(count)}</b> {shared.nutrition.groups[group]}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {isInvalid && <p className="settings-preview-state">{copy.invalid}</p>}
        {!isInvalid && hasError && <p className="settings-preview-state">{copy.error}</p>}
      </div>

      <p className="settings-preview-note">
        <Icon name="info" size="sm" />
        {copy.note}
      </p>
    </aside>
  );
}
