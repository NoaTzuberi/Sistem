export const PLAN_STATUS_IDS = ['draft', 'published'] as const;
export const DEFAULT_PLAN_STATUS = 'draft';

export const SET_TYPE_IDS = ['warmup', 'working', 'drop'] as const;
export const DEFAULT_SET_TYPE = 'working';

// 0 = Sunday — weeks start on Sunday (owner decision).
export const MIN_DAY_OF_WEEK = 0;
export const MAX_DAY_OF_WEEK = 6;

// Superset labels are short tags like "A", "B", "C2".
export const SUPERSET_GROUP_PATTERN = /^[A-Z0-9]{1,3}$/;
