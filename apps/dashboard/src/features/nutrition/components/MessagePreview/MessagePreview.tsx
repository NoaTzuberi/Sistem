import './MessagePreview.css';

/** Her message as she will read it at the top of her Nutrition tab: a chat bubble on a phone-like card. */
export function MessagePreview({ title, text, empty }: { title: string; text: string; empty: string }) {
  const hasText = text.trim().length > 0;
  return (
    <aside className="nb-preview" aria-label={title}>
      <small className="nb-preview-title">{title}</small>
      <p className="nb-preview-bubble" data-empty={!hasText || undefined} dir="auto">
        {hasText ? text : empty}
      </p>
    </aside>
  );
}
