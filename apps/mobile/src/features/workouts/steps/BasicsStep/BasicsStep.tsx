import type { ChangeEvent } from 'react';
import { Input } from '../../../../components/common/Input/Input';

interface BasicsStepProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
}

export function BasicsStep({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  duration,
  onDurationChange,
}: BasicsStepProps) {
  return (
    <div className="workout-builder-step-fields">
      <div className="workout-builder-row workout-builder-row-basics">
        <Input
          label="Name"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onNameChange(event.target.value)}
        />
        <Input
          label="Duration (min)"
          type="number"
          min={1}
          value={duration}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onDurationChange(event.target.value)}
        />
      </div>

      <label className="workout-builder-field-label" htmlFor="workout-description">
        Description
      </label>
      <textarea
        id="workout-description"
        className="workout-builder-textarea"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="Optional description"
        rows={2}
      />
    </div>
  );
}