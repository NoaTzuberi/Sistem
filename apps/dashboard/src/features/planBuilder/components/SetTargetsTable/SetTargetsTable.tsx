import type { SetType } from '@sistem/types';
import { Button } from '../../../../components/common/Button/Button';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { SET_TYPE_OPTIONS } from '../../data/planDefaults';
import { newKey, newSetTarget } from '../../planDraft';
import type { DraftSetTarget } from '../../types';
import './SetTargetsTable.css';

interface SetTargetsTableProps {
  targets: DraftSetTarget[];
  onChange: (targets: DraftSetTarget[]) => void;
}

/** One row per set: pyramids (edit each row), warm-up sets and drop sets. */
export function SetTargetsTable({ targets, onChange }: SetTargetsTableProps) {
  function update(key: string, changes: Partial<DraftSetTarget>) {
    onChange(targets.map((target) => (target.key === key ? { ...target, ...changes } : target)));
  }

  function duplicate(index: number) {
    onChange([...targets.slice(0, index + 1), { ...targets[index], key: newKey() }, ...targets.slice(index + 1)]);
  }

  const first = targets[0];
  const last = targets[targets.length - 1];

  return (
    <div className="set-targets">
      <table className="set-targets-table">
        <thead>
          <tr>
            <th scope="col">Set</th>
            <th scope="col">Type</th>
            <th scope="col">Reps</th>
            <th scope="col">to</th>
            <th scope="col">Seconds</th>
            <th scope="col">Kg</th>
            <th scope="col">Rest (sec)</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {targets.map((target, index) => {
            const setLabel = `Set ${index + 1}`;
            return (
              <tr key={target.key}>
                <td className="set-targets-number">{index + 1}</td>
                <td>
                  <select
                    className="set-targets-type"
                    aria-label={`${setLabel} type`}
                    value={target.type}
                    onChange={(event) => update(target.key, { type: event.target.value as SetType })}
                  >
                    {SET_TYPE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberField hideLabel label={`${setLabel} reps`} min={1} value={target.reps} onChange={(reps) => update(target.key, { reps })} />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={`${setLabel} max reps`}
                    min={1}
                    value={target.repsMax}
                    onChange={(repsMax) => update(target.key, { repsMax })}
                  />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={`${setLabel} seconds`}
                    min={1}
                    value={target.durationSec}
                    onChange={(durationSec) => update(target.key, { durationSec })}
                  />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={`${setLabel} weight in kg`}
                    step={0.5}
                    value={target.targetWeight}
                    onChange={(targetWeight) => update(target.key, { targetWeight })}
                  />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={`${setLabel} rest in seconds`}
                    value={target.restSec}
                    onChange={(restSec) => update(target.key, { restSec })}
                  />
                </td>
                <td className="set-targets-actions">
                  <Button size="sm" aria-label={`Duplicate ${setLabel}`} onClick={() => duplicate(index)}>
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    aria-label={`Remove ${setLabel}`}
                    disabled={targets.length === 1}
                    onClick={() => onChange(targets.filter((other) => other.key !== target.key))}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="set-targets-add">
        <Button size="sm" onClick={() => onChange([...targets, newSetTarget('working', last)])}>
          + Set
        </Button>
        <Button size="sm" onClick={() => onChange([newSetTarget('warmup', first), ...targets])}>
          + Warm-up set
        </Button>
        <Button size="sm" onClick={() => onChange([...targets, newSetTarget('drop', last)])}>
          + Drop set
        </Button>
      </div>
    </div>
  );
}
