// Table des routes traduites. Chaque page déclare sa clé ; le sélecteur de langue et les
// balises hreflang s'appuient sur cette table (et non sur une substitution de préfixe).
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

export const ROUTES = {
  home: { fr: '/', en: '/en/' },
  interop: { fr: '/interoperabilite/', en: '/en/interoperability/' },
  ekylibre: { fr: '/ekylibre/', en: '/en/ekylibre/' },
  aiffel: { fr: '/aiffel/', en: '/en/aiffel/' },
  lexicon: { fr: '/lexicon/', en: '/en/lexicon/' },
  lyvre: { fr: '/lyvre/', en: '/en/lyvre/' },
  services: { fr: '/services/', en: '/en/services/' },
  developers: { fr: '/developpeurs/', en: '/en/developers/' },
  company: { fr: '/entreprise/', en: '/en/company/' },
  news: { fr: '/actualites/', en: '/en/news/' },
  contact: { fr: '/contact/', en: '/en/contact/' },
  legal: { fr: '/mentions-legales/', en: '/en/legal-notice/' },
  terms: { fr: '/terms-of-use/', en: '/en/terms-of-use/' },
  privacy: { fr: '/confidentialite/', en: '/en/privacy/' },
  cookies: { fr: '/cookies/', en: '/en/cookies/' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTES;

/** Préfixe un chemin absolu du site par la base de déploiement (ex. /ekylibre-sas/ en recette). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** URL d'une route dans une langue, base de déploiement comprise. */
export function routePath(key: RouteKey, lang: Locale): string {
  return withBase(ROUTES[key][lang]);
}

/** URL absolues de toutes les versions linguistiques d'une route (pour hreflang). */
export function alternates(key: RouteKey, site: URL): Array<{ lang: Locale; href: string }> {
  return LOCALES.map((lang) => ({ lang, href: new URL(routePath(key, lang), site).href }));
}
