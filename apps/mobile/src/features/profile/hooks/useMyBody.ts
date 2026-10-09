import { DEFAULT_UNITS, todayInTimezone, useCopy } from '@sistem/shared';
import type { UnitPreferences } from '@sistem/types';
import { listBodyMetrics } from '../../../services/bodyMetrics/bodyMetricsService';
import { useAuth } from '../../../services/auth/AuthContext';
import { useBodyMetrics } from '../../bodyTracking/hooks/useBodyMetrics';
import { bodyCopy } from '../../bodyTracking/copy';

/** Her own days (Profile screens). */
export function useMyBodyMetrics() {
  const copy = useCopy(bodyCopy);
  return useBodyMetrics(listBodyMetrics, copy.loadError);
}

/** Her display units and today's date in her time zone (the default for a new entry). */
export function useMyUnits(): { units: UnitPreferences; today: string } {
  const { user } = useAuth();
  return { units: user?.units ?? DEFAULT_UNITS, today: todayInTimezone(user?.timezone ?? 'UTC') };
}
