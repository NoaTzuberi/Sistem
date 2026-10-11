import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fill, sharedCopy, useCopy } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { ActivityWheel } from '../../components/ActivityWheel/ActivityWheel';
import { DeckButton } from '../../components/DeckButton/DeckButton';
import { ACTIVITIES } from '../../data/activities';
import type { OnboardingFormState } from '../../types';
import './ActivitiesStep.css';

interface ActivitiesStepProps {
  formState: OnboardingFormState;
  updateFormState: (patch: Partial<OnboardingFormState>) => void;
  /** The activity at the center of the wheel: its video becomes the screen's background. */
  onPreviewActivity: (id: string) => void;
  /** The step's heading (StepHeading) and the id of its title. */
  heading: ReactNode;
  titleId: string;
  error?: string;
  /** The buttons row (DeckActions). */
  actions: ReactNode;
}

/** The activities step: the whole screen is a curved wheel of the activity list. */
export function ActivitiesStep({
  formState,
  updateFormState,
  onPreviewActivity,
  heading,
  titleId,
  error,
  actions,
}: ActivitiesStepProps) {
  const copy = useCopy(onboardingCopy);
  const labels = useCopy(sharedCopy).onboardingOptions;
  const [centerId, setCenterId] = useState<string>(ACTIVITIES[0].id);
  const selected = formState.preferredActivities;
  const center = ACTIVITIES.find((activity) => activity.id === centerId) ?? ACTIVITIES[0];
  const isCenterSelected = selected.includes(center.id);

  function toggleActivity(id: string) {
    const isSelected = selected.includes(id);
    updateFormState({
      preferredActivities: isSelected ? selected.filter((activity) => activity !== id) : [...selected, id],
    });
  }

  // Also the activity the wheel opens on (it reports only changes).
  useEffect(() => {
    onPreviewActivity(centerId);
  }, [centerId, onPreviewActivity]);

  return (
    <section className="activities-step" data-deck-out aria-labelledby={titleId}>
      <div className="activities-step-header">
        {heading}
        <p className="activities-step-category" data-deck-rise>
          {labels.activityCategories[center.category]}
        </p>
      </div>

      <ActivityWheel
        items={ACTIVITIES.map((activity) => ({
          id: activity.id,
          label: labels.activities[activity.id],
          icon: activity.emoji,
        }))}
        selectedIds={selected}
        labelledBy={titleId}
        onToggle={toggleActivity}
        onCenterChange={setCenterId}
      />

      <div className="activities-step-footer" data-deck-rise>
        {error && (
          <p className="activities-step-error" role="alert">
            {error}
          </p>
        )}
        <div className="activities-step-picked">
          {selected.length === 0 ? (
            <span className="activities-step-empty">{copy.activities.noneMarked}</span>
          ) : (
            ACTIVITIES.filter((activity) => selected.includes(activity.id)).map((activity) => (
              <span key={activity.id} className="activities-step-chip">
                {labels.activities[activity.id]}
              </span>
            ))
          )}
        </div>
        <DeckButton
          variant="toggle"
          className="activities-step-toggle"
          pressed={isCenterSelected}
          onClick={() => toggleActivity(center.id)}
        >
          {fill(isCenterSelected ? copy.activities.unmark : copy.activities.mark, {
            activity: labels.activities[center.id],
          })}
        </DeckButton>
        {actions}
      </div>
    </section>
  );
}
