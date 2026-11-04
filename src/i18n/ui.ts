import type { Locale, RouteKey } from './routes';

// Libellés d'interface. Les textes éditoriaux vivent dans src/content/.
const fr = {
  'site.name': 'Ekylibre',
  'site.tagline': 'Le système d’information agricole interopérable',
  'site.description':
    'Ekylibre SAS édite, opère et fait vivre Ekylibre, Lexicon, Aiffel et Lyvre : des communs numériques open source qui relient tous les outils et toutes les données de la ferme.',
  'a11y.skip': 'Aller au contenu',
  'a11y.menu.open': 'Ouvrir le menu',
  'a11y.menu.close': 'Fermer le menu',
  'a11y.home': 'Ekylibre, accueil',
  'a11y.mainNav': 'Navigation principale',
  'a11y.footerNav': 'Liens de pied de page',
  'lang.switch': 'Change language',
  'lang.label': 'English',
  'lang.short': 'EN',
  'cta.demo': 'Demander une démo',
  'cta.project': 'Parler de votre projet',
  'cta.discover': 'Découvrir',
  'nav.products': 'Produits',
  'footer.products': 'Produits',
  'footer.company': 'Entreprise',
  'footer.resources': 'Ressources',
  'footer.legal': 'Informations légales',
  'footer.cookies': 'Gérer les cookies',
  'footer.newsletter.title': 'Lettre d’information',
  'footer.newsletter.text': 'Les nouveautés d’Ekylibre, de Lexicon, d’Aiffel et de Lyvre, une fois par mois au plus.',
  'footer.opensource': 'Logiciels libres. Données ouvertes. Fabriqués en France.',
  'footer.copyright': 'Ekylibre SAS',
  'placeholder.title': 'Page en préparation',
  'placeholder.text': 'Cette page sera publiée lors du lancement du nouveau site, le 10 novembre 2026.',
  'placeholder.back': 'Retour à l’accueil',
} as const;

type Dict = Record<keyof typeof fr, string>;

const en: Dict = {
  'site.name': 'Ekylibre',
  'site.tagline': 'The interoperable farm information system',
  'site.description':
    'Ekylibre SAS publishes, operates and develops Ekylibre, Lexicon, Aiffel and Lyvre: open-source digital commons that connect every tool and every piece of farm data.',
  'a11y.skip': 'Skip to content',
  'a11y.menu.open': 'Open menu',
  'a11y.menu.close': 'Close menu',
  'a11y.home': 'Ekylibre, home',
  'a11y.mainNav': 'Main navigation',
  'a11y.footerNav': 'Footer links',
  'lang.switch': 'Changer de langue',
  'lang.label': 'Français',
  'lang.short': 'FR',
  'cta.demo': 'Request a demo',
  'cta.project': 'Discuss your project',
  'cta.discover': 'Discover',
  'nav.products': 'Products',
  'footer.products': 'Products',
  'footer.company': 'Company',
  'footer.resources': 'Resources',
  'footer.legal': 'Legal',
  'footer.cookies': 'Manage cookies',
  'footer.newsletter.title': 'Newsletter',
  'footer.newsletter.text': 'News from Ekylibre, Lexicon, Aiffel and Lyvre, at most once a month.',
  'footer.opensource': 'Free software. Open data. Made in France.',
  'footer.copyright': 'Ekylibre SAS',
  'placeholder.title': 'Page in preparation',
  'placeholder.text': 'This page will be published when the new website launches on 10 November 2026.',
  'placeholder.back': 'Back to home',
};

const DICTS: Record<Locale, Dict> = { fr, en };

export type UiKey = keyof Dict;
export function useTranslations(lang: Locale) {
  return (key: UiKey): string => DICTS[lang][key];
}

/** Titres courts des routes, utilisés dans les menus. */
export const ROUTE_TITLES: Record<RouteKey, Record<Locale, string>> = {
  home: { fr: 'Accueil', en: 'Home' },
  interop: { fr: 'Interopérabilité', en: 'Interoperability' },
  ekylibre: { fr: 'Ekylibre', en: 'Ekylibre' },
  aiffel: { fr: 'Aiffel', en: 'Aiffel' },
  lexicon: { fr: 'Lexicon', en: 'Lexicon' },
  lyvre: { fr: 'Lyvre', en: 'Lyvre' },
  services: { fr: 'Services', en: 'Services' },
  developers: { fr: 'Développeurs', en: 'Developers' },
  company: { fr: 'Entreprise', en: 'Company' },
  news: { fr: 'Actualités', en: 'News' },
  contact: { fr: 'Contact', en: 'Contact' },
  legal: { fr: 'Mentions légales', en: 'Legal notice' },
  terms: { fr: 'Conditions d’utilisation', en: 'Terms of use' },
  privacy: { fr: 'Confidentialité', en: 'Privacy' },
  cookies: { fr: 'Cookies', en: 'Cookies' },
};
