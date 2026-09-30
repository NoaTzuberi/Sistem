import type { ComponentType } from 'react';
import pushImage from '../../../assets/push.jpg';
import pullImage from '../../../assets/pull.jpg';
import upperBodyImage from '../../../assets/upper-body.jpg';
import lowerBodyImage from '../../../assets/lower-body.jpg';
import fullBodyImage from '../../../assets/full-body.jpg';
import coreImage from '../../../assets/core.jpg';
import { CoreIcon, FullBodyIcon, LowerBodyIcon, PullIcon, PushIcon, UpperBodyIcon } from '../components/icons';
import type { WorkoutCategory } from '../types';

interface CategoryVisual {
  coverImage: string;
  Icon: ComponentType;
}

const CATEGORY_VISUALS: Record<WorkoutCategory, CategoryVisual> = {
  push: {
    coverImage: pushImage,
    Icon: PushIcon,
  },
  pull: {
    coverImage: pullImage,
    Icon: PullIcon,
  },
  upper_body: {
    coverImage: upperBodyImage,
    Icon: UpperBodyIcon,
  },
  legs: {
    coverImage: lowerBodyImage,
    Icon: LowerBodyIcon,
  },
  full_body: {
    coverImage: fullBodyImage,
    Icon: FullBodyIcon,
  },
  core: {
    coverImage: coreImage,
    Icon: CoreIcon,
  },
};

// Templates without a category are rare (category is optional on the model) —
// falls back to the Full Body cover as the most generic, catch-all visual.
const DEFAULT_VISUAL: CategoryVisual = CATEGORY_VISUALS.full_body;

export function getCategoryVisual(category?: WorkoutCategory): CategoryVisual {
  return category ? CATEGORY_VISUALS[category] : DEFAULT_VISUAL;
}

export function getCategoryIcon(category: WorkoutCategory): ComponentType {
  return CATEGORY_VISUALS[category].Icon;
}
