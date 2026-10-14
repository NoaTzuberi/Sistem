import './QuickViewFooter.css';

interface QuickViewFooterProps {
  fullProfileLabel: string;
  onFullProfile: () => void;
  /** The one next step for her status (build / this week's plan / a new plan). */
  primaryLabel: string;
  onPrimary: () => void;
}

/** The drawer's sticky bottom: her full profile, and the next step in pink. */
export function QuickViewFooter({ fullProfileLabel, onFullProfile, primaryLabel, onPrimary }: QuickViewFooterProps) {
  return (
    <footer className="tqv-footer">
      <button className="tqv-footer-secondary" type="button" onClick={onFullProfile}>
        {fullProfileLabel}
      </button>
      <button className="tqv-footer-primary" type="button" onClick={onPrimary}>
        {primaryLabel}
      </button>
    </footer>
  );
}
