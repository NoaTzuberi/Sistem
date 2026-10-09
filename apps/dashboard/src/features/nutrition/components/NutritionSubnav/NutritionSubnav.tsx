import { useCopy } from '@sistem/shared';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../../../app/config/routes';
import { nutritionCopy } from '../../copy';
import './NutritionSubnav.css';

const LINKS = [
  { to: ROUTES.NUTRITION_FOODS, label: 'foodsTab' },
  { to: ROUTES.NUTRITION_TEMPLATES, label: 'templatesTab' },
  { to: ROUTES.NUTRITION_SETTINGS, label: 'settingsTab' },
] as const;

/** The coach's nutrition pages: her food list, templates and numbers. */
export function NutritionSubnav() {
  const copy = useCopy(nutritionCopy);
  return (
    <nav className="nutrition-subnav" aria-label={copy.navLabel}>
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className="nutrition-subnav-link">
          {copy[link.label]}
        </NavLink>
      ))}
    </nav>
  );
}
