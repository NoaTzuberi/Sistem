import './VegToggle.css';

/** "Vegetables free" as a switch — Cherry Rose when on (no green). */
export function VegToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="nb-veg">
      <input className="nb-veg-input" type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="nb-veg-switch" aria-hidden="true" />
      {label}
    </label>
  );
}
