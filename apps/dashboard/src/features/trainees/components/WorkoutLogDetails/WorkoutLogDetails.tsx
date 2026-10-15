import type { Language, WorkoutLog, WorkoutLogSet } from '@sistem/types';
import {
  describeLogSet,
  describePersonalRecord,
  fill,
  formatDuration,
  formatNumber,
  groupLogSetsByExercise,
  isolateLtr,
  logExerciseNames,
  sharedCopy,
  useCopy,
  useLanguage,
} from '@sistem/shared';
import { traineesCopy } from '../../copy';
import './WorkoutLogDetails.css';

/** "3×10 · 40 kg": the done sets × their most common reps (or hold), and the heaviest weight. */
function summarize(sets: WorkoutLogSet[], language: Language, template: string): string {
  const units = sharedCopy[language].units;
  const done = sets.filter((set) => set.completed);
  const counted = done.length > 0 ? done : sets;
  const reps = counted.flatMap((set) => (set.reps === undefined ? [] : [set.reps]));
  const holds = counted.flatMap((set) => (set.durationSec === undefined ? [] : [set.durationSec]));
  const common = (values: number[]) => [...values].sort((a, b) => values.filter((v) => v === b).length - values.filter((v) => v === a).length)[0];
  const amount = reps.length > 0 ? String(common(reps)) : holds.length > 0 ? formatDuration(common(holds), language) : '—';
  const weights = counted.flatMap((set) => (set.weight === undefined ? [] : [set.weight]));
  const head = isolateLtr(fill(template, { sets: done.length, reps: amount }));
  return weights.length > 0 ? `${head} · ${formatNumber(Math.max(...weights), language)} ${units.kg}` : head;
}

/** An opened log: each exercise (records tinted), the workout's numbers, her note and her photo. */
export function WorkoutLogDetails({ log }: { log: WorkoutLog }) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const names = logExerciseNames(log);
  const records = new Map((log.personalRecords ?? []).map((record) => [record.exerciseId, record]));

  return (
    <div className="log-details">
      <div className="log-details-main">
        {log.stats && (
          <dl className="log-details-stats">
            <div>
              <dt>{shared.coach.duration}</dt>
              <dd>{formatDuration(log.stats.durationSec, language)}</dd>
            </div>
            <div>
              <dt>{shared.coach.totalVolume}</dt>
              <dd>
                <bdi>
                  {formatNumber(log.stats.totalVolume, language)} {shared.units.kg}
                </bdi>
              </dd>
            </div>
            <div>
              <dt>{shared.coach.setsCompleted}</dt>
              <dd>{formatNumber(log.stats.setsCompleted, language)}</dd>
            </div>
          </dl>
        )}
        <ul className="log-details-exercises">
          {groupLogSetsByExercise(log.sets).map((group, index) => {
            const record = records.get(group.exerciseId);
            const name = names.get(group.exerciseId);
            return (
              <li key={`${group.exerciseId}-${index}`} className="log-exercise" data-record={record ? '' : undefined}>
                <div className="log-exercise-top">
                  <bdi className="log-exercise-name" dir="auto">
                    {name ?? shared.log.exercise}
                  </bdi>
                  {record && <span className="log-exercise-pr">{copy.logs.prRow}</span>}
                  <span className="log-exercise-summary">{summarize(group.sets, language, copy.logs.setsReps)}</span>
                </div>
                {record && <p className="log-exercise-record">{describePersonalRecord(record, name, language)}</p>}
                <p className="log-exercise-sets">{group.sets.map((set) => describeLogSet(set, language)).join('  ·  ')}</p>
              </li>
            );
          })}
        </ul>
      </div>
      {(log.notes || log.pumpPhoto) && (
        <aside className="log-details-side">
          {log.notes && (
            <div className="log-details-note">
              <h4 className="log-details-note-title">{copy.logs.herNote}</h4>
              <p dir="auto">{log.notes}</p>
            </div>
          )}
          {log.pumpPhoto && (
            <a className="log-details-photo" href={log.pumpPhoto.url} target="_blank" rel="noreferrer">
              <img src={log.pumpPhoto.url} alt={fill(shared.coach.pumpPhotoAlt, { workout: log.workoutTitle })} loading="lazy" />
            </a>
          )}
        </aside>
      )}
    </div>
  );
}
