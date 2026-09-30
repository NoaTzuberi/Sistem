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
import type { OnboardingFormState } from '../../types';
import { saveOnboardingProfile } from '../../../../services/onboarding/onboardingService';
import { getMyProfile } from '../../../../services/users/usersService';
import type { MyProfileResponse } from '../../../../services/users/usersService';
import { useAuth } from '../../../../services/auth/AuthContext';
import { ROUTES } from '../../../../app/config/routes';
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
interface OnboardingHistoryState {
  onboardingStep?: number;
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

// Answers live in memory until they are submitted, so history can point at a step
// whose earlier required answers are gone (e.g. after a reload). Never show a step
// past the first one that still needs an answer.
function clampToFirstInvalidStep(requestedIndex: number, state: OnboardingFormState): number {
  for (let index = 0; index < requestedIndex; index += 1) {
    if (!isStepValid(index, state)) return index;
  }
  return requestedIndex;
}

interface OnboardingScreenProps {
  videoSrc: string | undefined;
  header?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

// Full-screen phone layout: progress on top, the step scrolls in the middle, and the
// actions stay in a sticky bottom bar above the keyboard.
function OnboardingScreen({ videoSrc, header, footer, children }: OnboardingScreenProps) {
  const screenRef = usePageEnter<HTMLDivElement>();
  useKeyboardInset();

  return (
    <div
      ref={screenRef}
      className={'onboarding-screen' + (videoSrc ? ' onboarding-screen-has-video' : '')}
    >
      <StepVideoBackground videoSrc={videoSrc} />
      {header && <header className="onboarding-header">{header}</header>}
      <main className="onboarding-body">{children}</main>
      <footer className="onboarding-footer">{footer}</footer>
    </div>
  );
}

/** Builds edit-mode's starting formState from the user's already-saved profile
 * (fetched via getMyProfile) — same shape saveOnboardingProfile's payload
 * expects, so fields the user isn't editing round-trip unchanged on save. */
function mapProfileToFormState(profile: MyProfileResponse, fallbackName: string): OnboardingFormState {
  const p = profile.profile;
  return {
    name: profile.name || fallbackName,
    birthDate: p?.birthDate ? p.birthDate.slice(0, 10) : '',
    height: p?.height !== undefined ? String(p.height) : '',
    weight: p?.weight !== undefined ? String(p.weight) : '',
    gender: p?.gender ?? '',
    units: {
      weight: profile.preferences?.units?.weight ?? INITIAL_ONBOARDING_STATE.units.weight,
      distance: profile.preferences?.units?.distance ?? INITIAL_ONBOARDING_STATE.units.distance,
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

  const historyStep = (location.state as OnboardingHistoryState | null)?.onboardingStep ?? 0;
  const [formState, setFormState] = useState<OnboardingFormState>(() => ({
    ...INITIAL_ONBOARDING_STATE,
    name: user?.name ?? '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [previewActivityId, setPreviewActivityId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditMode);
  const [profileLoadError, setProfileLoadError] = useState<string>();

  const stepIndex = editStepId
    ? STEP_IDS.indexOf(editStepId)
    : clampToFirstInvalidStep(Math.min(historyStep, STEP_COUNT - 1), formState);

  // A fresh mount (e.g. a reload) starts over at the first step: answers are not
  // restored yet (per-step server saves arrive in Phase 3/4).
  useEffect(() => {
    if (!isEditMode && historyStep !== 0) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Edit mode starts from the user's real saved profile, not blank defaults,
  // so untouched fields round-trip unchanged when saveOnboardingProfile
  // PUTs the whole payload back.
  useEffect(() => {
    if (!editStepId) return;
    let cancelled = false;

    getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setFormState(mapProfileToFormState(profile, user?.name ?? ''));
      })
      .catch((error) => {
        if (!cancelled) {
          setProfileLoadError(error instanceof Error ? error.message : "Couldn't load your profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
    // Only re-run if the target step itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStepId]);

  const currentStepId = STEP_IDS[stepIndex];
  const activityVideo =
    stepIndex === ACTIVITIES_STEP_INDEX && previewActivityId
      ? ACTIVITY_VIDEO_MAP[previewActivityId]
      : undefined;
  const videoSrc = activityVideo ?? STEP_VIDEO_MAP[currentStepId];

  function updateFormState(patch: Partial<OnboardingFormState>) {
    setFormState((prev) => ({ ...prev, ...patch }));
  }

  async function handleContinue() {
    if (stepIndex === STEP_COUNT - 1) {
      setSubmitError(undefined);
      setIsSubmitting(true);
      try {
        const { user: savedUser } = await saveOnboardingProfile(formState);
        updateUser({
          name: savedUser.name,
          onboardingCompleted: savedUser.onboardingCompleted,
          appState: savedUser.appState,
        });
        navigate(ROUTES.DASHBOARD);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Could not save your profile. Please try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    goToStep(stepIndex + 1);
  }

  function goToStep(index: number) {
    const state: OnboardingHistoryState = { onboardingStep: index };
    navigate(location.pathname, { state });
  }

  // Same as the system back gesture: pop this step's history entry.
  function handleBack() {
    navigate(-1);
  }

  function handleSkip() {
    goToStep(stepIndex + 1);
  }

  function handleCancelEdit() {
    navigate(ROUTES.PROFILE);
  }

  async function handleSaveEdit() {
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      const { user: savedUser } = await saveOnboardingProfile(formState);
      updateUser({
        name: savedUser.name,
        onboardingCompleted: savedUser.onboardingCompleted,
        appState: savedUser.appState,
      });
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

  if (isEditMode) {
    if (!isValidEditStep) {
      // Redirecting via the effect above — render nothing in the meantime.
      return null;
    }

    if (isLoadingProfile) {
      return (
        <div className="onboarding-edit-loading">
          <Spinner size="lg" />
        </div>
      );
    }

    return (
      <OnboardingScreen
        videoSrc={videoSrc}
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
              disabled={Boolean(profileLoadError) || !isStepValid(stepIndex, formState)}
            >
              Save changes
            </Button>
          </>
        }
      >
        {profileLoadError ? <p className="onboarding-error">{profileLoadError}</p> : steps[stepIndex]}

        {submitError && <p className="onboarding-error">{submitError}</p>}
      </OnboardingScreen>
    );
  }

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEP_COUNT - 1;
  const showSkip = stepIndex === EXERCISE_PREFERENCES_STEP_INDEX;
  const continueLabel = isFirstStep ? 'Start' : isLastStep ? 'Create my profile' : 'Continue';

  return (
    <OnboardingScreen
      videoSrc={videoSrc}
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
