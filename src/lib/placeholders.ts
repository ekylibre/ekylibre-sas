import { ROUTES, type Locale, type RouteKey } from '~/i18n/routes';

// Routes servies par une page d'attente tant que leur page réelle n'existe pas.
// Retirer une clé de cette liste au moment où sa page est créée dans src/pages/.
export const PLACEHOLDER_ROUTES: RouteKey[] = [
  'interop',
  'ekylibre',
  'aiffel',
  'lexicon',
  'services',
  'developers',
  'company',
  'news',
  'contact',
  'legal',
  'terms',
  'privacy',
  'cookies',
];

/** Chemins pour getStaticPaths d'une route [...slug] (sans préfixe de langue ni barres obliques). */
export function placeholderPaths(lang: Locale) {
  return PLACEHOLDER_ROUTES.map((routeKey) => {
    const path = ROUTES[routeKey][lang].replace(/^\/(en\/)?/, '').replace(/\/$/, '');
    return { params: { slug: path }, props: { routeKey } };
  });
}
