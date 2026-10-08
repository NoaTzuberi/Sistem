// Profile + Settings wording (Phase 10) — placeholders until the owner sends the real copy.

export const PROFILE_COPY = {
  bodyTitle: 'Body',
  weightCard: 'Weight',
  measurementsCard: 'Measurements',
  photosCard: 'Progress photos',
  noEntries: 'Nothing logged yet',
  lastLogged: (date: string) => `Last: ${date}`,
  moreMeasurements: (count: number) => `+${count} more`,
  settings: 'Settings',
  // Phase 13a — placeholder.
  nutritionPreferencesTitle: 'Nutrition & goal',
  weightGoalLabel: 'My goal',

  settingsTitle: 'Settings',
  unitsTitle: 'Units',
  unitsHint: 'For your body weight and measurements. Workouts stay in kg for now.',
  weightUnit: 'Weight',
  lengthUnit: 'Measurements',
  unitsSaveError: "Couldn't change your units. Try again.",
  timezone: 'Time zone',
  account: 'Account',
} as const;
