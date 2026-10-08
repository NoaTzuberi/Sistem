import type { NutritionIssue } from '@sistem/types';
import './IssueList.css';

/** The server's publish rules: errors block publishing, warnings don't. */
export function IssueList({ issues }: { issues: NutritionIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="nutrition-issues">
      {issues.map((issue, index) => (
        <li key={index} className={`nutrition-issue nutrition-issue-${issue.severity}`} dir="auto">
          <span aria-hidden="true">{issue.severity === 'error' ? '✕' : '⚠'}</span> {issue.message}
        </li>
      ))}
    </ul>
  );
}
