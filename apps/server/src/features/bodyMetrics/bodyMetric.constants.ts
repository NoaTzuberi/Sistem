// Body measurements are circumferences in cm. The list is data, not schema:
// adding an id here is enough to accept and store a new measurement (Phase 10).
export const BODY_MEASUREMENT_IDS = ['chest', 'waist', 'hips', 'arms', 'thighs'] as const;

export const PROGRESS_PHOTO_POSE_IDS = ['front', 'side', 'back'] as const;
