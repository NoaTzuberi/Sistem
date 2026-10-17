import { fill, sharedCopy, useCopy } from '@sistem/shared';
import type { SetType } from '@sistem/types';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { Select } from '../../../../components/common/Select/Select';
import { SET_TYPE_IDS } from '../../data/planDefaults';
import { newKey, newSetTarget } from '../../planDraft';
import type { DraftSetTarget } from '../../types';
import './SetTargetsTable.css';
import { planBuilderCopy } from '../../copy';

interface SetTargetsTableProps {
  targets: DraftSetTarget[];
  onChange: (targets: DraftSetTarget[]) => void;
}

/** One row per set: pyramids (edit each row), warm-up sets and drop sets. */
export function SetTargetsTable({ targets, onChange }: SetTargetsTableProps) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
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
            <th scope="col">{copy.set}</th>
            <th scope="col">{copy.type}</th>
            <th scope="col">{copy.reps}</th>
            <th scope="col">{copy.to}</th>
            <th scope="col">{copy.seconds}</th>
            <th scope="col">{copy.kg}</th>
            <th scope="col">{copy.restSec}</th>
            <th scope="col">
              <span className="visually-hidden">{copy.actions}</span>
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
                  <Select
                    className="set-targets-type"
                    aria-label={fill(copy.setTypeAria, { set: setLabel })}
                    value={target.type}
                    onChange={(event) => update(target.key, { type: event.target.value as SetType })}
                  >
                    {SET_TYPE_IDS.map((option) => (
                      <option key={option} value={option}>
                        {shared.plan.setTypes[option]}
                      </option>
                    ))}
                  </Select>
                </td>
                <td>
                  <NumberField hideLabel label={fill(copy.setRepsAria, { set: setLabel })} min={1} value={target.reps} onChange={(reps) => update(target.key, { reps })} />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={fill(copy.setMaxRepsAria, { set: setLabel })}
                    min={1}
                    value={target.repsMax}
                    onChange={(repsMax) => update(target.key, { repsMax })}
                  />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={fill(copy.setSecondsAria, { set: setLabel })}
                    min={1}
                    value={target.durationSec}
                    onChange={(durationSec) => update(target.key, { durationSec })}
                  />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={fill(copy.setWeightAria, { set: setLabel })}
                    step={0.5}
                    value={target.targetWeight}
                    onChange={(targetWeight) => update(target.key, { targetWeight })}
                  />
                </td>
                <td>
                  <NumberField
                    hideLabel
                    label={fill(copy.setRestAria, { set: setLabel })}
                    value={target.restSec}
                    onChange={(restSec) => update(target.key, { restSec })}
                  />
                </td>
                <td className="set-targets-actions">
                  <PillButton size="sm" aria-label={fill(copy.duplicateNamed, { name: setLabel })} onClick={() => duplicate(index)}>
                    {copy.copy}
                  </PillButton>
                  <PillButton
                    size="sm"
                    variant="danger"
                    aria-label={fill(copy.removeNamed, { name: setLabel })}
                    disabled={targets.length === 1}
                    onClick={() => onChange(targets.filter((other) => other.key !== target.key))}
                  >
                    {copy.remove}
                  </PillButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="set-targets-add">
        <PillButton size="sm" onClick={() => onChange([...targets, newSetTarget('working', last)])}>
          {copy.addSet}
        </PillButton>
        <PillButton size="sm" onClick={() => onChange([newSetTarget('warmup', first), ...targets])}>
          {copy.addWarmupSet}
        </PillButton>
        <PillButton size="sm" onClick={() => onChange([...targets, newSetTarget('drop', last)])}>
          {copy.addDropSet}
        </PillButton>
      </div>
    </div>
  );
}
