import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Button } from '../../../../components/common/Button/Button';
import './ExerciseEmptyState.css';

interface ExerciseEmptyStateProps {
  variant: 'no-results' | 'no-data';
  onClearFilters?: () => void;
}

export function ExerciseEmptyState({ variant, onClearFilters }: ExerciseEmptyStateProps) {
  const isNoResults = variant === 'no-results';

  return (
    <GlassCard className="exercise-empty-state">
      <h2>{isNoResults ? 'No exercises match your filters.' : 'The exercise library is being built out.'}</h2>
      <p className="text-body">
        {isNoResults
          ? 'Try a different muscle, equipment, or difficulty combination.'
          : 'Check back soon as more exercises are reviewed and published.'}
      </p>
      {isNoResults && onClearFilters && (
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </GlassCard>
  );
}
