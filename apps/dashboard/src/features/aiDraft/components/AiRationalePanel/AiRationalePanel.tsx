import { useCallback } from 'react';
import type { AiTraineeProfile, AiTrainingRecommendation, Language } from '@sistem/types';
import {
  dayName,
  describeSplit,
  fill,
  humanizeId,
  isolateLtr,
  labelList,
  sharedCopy,
  slotLabel,
  useCopy,
  useLanguage,
  useLoad,
  workoutTypeLabel,
} from '@sistem/shared';
import { getAiRecommendation } from '../../../../services/coach/coachService';
import { Tag } from '../../../../components/common/Tag/Tag';
import { aiDraftCopy } from '../../copy';
import './AiRationalePanel.css';

interface AiRationalePanelProps {
  traineeId: string;
  recommendationId: string;
  /** Already loaded (the latest draft) — saves a request. */
  recommendation?: AiTrainingRecommendation | null;
  /** Starts closed (inside the AI draft sheet, under the split options). */
  startClosed?: boolean;
}

// Her answers are option ids: the coach reads the questionnaire's own labels (shared copy).
function profileRows(profile: AiTraineeProfile, copy: AiDraftText, language: Language): { label: string; value: string }[] {
  const labels = copy.profile;
  const options = sharedCopy[language].onboardingOptions;
  const days = profile.trainingDays;
  const rows = [
    { label: labels.age, value: profile.ageYears !== undefined ? String(profile.ageYears) : '—' },
    { label: labels.heightWeight, value: fill(labels.heightWeightValue, { height: profile.heightCm ?? '—', weight: profile.weightKg ?? '—' }) },
    { label: labels.gender, value: profile.gender ? ((options.gender as Record<string, string>)[profile.gender] ?? humanizeId(profile.gender)) : '—' },
    { label: labels.goals, value: labelList(profile.goals, options.goals, language) },
    { label: labels.daysPerWeek, value: days ? `${isolateLtr(`${days.min}–${days.max}`)}${days.flexible ? labels.flexible : ''}` : '—' },
    { label: labels.muscleFocus, value: labelList(profile.muscleFocus, options.muscleFocus, language) },
    { label: labels.equipment, value: labelList(profile.equipment, options.equipment, language) },
    { label: labels.activities, value: labelList(profile.preferredActivities, options.activities, language) },
    { label: labels.recoveryFlags, value: labelList(profile.recoveryFlags, options.recoveryFlags, language) },
    { label: labels.experience, value: profile.experience ? options.trainingExperience[profile.experience] : '—' },
    { label: labels.favoriteExercises, value: profile.notes.favoriteExercises ?? '—' },
    { label: labels.wantsToImprove, value: profile.notes.exercisesToImprove ?? '—' },
    { label: labels.recoveryNotes, value: profile.notes.recovery ?? '—' },
  ];
  return rows;
}

type AiDraftText = (typeof aiDraftCopy)['he'];

/** Plan builder: why the AI drafted this plan, and what it was given. Coach-only. */
export function AiRationalePanel({ traineeId, recommendationId, recommendation, startClosed = false }: AiRationalePanelProps) {
  const language = useLanguage();
  const copy = useCopy(aiDraftCopy);
  const known = recommendation?.id === recommendationId ? recommendation : null;
  const load = useCallback(
    () => (known ? Promise.resolve(known) : getAiRecommendation(traineeId, recommendationId)),
    [known, traineeId, recommendationId],
  );
  const { data: loaded, error } = useLoad(load, copy.training.loadError);
  // A plan only links training drafts; anything else reads as "couldn't load".
  const data = loaded?.type === 'training_plan' ? loaded : loaded ? { ...loaded, input: null, output: null } : undefined;
  const output = data?.output;

  return (
    <details className="ai-rationale" open={!startClosed}>
      <summary className="ai-rationale-summary">
        <span className="ai-rationale-title">{copy.training.rationaleTitle}</span>
        <Tag tone="accent">{copy.training.reviewBadge}</Tag>
      </summary>

      {error && <p className="ai-rationale-muted">{error}</p>}
      {data && !output && <p className="ai-rationale-muted">{copy.training.loadError}</p>}

      {output && (
        <div className="ai-rationale-body">
          <p className="ai-rationale-text" dir="auto">
            {output.summary}
          </p>

          <h3 className="ai-rationale-heading">{copy.training.split}</h3>
          {/* Phase 12b drafts: the split option the workouts follow; Phase 12: the split in words. */}
          {output.splitOptions?.[0] ? (
            <p className="ai-rationale-text">
              {describeSplit(output.splitOptions[0].splitId, output.splitOptions[0].daysPerWeek, language)} —{' '}
              <span dir="auto">{output.splitOptions[0].why}</span>
            </p>
          ) : (
            <p className="ai-rationale-text" dir="auto">
              {output.split}
            </p>
          )}
          {output.experienceRead && (
            <p className="ai-rationale-text" dir="auto">
              {output.experienceRead}
            </p>
          )}

          {output.considerations.length > 0 && (
            <>
              <h3 className="ai-rationale-heading">{copy.training.considerations}</h3>
              <ul className="ai-rationale-list">
                {output.considerations.map((item) => (
                  <li key={item} dir="auto">
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="ai-rationale-heading">{copy.training.workouts}</h3>
          {output.workouts.map((workout, index) => (
            <div key={`${workout.title}-${index}`} className="ai-rationale-workout">
              <p className="ai-rationale-workout-title">
                <bdi>{workout.title}</bdi>
                {workout.workoutType ? ` · ${workoutTypeLabel(workout.workoutType, language)}` : ''}
                {workout.dayOfWeek !== undefined ? ` · ${dayName(workout.dayOfWeek, language)}` : ''}
              </p>
              <p className="ai-rationale-muted" dir="auto">
                {workout.focus}
              </p>
              <ul className="ai-rationale-list">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <li key={`${exercise.exerciseId}-${exerciseIndex}`}>
                    {exercise.slotId && <span className="ai-rationale-muted">{slotLabel({ id: exercise.slotId }, language)}: </span>}
                    <span className="ai-rationale-exercise" dir="auto">{exercise.exercise?.name ?? copy.training.missingExercise}</span>
                    {' — '}
                    <span dir="auto">{exercise.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {data?.input && (
            <details className="ai-rationale-input">
              <summary className="ai-rationale-heading">{copy.training.inputTitle}</summary>
              <p className="ai-rationale-muted">{copy.training.inputNoIdentity}</p>
              <dl className="ai-rationale-facts">
                {profileRows(data.input.profile, copy, language).map((row) => (
                  <div key={row.label} className="ai-rationale-fact">
                    <dt>{row.label}</dt>
                    <dd dir="auto">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="ai-rationale-muted">
                {fill(copy.training.candidates, { count: data.input.candidateCount })} ·{' '}
                {data.input.guidanceSources.length > 0
                  ? fill(copy.training.guidance, { sources: data.input.guidanceSources.join('; ') })
                  : data.input.guidanceNote ?? copy.training.noGuidance}
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
