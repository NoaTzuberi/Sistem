import { Link } from 'react-router-dom';
import { fill, labelList, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { traineePath } from '../../../../app/config/routes';
import { Avatar } from '../../../../components/common/Avatar/Avatar';
import { Icon } from '../../../../components/common/Icon/Icon';
import { useCoachData } from '../../../../services/coach/CoachDataContext';
import { traineesCopy } from '../../../trainees/copy';
import { describeDaysPerWeek } from '../../../trainees/data/traineeFacts';
import { usePopover } from '../../hooks/usePopover';
import { planBuilderCopy } from '../../copy';
import './TraineePicker.css';

interface TraineePickerProps {
  traineeId: string;
  traineeName: string;
}

/**
 * Whose plan this is, and the way to another trainee: the menu lists the coach's trainees and
 * opens the chosen one's Plans tab (a plan belongs to one trainee and one week, so there is no
 * "same week, other trainee" to jump to).
 */
export function TraineePicker({ traineeId, traineeName }: TraineePickerProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(planBuilderCopy);
  const trainee = useCopy(traineesCopy);
  const { trainees, weekOf } = useCoachData();
  const { isOpen, setIsOpen, containerRef, buttonRef } = usePopover<HTMLDivElement>();

  const week = weekOf(traineeId);
  const details = [
    week && week.goals.length > 0 ? labelList(week.goals, shared.onboardingOptions.goals, language) : null,
    week?.daysPerWeek ? fill(trainee.daysPerWeek, { days: describeDaysPerWeek(week.daysPerWeek) }) : null,
  ].filter(Boolean);

  return (
    <div className="trainee-picker" ref={containerRef}>
      <button
        ref={buttonRef}
        className="trainee-picker-button"
        type="button"
        aria-label={`${copy.switchTrainee}: ${traineeName}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Avatar name={traineeName} seed={traineeId} />
        <span className="trainee-picker-text">
          <bdi className="trainee-picker-name">{traineeName}</bdi>
          {details.length > 0 && <span className="trainee-picker-details">{details.join(' · ')}</span>}
        </span>
        <Icon name="chevronDown" size="sm" className="trainee-picker-chevron" />
      </button>

      {isOpen && (
        <ul className="trainee-picker-menu" aria-label={copy.switchTrainee}>
          {trainees.map((person) => (
            <li key={person.id}>
              <Link
                className="trainee-picker-item"
                to={traineePath(person.id, 'plans')}
                aria-current={person.id === traineeId ? 'true' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <Avatar name={person.name} seed={person.id} size="sm" />
                <bdi className="trainee-picker-item-name">{person.name}</bdi>
                <span className="trainee-picker-item-status">{shared.traineeStatus.labels[person.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
