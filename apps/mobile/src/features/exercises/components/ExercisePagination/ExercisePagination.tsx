import { Button } from '../../../../components/common/Button/Button';
import './ExercisePagination.css';

interface ExercisePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ExercisePagination({ page, totalPages, onPageChange }: ExercisePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="exercise-pagination">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <span className="exercise-pagination-label text-caption">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
