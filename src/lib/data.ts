// Accès typé aux instantanés générés par scripts/fetch-*.mjs (src/data/generated/).
import pluginsFile from '~/data/generated/plugins.json';
import statsFile from '~/data/generated/stats.json';
import datasetsFile from '~/data/generated/datasets.json';
import type { Locale } from '~/i18n/routes';

export type Plugin = (typeof pluginsFile.plugins)[number];
export type Dataset = (typeof datasetsFile.datasets)[number];

export const plugins: Plugin[] = pluginsFile.plugins;
export const datasets: Dataset[] = datasetsFile.datasets;

export const stats = {
  core: statsFile.core,
  stablePlugins: statsFile.stablePlugins,
  lexicon: {
    datasets: datasetsFile.datasets.length,
    totalRows: datasetsFile.totalRows,
    providers: datasetsFile.providers,
    byEkylibre: datasetsFile.byEkylibre,
  },
  generatedAt: statsFile.generatedAt,
};

const LOCALE_TAG: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Nombre entier localisé (espace fine insécable en français). */
export function formatInt(n: number, lang: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[lang]).format(n);
}

/** Grand nombre abrégé : 623 M (fr) / 623M (en). */
export function formatCompact(n: number, lang: Locale): string {
  // en-GB abrège en « 623m » ; en-US donne la forme usuelle « 623M ».
  const tag = lang === 'en' ? 'en-US' : LOCALE_TAG[lang];
  return new Intl.NumberFormat(tag, { notation: 'compact', maximumFractionDigits: 0 }).format(n);
}
