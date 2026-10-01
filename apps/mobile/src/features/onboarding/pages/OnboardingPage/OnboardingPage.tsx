import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../../components/common/Button/Button';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { OnboardingProgress } from '../../components/OnboardingProgress/OnboardingProgress';
import { StepVideoBackground } from '../../components/StepVideoBackground/StepVideoBackground';
import { WelcomeStep } from '../../steps/WelcomeStep/WelcomeStep';
import { BasicProfileStep } from '../../steps/BasicProfileStep/BasicProfileStep';
import { GoalsStep } from '../../steps/GoalsStep/GoalsStep';
import { FrequencyStep } from '../../steps/FrequencyStep/FrequencyStep';
import { ActivitiesStep } from '../../steps/ActivitiesStep/ActivitiesStep';
import { ExercisePreferencesStep } from '../../steps/ExercisePreferencesStep/ExercisePreferencesStep';
import { RecoveryStep } from '../../steps/RecoveryStep/RecoveryStep';
import { EquipmentStep } from '../../steps/EquipmentStep/EquipmentStep';
import { ReviewStep } from '../../steps/ReviewStep/ReviewStep';
import { INITIAL_ONBOARDING_STATE } from '../../types';
import type { OnboardingFormState, OnboardingMedia } from '../../types';
import type { MyOnboarding } from '@sistem/types';
import {
  completeOnboarding,
  getMyOnboarding,
  saveOnboardingStep,
} from '../../../../services/onboarding/onboardingService';
import { useAuth } from '../../../../services/auth/AuthContext';
import { ROUTES } from '../../../../app/config/routes';
import { landingPath } from '../../../../app/router/landingPath';
import { STEP_VIDEO_MAP } from '../../data/stepVideoMap';
import type { OnboardingStepId } from '../../data/stepVideoMap';
import { ACTIVITY_VIDEO_MAP } from '../../data/activityVideoMap';
import { usePageEnter } from '../../../../hooks/usePageEnter';
import { useKeyboardInset } from '../../../../hooks/useKeyboardInset';
import './OnboardingPage.css';

const STEP_COUNT = 9;
const EXERCISE_PREFERENCES_STEP_INDEX = 5;
const ACTIVITIES_STEP_INDEX = 4;

// Each step is its own browser-history entry, so the system back gesture / Android
// back button goes to the previous step instead of leaving onboarding.
// `resumed` marks the entry created when resuming mid-way: there is no earlier
// step entry to pop, so Back replaces it with the previous step instead.
interface OnboardingHistoryState {
  onboardingStep?: number;
  resumed?: boolean;
}

const STEP_IDS: OnboardingStepId[] = [
  'welcome',
  'basic_profile',
  'goals',
  'frequency',
  'activities',
  'exercise_preferences',
  'recovery',
  'equipment',
  'review',
];

function isStepValid(index: number, state: OnboardingFormState): boolean {
  switch (index) {
    case 1:
      return (
        state.name.trim().length > 0 &&
        state.birthDate !== '' &&
        state.height !== '' &&
        state.weight !== ''
      );
    case 2:
      return state.goals.length > 0;
    case 4:
      return state.preferredActivities.length > 0;
    case 7:
      return state.equipment.length > 0;
    default:
      return true;
  }
}

// 'welcome' and 'review' are bookend screens with no data of their own — not
// valid targets for the Profile page's "edit just this step" deep link.
const NON_EDITABLE_STEP_IDS = new Set<OnboardingStepId>(['welcome', 'review']);

function isEditableStepId(value: string | undefined): value is OnboardingStepId {
  return (
    value !== undefined &&
    (STEP_IDS as string[]).includes(value) &&
    !NON_EDITABLE_STEP_IDS.has(value as OnboardingStepId)
  );
}

// Saved answers can be incomplete (e.g. an older save, or a step that was skipped),
// so never show a step past the first one that still needs an answer.
function clampToFirstInvalidStep(requestedIndex: number, state: OnboardingFormState): number {
  for (let index = 0; index < requestedIndex; index += 1) {
    if (!isStepValid(index, state)) return index;
  }
  return requestedIndex;
}

interface OnboardingScreenProps {
  media: OnboardingMedia | undefined;
  header?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

// Full-screen phone layout: progress on top, the step scrolls in the middle, and the
// actions stay in a sticky bottom bar above the keyboard.
function OnboardingScreen({ media, header, footer, children }: OnboardingScreenProps) {
  const screenRef = usePageEnter<HTMLDivElement>();
  useKeyboardInset();

  return (
    <div
      ref={screenRef}
      className={'onboarding-screen' + (media ? ' onboarding-screen-has-video' : '')}
    >
      <StepVideoBackground media={media} />
      {header && <header className="onboarding-header">{header}</header>}
      <main className="onboarding-body">{children}</main>
      <footer className="onboarding-footer">{footer}</footer>
    </div>
  );
}

/** Builds formState from the answers saved on the server, so resuming onboarding
 * and editing one step both start from real answers. */
function mapOnboardingToFormState(onboarding: MyOnboarding, fallbackName: string): OnboardingFormState {
  const p = onboarding.answers;
  return {
    name: onboarding.name || fallbackName,
    birthDate: p?.birthDate ? p.birthDate.slice(0, 10) : '',
    height: p?.height !== undefined ? String(p.height) : '',
    weight: p?.weight !== undefined ? String(p.weight) : '',
    gender: p?.gender ?? '',
    units: {
      weight: onboarding.units?.weight ?? INITIAL_ONBOARDING_STATE.units.weight,
      distance: onboarding.units?.distance ?? INITIAL_ONBOARDING_STATE.units.distance,
    },
    goals: p?.goals ?? [],
    trainingFrequency: p?.trainingFrequency ?? INITIAL_ONBOARDING_STATE.trainingFrequency,
    preferredActivities: p?.preferredActivities ?? [],
    exercisePreferences: {
      favoriteExerciseNotes: p?.exercisePreferences?.favoriteExerciseNotes ?? '',
      improvementExerciseNotes: p?.exercisePreferences?.improvementExerciseNotes ?? '',
      muscleFocus: p?.exercisePreferences?.muscleFocus ?? [],
    },
    equipment: p?.equipment ?? [],
    recovery: {
      flags: p?.recovery?.flags ?? [],
      notes: p?.recovery?.notes ?? '',
    },
  };
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const params = useParams<{ step?: string }>();
  const editStepId = isEditableStepId(params.step) ? params.step : undefined;
  const isEditMode = params.step !== undefined;
  const isValidEditStep = editStepId !== undefined;

  const historyState = location.state as OnboardingHistoryState | null;
  const historyStep = historyState?.onboardingStep ?? 0;
  const [formState, setFormState] = useState<OnboardingFormState>(() => ({
    ...INITIAL_ONBOARDING_STATE,
    name: user?.name ?? '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [previewActivityId, setPreviewActivityId] = useState<string | null>(null);
  // Both modes start from the answers saved on the server.
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(true);
  const [answersLoadError, setAnswersLoadError] = useState<string>();
  const [loadAttempt, setLoadAttempt] = useState(0);

  const stepIndex = editStepId
    ? STEP_IDS.indexOf(editStepId)
    : clampToFirstInvalidStep(Math.min(historyStep, STEP_COUNT - 1), formState);

  // Answers are saved after every step, so a fresh mount (a reload, another device)
  // restores them and resumes after the last saved step. Edit mode only needs the
  // answers. Re-runs when the user retries a failed load.
  useEffect(() => {
    if (isEditMode && !isValidEditStep) return;
    let cancelled = false;
    setIsLoadingAnswers(true);
    setAnswersLoadError(undefined);

    getMyOnboarding()
      .then((onboarding) => {
        if (cancelled) return;
        setFormState(mapOnboardingToFormState(onboarding, user?.name ?? ''));
        if (!isEditMode) {
          const resumeStep = onboarding.lastStep
            ? Math.min(STEP_IDS.indexOf(onboarding.lastStep) + 1, STEP_COUNT - 1)
            : 0;
          const state: OnboardingHistoryState = { onboardingStep: resumeStep, resumed: resumeStep > 0 };
          navigate(location.pathname, { replace: true, state });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAnswersLoadError(error instanceof Error ? error.message : "Couldn't load your answers.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAnswers(false);
      });

    return () => {
      cancelled = true;
    };
    // Mount, a different edit step, or a retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStepId, loadAttempt]);

  // A new step starts at the top of the screen.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stepIndex]);

  // Invalid/unknown :step (or 'welcome'/'review', which aren't data steps) —
  // bounce back to Profile rather than rendering a broken edit screen.
  useEffect(() => {
    if (isEditMode && !isValidEditStep) {
      navigate(ROUTES.PROFILE, { replace: true });
    }
  }, [isEditMode, isValidEditStep, navigate]);

  const currentStepId = STEP_IDS[stepIndex];
  const activityMedia =
    stepIndex === ACTIVITIES_STEP_INDEX && previewActivityId
      ? ACTIVITY_VIDEO_MAP[previewActivityId]
      : undefined;
  const media = activityMedia ?? STEP_VIDEO_MAP[currentStepId];

  function updateFormState(patch: Partial<OnboardingFormState>) {
    setFormState((prev) => ({ ...prev, ...patch }));
  }

  async function handleContinue() {
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      if (stepIndex === STEP_COUNT - 1) {
        const { user: savedUser } = await completeOnboarding(formState);
        updateUser(savedUser);
        // The server decides where a finished onboarding lands (the waiting screen).
        navigate(landingPath(savedUser.appState), { replace: true });
        return;
      }

      // Saved before moving on, so onboarding resumes here on any device.
      const { user: savedUser } = await saveOnboardingStep(currentStepId, formState);
      updateUser(savedUser);
      goToStep(stepIndex + 1);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save your answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToStep(index: number) {
    const state: OnboardingHistoryState = { onboardingStep: index };
    navigate(location.pathname, { state });
  }

  // Same as the system back gesture: pop this step's history entry. A resumed step
  // has no earlier entry, so it is swapped for the previous step in place.
  function handleBack() {
    setSubmitError(undefined);
    if (historyState?.resumed) {
      const state: OnboardingHistoryState = { onboardingStep: stepIndex - 1, resumed: stepIndex - 1 > 0 };
      navigate(location.pathname, { replace: true, state });
      return;
    }
    navigate(-1);
  }

  // Skipping still saves the step (with whatever is filled in), so resume moves past it.
  function handleSkip() {
    void handleContinue();
  }

  function handleCancelEdit() {
    navigate(ROUTES.PROFILE);
  }

  async function handleSaveEdit() {
    if (!editStepId) return;
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      const { user: savedUser } = await saveOnboardingStep(editStepId, formState);
      updateUser(savedUser);
      navigate(ROUTES.PROFILE);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const steps = [
    <WelcomeStep key="welcome" />,
    <BasicProfileStep key="basic" formState={formState} updateFormState={updateFormState} />,
    <GoalsStep key="goals" formState={formState} updateFormState={updateFormState} />,
    <FrequencyStep key="frequency" formState={formState} updateFormState={updateFormState} />,
    <ActivitiesStep
      key="activities"
      formState={formState}
      updateFormState={updateFormState}
      onPreviewActivity={setPreviewActivityId}
    />,
    <ExercisePreferencesStep
      key="exercise-preferences"
      formState={formState}
      updateFormState={updateFormState}
    />,
    <RecoveryStep key="recovery" formState={formState} updateFormState={updateFormState} />,
    <EquipmentStep key="equipment" formState={formState} updateFormState={updateFormState} />,
    <ReviewStep key="review" />,
  ];

  if (isEditMode && !isValidEditStep) {
    // Redirecting via the effect above — render nothing in the meantime.
    return null;
  }

  if (isLoadingAnswers) {
    return (
      <div className="onboarding-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isEditMode) {
    return (
      <OnboardingScreen
        media={media}
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelEdit} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="onboarding-footer-primary"
              onClick={handleSaveEdit}
              loading={isSubmitting}
              disabled={Boolean(answersLoadError) || !isStepValid(stepIndex, formState)}
            >
              Save changes
            </Button>
          </>
        }
      >
        {answersLoadError ? <p className="onboarding-error">{answersLoadError}</p> : steps[stepIndex]}

        {submitError && <p className="onboarding-error">{submitError}</p>}
      </OnboardingScreen>
    );
  }

  if (answersLoadError) {
    return (
      <OnboardingScreen
        media={undefined}
        footer={
          <Button
            variant="primary"
            className="onboarding-footer-primary"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Try again
          </Button>
        }
      >
        <p className="onboarding-error">{answersLoadError}</p>
      </OnboardingScreen>
    );
  }

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEP_COUNT - 1;
  const showSkip = stepIndex === EXERCISE_PREFERENCES_STEP_INDEX;
  const continueLabel = isFirstStep ? 'Start' : isLastStep ? 'Create my profile' : 'Continue';

  return (
    <OnboardingScreen
      media={media}
      header={<OnboardingProgress currentStep={stepIndex + 1} totalSteps={STEP_COUNT} />}
      footer={
        <>
          {!isFirstStep && (
            <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          {showSkip && (
            <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
              Skip for now
            </Button>
          )}
          <Button
            variant="primary"
            className="onboarding-footer-primary"
            onClick={handleContinue}
            loading={isSubmitting}
            disabled={!isStepValid(stepIndex, formState)}
          >
            {continueLabel}
          </Button>
        </>
      }
    >
      {/* Keyed by step so each step gets the light enter transition. */}
      <div key={stepIndex} className="onboarding-step-enter">
        {steps[stepIndex]}
      </div>

      {submitError && <p className="onboarding-error">{submitError}</p>}
    </OnboardingScreen>
  );
}
