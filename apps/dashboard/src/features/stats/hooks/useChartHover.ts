import { useCallback, useState } from 'react';

/** Which of a chart's `count` marks the pointer is on (null = none). A mark that no longer exists reads as none. */
export function useChartHover(count: number): { active: number | null; hover: (index: number) => void; leave: () => void } {
  const [index, setIndex] = useState<number | null>(null);
  const leave = useCallback(() => setIndex(null), []);
  return { active: index !== null && index < count ? index : null, hover: setIndex, leave };
}
