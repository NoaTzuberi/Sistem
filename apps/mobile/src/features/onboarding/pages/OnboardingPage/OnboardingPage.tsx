import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
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
import './OnboardingPage.css';

const STEP_COUNT = 9;
const EXERCISE_PREFERENCES_STEP_INDEX = 5;
const ACTIVITIES_STEP_INDEX = 4;

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
  const { user, updateUser } = useAuth();
  const params = useParams<{ step?: string }>();
  const editStepId = isEditableStepId(params.step) ? params.step : undefined;
  const isEditMode = params.step !== undefined;
  const isValidEditStep = editStepId !== undefined;

  const [stepIndex, setStepIndex] = useState(() => (editStepId ? STEP_IDS.indexOf(editStepId) : 0));
  const [formState, setFormState] = useState<OnboardingFormState>(() => ({
    ...INITIAL_ONBOARDING_STATE,
    name: user?.name ?? '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [previewActivityId, setPreviewActivityId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditMode);
  const [profileLoadError, setProfileLoadError] = useState<string>();

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

    setStepIndex((index) => index + 1);
  }

  function handleBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function handleSkip() {
    setStepIndex((index) => index + 1);
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
        <AppShell hideTabBar>
          <Section>
            <Container>
              <div className="onboarding-edit-loading">
                <Spinner size="lg" />
              </div>
            </Container>
          </Section>
        </AppShell>
      );
    }

    return (
      <AppShell hideTabBar>
        <Section>
          <Container>
            <GlassCard variant="flat" className="onboarding-card">
              <StepVideoBackground videoSrc={videoSrc} />
              <div className="onboarding-card-content">
                <div className="onboarding-step-scroll">
                  {profileLoadError ? (
                    <p className="onboarding-error">{profileLoadError}</p>
                  ) : (
                    steps[stepIndex]
                  )}

                  {submitError && <p className="onboarding-error">{submitError}</p>}
                </div>

                <div className="onboarding-nav">
                  <Button variant="secondary" onClick={handleCancelEdit} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <div className="onboarding-nav-spacer" />
                  <Button
                    variant="primary"
                    onClick={handleSaveEdit}
                    loading={isSubmitting}
                    disabled={Boolean(profileLoadError) || !isStepValid(stepIndex, formState)}
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </GlassCard>
          </Container>
        </Section>
      </AppShell>
    );
  }

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEP_COUNT - 1;
  const showSkip = stepIndex === EXERCISE_PREFERENCES_STEP_INDEX;
  const continueLabel = isFirstStep ? 'Start' : isLastStep ? 'Create my profile' : 'Continue';

  return (
    <AppShell hideTabBar>
      <Section>
        <Container>
          <GlassCard variant="flat" className="onboarding-card">
            <StepVideoBackground videoSrc={videoSrc} />
            <div className="onboarding-card-content">
              <OnboardingProgress currentStep={stepIndex + 1} totalSteps={STEP_COUNT} />

              <div className="onboarding-step-scroll">
                {steps[stepIndex]}

                {submitError && <p className="onboarding-error">{submitError}</p>}
              </div>

              <div className="onboarding-nav">
                {!isFirstStep && (
                  <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                    Back
                  </Button>
                )}
                <div className="onboarding-nav-spacer" />
                {showSkip && (
                  <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                    Skip for now
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  loading={isSubmitting}
                  disabled={!isStepValid(stepIndex, formState)}
                >
                  {continueLabel}
                </Button>
              </div>
            </div>
          </GlassCard>
        </Container>
      </Section>
    </AppShell>
  );
}
