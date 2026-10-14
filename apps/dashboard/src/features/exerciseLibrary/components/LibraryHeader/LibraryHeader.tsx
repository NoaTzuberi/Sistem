import { useCopy } from '@sistem/shared';
import { exerciseLibraryCopy } from '../../copy';
import { LibrarySummary } from '../LibrarySummary/LibrarySummary';
import './LibraryHeader.css';

interface LibraryHeaderProps {
  families: number | undefined;
  toReview: number | undefined;
}

/** The page's title, its existing explanation, and the library's totals. */
export function LibraryHeader({ families, toReview }: LibraryHeaderProps) {
  const copy = useCopy(exerciseLibraryCopy);
  return (
    <header className="library-header">
      <div className="library-header-text">
        <h1 className="library-header-title">{copy.title}</h1>
        <p className="library-header-intro">{copy.intro}</p>
      </div>
      <LibrarySummary families={families} toReview={toReview} />
    </header>
  );
}
