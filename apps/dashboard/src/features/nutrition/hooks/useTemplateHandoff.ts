import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { templateIdFromState } from '../../nutritionLibrary/data/templateHandoff';

/**
 * "Use for a new plan" from the nutrition library: the template id arrives in router state. It is
 * applied once through the builder's own "start from a template" (which asks first when her meals
 * have content), then cleared from the history entry so a reload or Back doesn't apply it again.
 */
export function useTemplateHandoff(apply: (templateId: string) => Promise<boolean>) {
  const location = useLocation();
  const navigate = useNavigate();
  const handled = useRef(false);
  const templateId = templateIdFromState(location.state);

  useEffect(() => {
    if (!templateId || handled.current) return;
    handled.current = true;
    navigate(location.pathname + location.search, { replace: true, state: null });
    void apply(templateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, [templateId]);
}
