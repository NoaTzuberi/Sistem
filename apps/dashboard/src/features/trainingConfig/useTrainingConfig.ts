import { useEffect, useState } from 'react';
import type { TrainingConfig } from '@sistem/types';
import { getTrainingConfig } from '../../services/coach/coachService';

// The coach's effective training config (Phase 12b): splits and workout-type slots. Loaded once per
// session and shared by every screen (it only changes through the settings screen, which comes later).

let cached: Promise<TrainingConfig> | null = null;

function loadConfig(): Promise<TrainingConfig> {
  cached ??= getTrainingConfig()
    .then((response) => response.config)
    .catch((error: unknown) => {
      cached = null;
      throw error;
    });
  return cached;
}

/** null while loading (or when it failed — screens then work without slots, like a free workout). */
export function useTrainingConfig(): TrainingConfig | null {
  const [config, setConfig] = useState<TrainingConfig | null>(null);
  useEffect(() => {
    let active = true;
    loadConfig()
      .then((loaded) => active && setConfig(loaded))
      .catch(() => active && setConfig(null));
    return () => {
      active = false;
    };
  }, []);
  return config;
}
