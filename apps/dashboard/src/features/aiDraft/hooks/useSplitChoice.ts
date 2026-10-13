import { useState } from 'react';
import type { AiSplitOption, AiTrainingRecommendation } from '@sistem/types';

/**
 * Which of a ready draft's split options the coach is looking at. The plan inside a draft is
 * always the one for option 1, so "use the full plan" only fits while that option is selected.
 */
export function useSplitChoice(ready: AiTrainingRecommendation | null) {
  const [selected, setSelected] = useState(0);
  const output = ready?.output ?? null;
  const options: AiSplitOption[] = output?.splitOptions ?? [];
  const index = Math.min(selected, Math.max(0, options.length - 1));
  const option = options[index];
  const isDrafted = Boolean(option && output && index === 0 && option.splitId === output.splitId);

  return {
    options,
    selectedIndex: index,
    select: setSelected,
    /** The selected option; undefined for a Phase 12 draft (one plan, no options). */
    option,
    /** The draft's plan is for the selected option (or the draft has no options at all). */
    hasPlanForSelection: options.length === 0 ? output !== null : isDrafted,
  };
}
