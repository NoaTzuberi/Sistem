import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../../../app/config/routes';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './NutritionSubnav.css';

const LINKS = [
  { to: ROUTES.NUTRITION_FOODS, label: NUTRITION_COPY.foodsTab },
  { to: ROUTES.NUTRITION_TEMPLATES, label: NUTRITION_COPY.templatesTab },
  { to: ROUTES.NUTRITION_SETTINGS, label: NUTRITION_COPY.settingsTab },
];

/** The coach's nutrition pages: her food list, templates and numbers. */
export function NutritionSubnav() {
  return (
    <nav className="nutrition-subnav" aria-label={NUTRITION_COPY.navLabel}>
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className="nutrition-subnav-link">
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
