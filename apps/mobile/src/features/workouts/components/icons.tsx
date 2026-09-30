import {
  IconBarbell,
  IconArrowBigDownLines,
  IconShirtSport,
  IconStairs,
  IconYoga,
  IconTargetArrow,
  IconInfoCircle,
  IconPlaylistAdd,
  IconListCheck,
  IconWeight,
  IconTrendingUp,
  IconHeartRateMonitor,
  IconChevronUp,
  IconChevronDown,
  IconTrash,
  IconClock,
  IconListNumbers,
  IconTarget,
  IconClipboardCheck,
} from '@tabler/icons-react';

// Real icons from @tabler/icons-react, verified against the installed package's
// SVG source before picking — see conversation for the confirmed name-per-category
// mapping. Wrapped so the rest of the feature keeps a stable naming convention
// (PushIcon, PullIcon, ...) independent of which underlying icon backs each one.

export function PushIcon() {
  return <IconBarbell stroke={1.5} />;
}

export function PullIcon() {
  return <IconArrowBigDownLines stroke={1.5} />;
}

export function UpperBodyIcon() {
  return <IconShirtSport stroke={1.5} />;
}

export function LowerBodyIcon() {
  return <IconStairs stroke={1.5} />;
}

export function FullBodyIcon() {
  return <IconYoga stroke={1.5} />;
}

export function CoreIcon() {
  return <IconTargetArrow stroke={1.5} />;
}

export function BasicInfoIcon() {
  return <IconInfoCircle stroke={1.5} />;
}

export function AddExercisesIcon() {
  return <IconPlaylistAdd stroke={1.5} />;
}

export function YourExercisesIcon() {
  return <IconListCheck stroke={1.5} />;
}

export function StrengthGoalIcon() {
  return <IconWeight stroke={1.5} />;
}

export function HypertrophyGoalIcon() {
  return <IconTrendingUp stroke={1.5} />;
}

export function EnduranceGoalIcon() {
  return <IconHeartRateMonitor stroke={1.5} />;
}

export function ChevronUpIcon() {
  return <IconChevronUp stroke={1.8} />;
}

export function ChevronDownIcon() {
  return <IconChevronDown stroke={1.8} />;
}

export function TrashIcon() {
  return <IconTrash stroke={1.6} />;
}

export function ExerciseCountIcon() {
  return <IconListNumbers stroke={1.5} />;
}

export function DurationIcon() {
  return <IconClock stroke={1.5} />;
}

export function GoalCategoryStepIcon() {
  return <IconTarget stroke={1.5} />;
}

export function ReviewStepIcon() {
  return <IconClipboardCheck stroke={1.5} />;
}
