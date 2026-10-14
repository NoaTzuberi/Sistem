import type { AiNutritionRecommendation } from '@sistem/types';
import { NutritionAiDraftCard } from '../../../aiDraft/components/NutritionAiDraftCard/NutritionAiDraftCard';
import { NutritionAiRationale } from '../../../aiDraft/components/NutritionAiRationale/NutritionAiRationale';
import type { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import './AiDraftCard.css';

interface AiDraftCardProps {
  traineeId: string;
  ai: ReturnType<typeof useLatestAiDraft<'nutrition_plan'>>;
  loadedId: string | null;
  onLoad: (recommendation: AiNutritionRecommendation) => void;
}

/** The AI nutrition draft (13c) on a soft pink / lilac cloud — the existing card, and its reasoning once loaded. */
export function AiDraftCard({ traineeId, ai, loadedId, onLoad }: AiDraftCardProps) {
  return (
    <div className="nb-ai">
      <NutritionAiDraftCard ai={ai} onLoad={onLoad} loadedId={loadedId} />
      {loadedId && <NutritionAiRationale traineeId={traineeId} recommendationId={loadedId} recommendation={ai.latest} />}
    </div>
  );
}
