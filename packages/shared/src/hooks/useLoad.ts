import { useCallback, useEffect, useState } from 'react';

interface LoadState<T> {
  data: T | undefined;
  error: string | undefined;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Runs `load` on mount and whenever it changes (wrap it in useCallback), ignoring
 * the answer of a call that was replaced in the meantime.
 */
export function useLoad<T>(load: () => Promise<T>, fallbackError: string): LoadState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    load()
      .then((result) => {
        if (!isCurrent) return;
        setData(result);
        setError(undefined);
      })
      .catch(() => {
        if (isCurrent) setError(fallbackError);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [load, fallbackError, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { data, error, isLoading, reload };
}
