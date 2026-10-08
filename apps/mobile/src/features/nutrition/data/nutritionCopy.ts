// Wording of the Nutrition tab (trainee) and its read-only view in coach mode. PLACEHOLDER
// copy — the owner sends the final text (Phase 15 moves it into the translation files).
// Meal names, options, food names and tips are the coach's own text, shown as written.
export const NUTRITION_COPY = {
  tabLabel: 'Nutrition',
  title: 'Nutrition',
  loading: 'Loading your nutrition plan…',
  loadError: "Couldn't load your nutrition plan.",
  empty: 'No nutrition plan yet. Your coach will add it here.',
  updated: 'Updated',
  tipsTitle: "Coach's tips",
  swapsTitle: (group: string) => `${group} swaps`,
  swapsIntro: 'Any item here is one portion — swap freely within the group.',
  swapsEmpty: 'Nothing to swap yet.',
  swapsCurrent: 'In your plan',
  newTag: 'New',
  grams: (grams: number) => `${grams} g`,
  openSwaps: (label: string) => `${label}: see swaps`,
  tabUpdated: 'New update',
  // Coach mode (read-only).
  coachEmpty: 'No published nutrition plan yet.',
  coachUnpublished: 'There are changes on the dashboard that are not published yet.',
  coachEditHint: 'Build and edit nutrition plans on the dashboard.',
} as const;
