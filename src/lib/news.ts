// Actualités (D7) : lecture de la collection `news`, slugs et dates localisées.
import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase, type Locale } from '~/i18n/routes';

export type NewsEntry = CollectionEntry<'news'>;

const INDEX: Record<Locale, string> = { fr: '/actualites/', en: '/en/news/' };

/** Slug d'un article : le nom du fichier, sans le dossier de langue (fr/xxx → xxx). */
export function newsSlug(entry: NewsEntry): string {
  return entry.id.replace(/^(fr|en)\//, '');
}

/** URL d'un article dans sa langue, base de déploiement comprise. */
export function newsUrl(entry: NewsEntry): string {
  return withBase(`${INDEX[entry.data.lang]}${newsSlug(entry)}/`);
}

/** Articles d'une langue, du plus récent au plus ancien. */
export async function getNews(lang: Locale): Promise<NewsEntry[]> {
  const all = await getCollection('news', (e) => e.data.lang === lang);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Liste de la page /en/news/ : les articles anglais, complétés par les articles français
 * sans traduction (signalés « In French » et liés à la version française).
 */
export async function getNewsForListing(lang: Locale): Promise<Array<{ entry: NewsEntry; fallback: boolean }>> {
  const own = await getNews(lang);
  if (lang === 'fr') return own.map((entry) => ({ entry, fallback: false }));
  const translated = new Set(own.map((e) => e.data.translationKey));
  const fr = (await getNews('fr')).filter((e) => !translated.has(e.data.translationKey));
  return [...own.map((entry) => ({ entry, fallback: false })), ...fr.map((entry) => ({ entry, fallback: true }))].sort(
    (a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf(),
  );
}

/** Date lisible (« 13 décembre 2019 » / « 13 December 2019 ») ; mois et année si approximative. */
export function formatNewsDate(entry: NewsEntry, lang: Locale): string {
  const opts: Intl.DateTimeFormatOptions = entry.data.dateApprox
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', opts).format(entry.data.date);
}

/** Valeur de l'attribut datetime (AAAA-MM-JJ). */
export function isoDate(entry: NewsEntry): string {
  return entry.data.date.toISOString().slice(0, 10);
}

/** Libellés des étiquettes importées de l'ancien site. */
export const TAG_LABELS: Record<string, Record<Locale, string>> = {
  'actu-tech': { fr: 'Actu tech', en: 'Tech news' },
  communique: { fr: 'Communiqué', en: 'Press release' },
  evenement: { fr: 'Événement', en: 'Event' },
  'software-news': { fr: 'Nouveautés logiciel', en: 'Software news' },
};

export function tagLabel(tag: string, lang: Locale): string {
  return TAG_LABELS[tag]?.[lang] ?? tag;
}
