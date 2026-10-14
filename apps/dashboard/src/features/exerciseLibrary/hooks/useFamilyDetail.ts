import { useCallback, useEffect, useState } from 'react';
import type { ExerciseFamilyDetail } from '@sistem/types';
import { getActiveLanguage, useLoad } from '@sistem/shared';
import { getExerciseFamily } from '../../../services/coach/coachService';
import { exerciseLibraryCopy } from '../copy';

/** One family with all its exercises (main per variant and the copies). `family` can be patched while a change is on its way. */
export function useFamilyDetail(familyId: string) {
  const load = useCallback(() => getExerciseFamily(familyId), [familyId]);
  const { data, error, isLoading } = useLoad(load, exerciseLibraryCopy[getActiveLanguage()].loadError);
  const [family, setFamily] = useState<ExerciseFamilyDetail>();

  useEffect(() => {
    if (data) setFamily(data);
  }, [data]);

  return { family, setFamily, error, isLoading: isLoading && !family };
}
