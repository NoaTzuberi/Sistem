import { useCallback } from 'react';
import type { AiTraineeProfile, AiTrainingRecommendation } from '@sistem/types';
import { DAY_NAMES, humanizeId, humanizeList, useLoad } from '@sistem/shared';
import { getAiRecommendation } from '../../../../services/coach/coachService';
import { Badge } from '../../../../components/common/Badge/Badge';
import { AI_DRAFT_COPY } from '../../data/aiDraftCopy';
import './AiRationalePanel.css';

interface AiRationalePanelProps {
  traineeId: string;
  recommendationId: string;
  /** Already loaded (the latest draft) — saves a request. */
  recommendation?: AiTrainingRecommendation | null;
}

function profileRows(profile: AiTraineeProfile): { label: string; value: string }[] {
  const days = profile.trainingDays;
  const rows = [
    { label: 'Age', value: profile.ageYears !== undefined ? String(profile.ageYears) : '—' },
    { label: 'Height / weight', value: `${profile.heightCm ?? '—'} cm / ${profile.weightKg ?? '—'} kg` },
    { label: 'Gender', value: profile.gender ? humanizeId(profile.gender) : '—' },
    { label: 'Goals', value: humanizeList(profile.goals) },
    { label: 'Days per week', value: days ? `${days.min}–${days.max}${days.flexible ? ' (flexible)' : ''}` : '—' },
    { label: 'Muscle focus', value: humanizeList(profile.muscleFocus) },
    { label: 'Equipment', value: humanizeList(profile.equipment) },
    { label: 'Activities', value: humanizeList(profile.preferredActivities) },
    { label: 'Recovery flags', value: humanizeList(profile.recoveryFlags) },
    { label: 'Favorite exercises', value: profile.notes.favoriteExercises ?? '—' },
    { label: 'Wants to improve', value: profile.notes.exercisesToImprove ?? '—' },
    { label: 'Recovery notes', value: profile.notes.recovery ?? '—' },
  ];
  return rows;
}

/** Plan builder: why the AI drafted this plan, and what it was given. Coach-only. */
export function AiRationalePanel({ traineeId, recommendationId, recommendation }: AiRationalePanelProps) {
  const known = recommendation?.id === recommendationId ? recommendation : null;
  const load = useCallback(
    () => (known ? Promise.resolve(known) : getAiRecommendation(traineeId, recommendationId)),
    [known, traineeId, recommendationId],
  );
  const { data: loaded, error } = useLoad(load, AI_DRAFT_COPY.loadError);
  // A plan only links training drafts; anything else reads as "couldn't load".
  const data = loaded?.type === 'training_plan' ? loaded : loaded ? { ...loaded, input: null, output: null } : undefined;
  const output = data?.output;

  return (
    <details className="ai-rationale" open>
      <summary className="ai-rationale-summary">
        <span className="ai-rationale-title">{AI_DRAFT_COPY.rationaleTitle}</span>
        <Badge tone="alert">{AI_DRAFT_COPY.reviewBadge}</Badge>
      </summary>

      {error && <p className="ai-rationale-muted">{error}</p>}
      {data && !output && <p className="ai-rationale-muted">{AI_DRAFT_COPY.loadError}</p>}

      {output && (
        <div className="ai-rationale-body">
          <p className="ai-rationale-text" dir="auto">
            {output.summary}
          </p>

          <h3 className="ai-rationale-heading">{AI_DRAFT_COPY.split}</h3>
          <p className="ai-rationale-text" dir="auto">
            {output.split}
          </p>

          {output.considerations.length > 0 && (
            <>
              <h3 className="ai-rationale-heading">{AI_DRAFT_COPY.considerations}</h3>
              <ul className="ai-rationale-list">
                {output.considerations.map((item) => (
                  <li key={item} dir="auto">
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="ai-rationale-heading">{AI_DRAFT_COPY.workouts}</h3>
          {output.workouts.map((workout, index) => (
            <div key={`${workout.title}-${index}`} className="ai-rationale-workout">
              <p className="ai-rationale-workout-title">
                {workout.title}
                {workout.dayOfWeek !== undefined ? ` · ${DAY_NAMES[workout.dayOfWeek]}` : ''}
              </p>
              <p className="ai-rationale-muted" dir="auto">
                {workout.focus}
              </p>
              <ul className="ai-rationale-list">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <li key={`${exercise.exerciseId}-${exerciseIndex}`}>
                    <span className="ai-rationale-exercise">{exercise.exercise?.name ?? AI_DRAFT_COPY.missingExercise}</span>
                    {' — '}
                    <span dir="auto">{exercise.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {data?.input && (
            <details className="ai-rationale-input">
              <summary className="ai-rationale-heading">{AI_DRAFT_COPY.inputTitle}</summary>
              <p className="ai-rationale-muted">{AI_DRAFT_COPY.inputNoIdentity}</p>
              <dl className="ai-rationale-facts">
                {profileRows(data.input.profile).map((row) => (
                  <div key={row.label} className="ai-rationale-fact">
                    <dt>{row.label}</dt>
                    <dd dir="auto">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="ai-rationale-muted">
                {data.input.candidateCount} library exercises offered ·{' '}
                {data.input.guidanceSources.length > 0
                  ? `Guidance: ${data.input.guidanceSources.join('; ')}`
                  : data.input.guidanceNote ?? 'No guidance passages.'}
                {' · '}
                {data.input.promptVersion}
                {data.model ? ` · ${data.model}` : ''}
              </p>
            </details>
          )}
        </div>
      )}
    </details>
  );
}
