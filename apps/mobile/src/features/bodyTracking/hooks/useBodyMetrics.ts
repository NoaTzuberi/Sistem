import { useCallback, useEffect, useState } from 'react';
import type { BodyMetric, BodyMetricList } from '@sistem/types';
import { useLoad } from '@sistem/shared';

interface BodyMetricsState {
  list: BodyMetricList | undefined;
  error: string | undefined;
  isLoading: boolean;
  reload: () => void;
  /** Puts the server's answer for one day into the list (null = the day is gone). */
  applyDay: (date: string, metric: BodyMetric | null) => void;
}

/**
 * Her days (or a trainee's, for the coach), newest first. A write answers with the day
 * as it is now, which replaces it here — no full reload, so the other photos keep their
 * signed links and don't download again.
 */
export function useBodyMetrics(load: () => Promise<BodyMetricList>, loadError: string): BodyMetricsState {
  const { data, error, isLoading, reload } = useLoad(load, loadError);
  const [list, setList] = useState<BodyMetricList>();

  useEffect(() => setList(data), [data]);

  const applyDay = useCallback((date: string, metric: BodyMetric | null) => {
    setList((previous) => {
      if (!previous) return previous;
      const others = previous.items.filter((item) => item.date !== date);
      const items = metric ? [...others, metric].sort((a, b) => b.date.localeCompare(a.date)) : others;
      return { ...previous, items };
    });
  }, []);

  return { list, error, isLoading, reload, applyDay };
}
