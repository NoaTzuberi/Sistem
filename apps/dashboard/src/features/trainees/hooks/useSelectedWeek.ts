import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProgramWeek } from './useTraineeWeeks';

/** The URL keeps the selected week, so a link (or a reload) opens the same one. */
export const WEEK_PARAM = 'week';

/** The selected week: the one in the URL when it is part of her program, else the current week. */
export function useSelectedWeek(weeks: ProgramWeek[], currentWeekStart: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(WEEK_PARAM);
  const selected = weeks.find((week) => week.weekStartDate === requested) ?? weeks.find((week) => week.weekStartDate === currentWeekStart) ?? weeks[0];

  const select = useCallback(
    (weekStartDate: string) => {
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          next.set(WEEK_PARAM, weekStartDate);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { selected, select };
}
