import { Switch } from '../../../../components/common/Switch/Switch';
import './VegToggle.css';

/** "Vegetables free" as a switch, at the end of a meal card's header. */
export function VegToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <Switch className="nb-veg" label={label} checked={checked} onChange={onChange} />;
}
