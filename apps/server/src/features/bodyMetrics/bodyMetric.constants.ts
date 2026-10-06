// Body measurements are circumferences in cm. The list is data, not schema: adding an
// id here is enough to accept, store and show a new measurement (the clients read the
// list from GET /body-metrics). Order = display order.
export const BODY_MEASUREMENT_IDS = ['chest', 'waist', 'hips', 'arms', 'thighs'] as const;

// Also the display order of a day's photos.
export const PROGRESS_PHOTO_POSE_IDS = ['front', 'side', 'back'] as const;

// Sanity limits, in kg and cm (the clients convert lb / in before sending).
export const MIN_BODY_WEIGHT_KG = 20;
export const MAX_BODY_WEIGHT_KG = 400;
export const MIN_MEASUREMENT_CM = 10;
export const MAX_MEASUREMENT_CM = 300;

// No entry can be dated before this (or after today in her time zone).
export const MIN_BODY_METRIC_DATE = '2000-01-01';
