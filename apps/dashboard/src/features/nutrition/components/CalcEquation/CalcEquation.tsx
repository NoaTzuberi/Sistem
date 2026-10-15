import type { CalorieSuggestion, Language } from '@sistem/types';
import { fill, formatNumber, isolateLtr, sharedCopy, useCopy, useI18n } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import './CalcEquation.css';

/** '+250', '−1,200', '−10%' — the sign (and a % after it) stay with the number in Hebrew text too. */
function signed(value: number, language: Language, suffix = ''): string {
  return isolateLtr(`${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), language)}${suffix}`);
}

interface CalcEquationProps {
  suggestion: CalorieSuggestion;
  floorKcal: number;
}

/** BMR × activity = TDEE ± the goal's change = the recommendation, then pace, timeframe and method. */
export function CalcEquation({ suggestion, floorKcal }: CalcEquationProps) {
  const { language, plural } = useI18n();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const kcal = shared.units.kcal;
  const delta = suggestion.deltaKcal ?? 0;
  const timeline = suggestion.timeline;

  return (
    <div className="nb-equation-wrap">
      <div className="nb-equation">
        <div className="nb-eq-term">
          <span className="nb-eq-label">{copy.bmr}</span>
          <b className="nb-eq-value">
            <bdi>{formatNumber(suggestion.bmr ?? 0, language)}</bdi>
          </b>
        </div>
        <span className="nb-eq-op" aria-hidden="true">×</span>
        <div className="nb-eq-term nb-eq-outline">
          <span className="nb-eq-label">{copy.builder.activityShort}</span>
          <b className="nb-eq-value">
            <bdi>{formatNumber(suggestion.inputs.activityFactor ?? 0, language)}</bdi>
          </b>
        </div>
        <span className="nb-eq-op" aria-hidden="true">=</span>
        <div className="nb-eq-term">
          <span className="nb-eq-label">{copy.tdee}</span>
          <b className="nb-eq-value">
            <bdi>{formatNumber(suggestion.tdee ?? 0, language)}</bdi>
          </b>
        </div>
        <span className="nb-eq-op" aria-hidden="true">{delta < 0 ? '−' : '+'}</span>
        <div className="nb-eq-term nb-eq-outline">
          <span className="nb-eq-label">{delta < 0 ? copy.deficit : copy.surplus}</span>
          <b className="nb-eq-value">
            {signed(suggestion.deltaPct ?? 0, language, '%')} <small className="nb-eq-small">{signed(delta, language)}</small>
          </b>
        </div>
        <span className="nb-eq-op" aria-hidden="true">=</span>
        <div className="nb-eq-term nb-eq-recommended">
          <span className="nb-eq-label">{copy.recommended}</span>
          <b className="nb-eq-value">
            <bdi>{suggestion.kcal === null ? '—' : formatNumber(suggestion.kcal, language)}</bdi> <small className="nb-eq-small">{kcal}</small>
          </b>
        </div>
      </div>
      <ul className="nb-eq-meta">
        <li>
          {copy.weeklyRate} <b>{signed(suggestion.weeklyRateKg ?? 0, language)}{copy.kgPerWeek}</b>
        </li>
        <li>
          {copy.expectedTimeline} <b>{suggestion.expectedWeeks !== null ? plural(copy.weeks, suggestion.expectedWeeks) : '—'}</b>
        </li>
        <li>
          {copy.method}{' '}
          <b>{suggestion.method === 'timeline' ? copy.methodTimeline : fill(copy.builder.methodGoal, { pct: signed(suggestion.inputs.adjustmentPct, language, '%') })}</b>
        </li>
      </ul>

      {timeline?.unsafe && (
        <div className="nb-eq-warning" role="alert">
          <p>
            <strong>{fill(copy.unsafePace, { weeks: timeline.recommendedWeeks ?? '—' })}</strong>
          </p>
          <p>
            {fill(copy.unsafeDetail, {
              weeks: timeline.requestedWeeks,
              required: timeline.requiredRateKg,
              safe: timeline.safeRateKg,
              limit: timeline.limitedBy === 'rate' ? copy.limitRate : timeline.limitedBy === 'max_deficit' ? copy.limitMaxDeficit : copy.limitFloor,
            })}
          </p>
        </div>
      )}
      {suggestion.timelineNote && <p className="nb-note">{copy.timelineNotes[suggestion.timelineNote]}</p>}
      {suggestion.raisedToFloor && <p className="nb-note">{fill(copy.raisedToFloor, { floor: formatNumber(floorKcal, language) })}</p>}
    </div>
  );
}
