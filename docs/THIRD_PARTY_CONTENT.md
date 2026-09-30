Sistem — Third-Party Content Notice

⸻

Kaggle "Gym Exercise Data" — facts only

Source: https://www.kaggle.com/datasets/niharika41298/gym-exercise-data
File: megaGymDataset.csv (columns: Title, Desc, Type, BodyPart, Equipment,
Level, Rating, RatingDesc)
Stored locally in server/data/raw/gym-exercise-data/ (gitignored, not committed).
Imported via server/src/features/exercises/scripts/importExercises.ts.

Decision (owner, 2026-09-29): treated as NOT cleared for commercial use.

Why:
- The license could not be confirmed. Search metadata reports CC0-1.0, but
  this could not be verified on the Kaggle page itself, and mirrors state no
  license.
- Provenance is unknown. The descriptions and the Rating/RatingDesc columns
  look like they were collected from an existing exercise website. A CC0
  dedication by the uploader would only cover rights the uploader actually had.

What we keep — plain facts only:
- Title     -> exercise name
- BodyPart  -> primary muscle (and derived category)
- Equipment -> equipment
- Level     -> difficulty
- Type      -> movementType (one-word factual category, e.g. "Strength";
               required by the Exercise schema)

What we drop — never imported, stored or shown:
- Desc (descriptions / instructions text)
- Rating, RatingDesc (ratings, e.g. "Average")
- Any other copied text (tips, instructions)

How it is enforced in code:
- The importer's row type (RawExerciseRow in exercise.types.ts) only declares
  the factual columns, so code cannot read Desc/Rating/RatingDesc.
- instructions.* is always empty for imported records.
- source.raw stores only the five factual fields, not the whole CSV row.
- source.license is set to "unconfirmed — facts only".
- Covered by server/src/features/exercises/__tests__/normalize.test.ts.

Until original exercise descriptions exist (Backlog: AI draft reviewed and
approved by the coach), the coach's per-exercise notes in the plan are the
instructions trainees see.

Existing databases: records imported before this change may still hold
descriptions (instructions.execution) and the full CSV row (source.raw). Per
the owner's decision the project starts on a fresh database; to clean a dev
database, drop the `exercises` collection and run `npm run import:exercises`
again from server/. (A plain re-import refreshes 'imported' records but skips
'reviewed'/'published' ones, so dropping the collection is the reliable way.)

⸻

RepDB — removed

The RepDB preview pack (CC BY-NC 4.0, non-commercial only) was removed
entirely in Phase 1: data, import script, mappings, media route and in-app
attribution. No RepDB content remains in the project. The Exercise schema
fields it used (contentTier, media.gallery, goals, mechanic, forceType, …) are
kept as empty/optional fields.

⸻

react-body-highlighter (muscle-coverage body diagram)

Source: https://github.com/giavinh79/react-body-highlighter
(npm package "react-body-highlighter", version 2.0.5)
License: MIT — Copyright (c) 2020 GV79

⸻

What this covers

The front-view (anterior) muscle-shaped SVG polygon coordinates used to draw
the human silhouette on the workout builder's live muscle-coverage map
(client/src/features/workouts/components/MuscleCoverageMap/MuscleCoverageMap.tsx).

Only the polygon coordinate data was copied — the `anteriorData` shape
definitions, in their original 0–100 × 0–200 coordinate space — remapped from
that library's own muscle-slug taxonomy onto our own BodyRegion keys
(client/src/features/workouts/data/bodyRegions.ts). The react-body-highlighter
package itself was not installed as a dependency: its <Model> component owns
its own data/coloring API, which didn't fit the exercise-count intensity
scaling and glow behavior built for this feature, so only the underlying
shape data was reused, redrawn with our own colors, glow, and animation.

⸻

Required attribution

MIT requires the copyright notice and permission notice be included with
substantial portions of the software reused. That notice is kept in a code
comment at the top of MuscleCoverageMap.tsx, alongside this entry.

⸻

End of Third-Party Content Notice
