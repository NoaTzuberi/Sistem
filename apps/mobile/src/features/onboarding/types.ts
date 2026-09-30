export interface OnboardingFormState {
  name: string;
  birthDate: string;
  height: string;
  weight: string;
  gender: string;
  units: {
    weight: 'kg' | 'lb';
    distance: 'km' | 'miles';
  };
  goals: string[];
  trainingFrequency: {
    minDays: number;
    maxDays: number;
    flexibleSchedule: boolean;
  };
  preferredActivities: string[];
  exercisePreferences: {
    favoriteExerciseNotes: string;
    improvementExerciseNotes: string;
    muscleFocus: string[];
  };
  equipment: string[];
  recovery: {
    flags: string[];
    notes: string;
  };
}

export const INITIAL_ONBOARDING_STATE: OnboardingFormState = {
  name: '',
  birthDate: '',
  height: '',
  weight: '',
  gender: '',
  units: {
    weight: 'kg',
    distance: 'km',
  },
  goals: [],
  trainingFrequency: {
    minDays: 1,
    maxDays: 3,
    flexibleSchedule: false,
  },
  preferredActivities: [],
  exercisePreferences: {
    favoriteExerciseNotes: '',
    improvementExerciseNotes: '',
    muscleFocus: [],
  },
  equipment: [],
  recovery: {
    flags: [],
    notes: '',
  },
};
