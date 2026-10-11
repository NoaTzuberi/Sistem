import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sistem.dashboard.sidebarCollapsed';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Storage blocked: the sidebar just starts open.
    return false;
  }
}

/** The sidebar as an icon rail or open — remembered per browser. */
export function useSidebarCollapse(): { isCollapsed: boolean; toggleCollapsed: () => void } {
  const [isCollapsed, setIsCollapsed] = useState(readStored);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => {
      const next = !current;
      try {
        if (next) localStorage.setItem(STORAGE_KEY, '1');
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Not remembered, still toggled.
      }
      return next;
    });
  }, []);

  return { isCollapsed, toggleCollapsed };
}
