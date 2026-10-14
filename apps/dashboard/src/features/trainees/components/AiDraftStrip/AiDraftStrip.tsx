import { Icon } from '../../../../components/common/Icon/Icon';
import './AiDraftStrip.css';

interface AiDraftStripProps {
  title: string;
  /** "Upper / lower · 4 days · only you can see it". */
  meta: string;
  openLabel: string;
  onOpen: () => void;
}

/** A ready AI draft of her first plan, one press from the builder. */
export function AiDraftStrip({ title, meta, openLabel, onOpen }: AiDraftStripProps) {
  return (
    <section className="tqv-ai">
      <span className="tqv-ai-icon" aria-hidden="true">
        <Icon name="spark" />
      </span>
      <div className="tqv-ai-text">
        <b className="tqv-ai-title">{title}</b>
        <span className="tqv-ai-meta">{meta}</span>
      </div>
      <button className="tqv-ai-open" type="button" onClick={onOpen}>
        {openLabel}
      </button>
    </section>
  );
}
