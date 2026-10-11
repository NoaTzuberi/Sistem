// Display-name cleanup for imported exercises (Phase 12b, step 0a). The Kaggle titles carry
// a program prefix from their source collection ("30 Arms Hammer Curl", "30 Day Back Barbell
// Rack Pull"). Only the name changes: the slug stays derived from the original title (and
// source.originalTitle keeps it), so ids, plans, logs and PRs are untouched.

/** A leading count followed by one of these is part of the real name ("6 Way Shoulder Raise"). */
const NUMBER_IS_PART_OF_NAME = /^\d+\s+(way|rep|reps|count|second|seconds|sec|minute|minutes|min|kg|lb|inch|yard|yards|meter|meters|m)\b/i;

/**
 * "30 " / "30 Day " — the dataset's program prefix ("30 Day …" program). Only 30: any other leading
 * number is part of the name ("180 Jump", "3/4 sit-up", "90-degree …", "3D …").
 */
const LEADING_PROGRAM_NUMBER = /^30\s+(?:day\s+)?/i;

/** The program's body-part bucket that follows the number ("30 Arms …", "30 back …"). */
const PROGRAM_BUCKET = /^(arms|shoulders|back|chest|legs)\s+/i;

/** A stray dash at the end of some titles ("Barbell hip thrust-"). */
const TRAILING_DASH = /\s*[-–]+\s*$/;

export function cleanExerciseName(title: string): string {
  const trimmed = title.trim().replace(TRAILING_DASH, '') || title.trim();
  if (!LEADING_PROGRAM_NUMBER.test(trimmed) || NUMBER_IS_PART_OF_NAME.test(trimmed)) return trimmed;
  const withoutNumber = trimmed.replace(LEADING_PROGRAM_NUMBER, '');
  const cleaned = withoutNumber.replace(PROGRAM_BUCKET, '').trim();
  // Never leave a name empty or a lone word that was only the bucket.
  return cleaned || withoutNumber.trim() || trimmed;
}
