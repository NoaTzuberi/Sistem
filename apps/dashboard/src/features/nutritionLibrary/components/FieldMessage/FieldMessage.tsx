import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import type { FieldError } from '../../data/settingsForm';
import { nutritionLibraryCopy } from '../../copy';
import './FieldMessage.css';

/** A marked settings field's line: out of range, not whole, empty, or a split that doesn't add up. */
export function FieldMessage({ id, error }: { id: string; error: FieldError | undefined }) {
  const language = useLanguage();
  const copy = useCopy(nutritionLibraryCopy);
  if (!error) return null;
  const number = (value: number) => formatNumber(value, language);
  let text: string;
  if (error.kind === 'required') text = copy.errorRequired;
  else if (error.kind === 'splitSum') text = fill(copy.errorSplitSum, { sum: number(error.sum) });
  else text = fill(error.kind === 'whole' ? copy.errorWhole : copy.errorRange, { min: number(error.min), max: number(error.max) });
  return (
    <p className="field-message" id={id}>
      <bdi>{text}</bdi>
    </p>
  );
}
