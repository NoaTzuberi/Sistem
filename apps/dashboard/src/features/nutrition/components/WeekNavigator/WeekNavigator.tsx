import { Icon } from '../../../../components/common/Icon/Icon';
import './WeekNavigator.css';

interface WeekNavigatorProps {
  /** "11–17 Oct". */
  range: string;
  previousLabel: string;
  nextLabel: string;
  /** The current week: there is no next one yet. */
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** ‹ the week's dates › — round buttons around the range. */
export function WeekNavigator({ range, previousLabel, nextLabel, nextDisabled, onPrevious, onNext }: WeekNavigatorProps) {
  return (
    <div className="nb-week-nav">
      <button className="nb-week-nav-button" type="button" aria-label={previousLabel} onClick={onPrevious}>
        <Icon name="chevron" size="sm" flip className="nb-week-nav-back" />
      </button>
      <span className="nb-week-nav-range" aria-live="polite">
        <bdi>{range}</bdi>
      </span>
      <button className="nb-week-nav-button" type="button" aria-label={nextLabel} disabled={nextDisabled} onClick={onNext}>
        <Icon name="chevron" size="sm" flip />
      </button>
    </div>
  );
}
