import type { AiNutritionRecommendation } from '@sistem/types';
import { describeMealPortions, fill, formatDateTime, formatKcal, sharedCopy, useCopy, useI18n } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import {freeTextSourceLabel} from '../../data/aiDraftDisplay';
import { aiDraftCopy } from '../../copy';
import type { useLatestAiDraft } from '../../hooks/useLatestAiDraft';
import './NutritionAiDraftCard.css';

interface NutritionAiDraftCardProps {
  ai: ReturnType<typeof useLatestAiDraft<'nutrition_plan'>>;
  /** Puts the ready draft's meals into the editable plan. */
  onLoad: (recommendation: AiNutritionRecommendation) => void;
  /** The draft the plan's meals came from, if any. */
  loadedId: string | null;
  disabled?: boolean;
}

/**
 * Nutrition builder: the newest AI nutrition draft — status, Generate / Regenerate, her
 * summary, what code could not check, and "Load AI draft". Coach-only (PRD §5.6, 13c).
 */
export function NutritionAiDraftCard({ ai, onLoad, loadedId, disabled = false }: NutritionAiDraftCardProps) {
  const { language, plural } = useI18n();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(aiDraftCopy);
  const { latest, ready, running, unavailableReason } = ai;
  const canGenerate = !unavailableReason && !running && !ai.isStarting && !disabled;
  const output = ready?.output;
  const profile = ready?.input?.profile;

  return (
    <section className="nutrition-ai-card" aria-live="polite" aria-labelledby="nutrition-ai-title">
      <header className="nutrition-ai-header">
        <h2 className="nutrition-ai-title" id="nutrition-ai-title">
          {copy.nutrition.title}
        </h2>
        {latest && (
          <Badge tone={latest.status === 'failed' ? 'alert' : latest.status === 'ready' ? 'accent' : 'neutral'}>
            {copy.status[latest.status]}
          </Badge>
        )}
      </header>

      {ai.isLoading && <p className="nutrition-ai-muted">{shared.common.loading}</p>}
      {ai.error && <p className="nutrition-ai-error">{ai.error}</p>}
      {unavailableReason && <p className="nutrition-ai-muted">{unavailableReason}</p>}
      {!ai.isLoading && !latest && !unavailableReason && <p className="nutrition-ai-muted">{copy.nutrition.none}</p>}
      {running && <p className="nutrition-ai-muted">{copy.nutrition.generating}</p>}
      {latest?.status === 'failed' && latest.error && (
        <p className="nutrition-ai-error">
          {copy.training.failedPrefix} {latest.error.message}
        </p>
      )}

      {ready && output && (
        <>
          <p className="nutrition-ai-summary" dir="auto">
            {output.summary}
          </p>
          <p className="nutrition-ai-built-for">
            {fill(copy.nutrition.builtFor, { kcal: formatKcal(output.kcal, language), portions: describeMealPortions(output.dailyPortions, false, language) })}
          </p>
          <p className="nutrition-ai-muted">
            {plural(copy.nutrition.meals, output.meals.length)} · {formatDateTime(ready.completedAt ?? ready.createdAt, language)}
            {ready.model ? ` · ${ready.model}` : ''}
          </p>

          {profile && !profile.nutritionAnswered && <p className="nutrition-ai-warning">{copy.nutrition.notAnswered}</p>}
          {profile && profile.freeText.length > 0 && (
            <div className="nutrition-ai-block">
              <h3 className="nutrition-ai-heading">{copy.nutrition.checkByHand}</h3>
              <p className="nutrition-ai-muted">{copy.nutrition.checkByHandNote}</p>
              <dl className="nutrition-ai-texts">
                {profile.freeText.map((item) => (
                  <div key={item.source} className="nutrition-ai-text">
                    <dt>{freeTextSourceLabel(item.source, copy)}</dt>
                    <dd dir="auto">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {output.considerations.length > 0 && (
            <div className="nutrition-ai-block">
              <h3 className="nutrition-ai-heading">{copy.nutrition.considerations}</h3>
              <ul className="nutrition-ai-list">
                {output.considerations.map((item) => (
                  <li key={item} dir="auto">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="nutrition-ai-note">{copy.nutrition.reviewNote}</p>
          {loadedId === ready.id && <Badge>{copy.nutrition.loadedBadge}</Badge>}
        </>
      )}

      {ai.startError && <p className="nutrition-ai-error">{ai.startError}</p>}

      <div className="nutrition-ai-actions">
        {ready && (
          <Button variant="primary" size="sm" disabled={disabled} onClick={() => onLoad(ready)}>
            {copy.nutrition.load}
          </Button>
        )}
        {!unavailableReason && !running && (
          <Button size="sm" disabled={!canGenerate} onClick={() => void ai.generate()}>
            {!latest ? copy.training.generate : latest.status === 'failed' ? copy.training.tryAgain : copy.training.regenerate}
          </Button>
        )}
      </div>
    </section>
  );
}
