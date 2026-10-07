import type { AchievementProgress, AchievementType } from '@sistem/types';
import type { AchievementDefinition } from './achievement.definitions';
import { METRICS } from './achievementMetrics';
import type { AchievementHistory, AchievementRuleConfig, MetricId, MetricPoint } from './achievementMetrics';

/**
 * Pure: which achievements her history has earned, and her progress towards each.
 * The service stores the unlocks it doesn't have yet (the unique key makes that
 * idempotent) — so every evaluation also catches up on anything a failed one missed.
 */

export interface Unlock {
  type: AchievementType;
  /** Idempotency key: type (one-time) or type:<qualifier> (repeatable). */
  key: string;
  value: number;
  /** When the rule was met — used as unlockedAt by the backfill. */
  at: Date;
  sourceLogId?: string;
  sourceBodyMetricId?: string;
}

/** Each metric is computed once per evaluation. */
function metricReader(history: AchievementHistory, config: AchievementRuleConfig) {
  const cache = new Map<MetricId, MetricPoint[]>();
  return (metric: MetricId): MetricPoint[] => {
    let points = cache.get(metric);
    if (!points) {
      points = METRICS[metric](history, config);
      cache.set(metric, points);
    }
    return points;
  };
}

function toUnlock(definition: AchievementDefinition, point: MetricPoint, key: string, value: number): Unlock {
  return {
    type: definition.type,
    key,
    value,
    at: point.at,
    ...(point.sourceLogId && { sourceLogId: point.sourceLogId }),
    ...(point.sourceBodyMetricId && { sourceBodyMetricId: point.sourceBodyMetricId }),
  };
}

export function resolveUnlocks(
  definitions: readonly AchievementDefinition[],
  history: AchievementHistory,
  config: AchievementRuleConfig,
): Unlock[] {
  const read = metricReader(history, config);
  return definitions.flatMap((definition): Unlock[] => {
    const points = read(definition.metric);
    if (definition.repeatable) {
      return points.map((point) => toUnlock(definition, point, `${definition.type}:${point.qualifier}`, point.value));
    }
    // The earliest point that reached the threshold.
    const reached = points
      .filter((point) => point.value >= definition.threshold)
      .reduce<MetricPoint | null>((first, point) => (!first || point.at < first.at ? point : first), null);
    return reached ? [toUnlock(definition, reached, definition.type, definition.threshold)] : [];
  });
}

export interface UnlockedRef {
  type: string;
  unlockedAt: Date;
}

/** `unlocked` = what is stored. current = the metric's highest value (repeatable: how many points). */
export function resolveProgress(
  definitions: readonly AchievementDefinition[],
  history: AchievementHistory,
  config: AchievementRuleConfig,
  unlocked: UnlockedRef[],
): AchievementProgress[] {
  const read = metricReader(history, config);
  return definitions.map((definition) => {
    const points = read(definition.metric);
    const mine = unlocked.filter((achievement) => achievement.type === definition.type);
    const latest = mine.reduce<Date | null>((max, achievement) => (!max || achievement.unlockedAt > max ? achievement.unlockedAt : max), null);
    return {
      type: definition.type,
      repeatable: definition.repeatable === true,
      ...(!definition.repeatable && { threshold: definition.threshold }),
      current: definition.repeatable ? points.length : points.reduce((max, point) => Math.max(max, point.value), 0),
      count: mine.length,
      unlockedAt: latest ? latest.toISOString() : null,
    };
  });
}
