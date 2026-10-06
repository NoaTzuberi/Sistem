import { DEFAULT_UNITS, todayInTimezone } from '@sistem/shared';
import type { UnitPreferences } from '@sistem/types';
import { listBodyMetrics } from '../../../services/bodyMetrics/bodyMetricsService';
import { useAuth } from '../../../services/auth/AuthContext';
import { useBodyMetrics } from '../../bodyTracking/hooks/useBodyMetrics';
import { BODY_COPY } from '../../bodyTracking/data/bodyCopy';

/** Her own days (Profile screens). */
export function useMyBodyMetrics() {
  return useBodyMetrics(listBodyMetrics, BODY_COPY.loadError);
}

/** Her display units and today's date in her time zone (the default for a new entry). */
export function useMyUnits(): { units: UnitPreferences; today: string } {
  const { user } = useAuth();
  return { units: user?.units ?? DEFAULT_UNITS, today: todayInTimezone(user?.timezone ?? 'UTC') };
}
