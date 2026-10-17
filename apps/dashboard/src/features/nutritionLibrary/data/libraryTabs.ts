import { ROUTES } from '../../../app/config/routes';

// The library's three tabs. Each has its own route, so the open tab lives in the URL.
export const LIBRARY_TABS = ['foods', 'templates', 'settings'] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];

export const TAB_PATHS: Record<LibraryTab, string> = {
  foods: ROUTES.NUTRITION_FOODS,
  templates: ROUTES.NUTRITION_TEMPLATES,
  settings: ROUTES.NUTRITION_SETTINGS,
};

export function tabFromPath(pathname: string): LibraryTab {
  return LIBRARY_TABS.find((tab) => pathname.startsWith(TAB_PATHS[tab])) ?? 'foods';
}

/** The tab button's id (its panel is labelled by it). */
export function libraryTabId(tab: LibraryTab): string {
  return `nutrition-library-tab-${tab}`;
}
