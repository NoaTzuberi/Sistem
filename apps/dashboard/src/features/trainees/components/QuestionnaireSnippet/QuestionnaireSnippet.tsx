import './QuestionnaireSnippet.css';

interface QuestionnaireSnippetProps {
  title: string;
  /** Her answers in a line or two (labels joined), or null. */
  summary: string | null;
  /** Injuries and limitations she named; the first one is shown, with how many more. */
  flags: string[];
}

/** What a coach reads first in her answers before building — and a warning chip when she named a limitation. */
export function QuestionnaireSnippet({ title, summary, flags }: QuestionnaireSnippetProps) {
  if (!summary && flags.length === 0) return null;
  return (
    <section className="tqv-note">
      <h3 className="tqv-note-title">{title}</h3>
      {summary && <p className="tqv-note-text">{summary}</p>}
      {flags.length > 0 && (
        <span className="tqv-note-flag">
          <span aria-hidden="true">⚠</span>
          <bdi>{flags[0]}</bdi>
          {flags.length > 1 && <span dir="ltr">+{flags.length - 1}</span>}
        </span>
      )}
    </section>
  );
}
