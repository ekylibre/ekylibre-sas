// Croise la curation éditoriale (connecteurs, familles Lexicon) avec les données générées
// (plugins stables, catalogue Lexicon). Source unique pour la scène 3D et les tableaux HTML.
import { getCollection } from 'astro:content';
import { plugins, datasets } from '~/lib/data';
import type { Locale } from '~/i18n/routes';
import type { IconName } from '~/lib/icon-names';

export type Category = 'machines' | 'meteo' | 'elevage' | 'vigne' | 'finance' | 'gestion' | 'durabilite' | 'terrain';

export const CATEGORY_META: Record<Category, { icon: IconName; label: Record<Locale, string> }> = {
  machines: { icon: 'tractor', label: { fr: 'Machines', en: 'Machinery' } },
  meteo: { icon: 'cloudy', label: { fr: 'Météo et capteurs', en: 'Weather and sensors' } },
  elevage: { icon: 'cow', label: { fr: 'Élevage', en: 'Livestock' } },
  vigne: { icon: 'grape', label: { fr: 'Vigne et vin', en: 'Vineyard and wine' } },
  finance: { icon: 'hand-holding-dollar', label: { fr: 'Banque et finance', en: 'Banking and finance' } },
  gestion: { icon: 'calendar-check', label: { fr: 'Gestion', en: 'Management' } },
  durabilite: { icon: 'leaf', label: { fr: 'Durabilité', en: 'Sustainability' } },
  terrain: { icon: 'land-parcels', label: { fr: 'Parcelles', en: 'Fields' } },
};

export interface ConnectorView {
  slug: string;
  category: Category;
  zone: string;
  dataFlow: 'in' | 'out' | 'both';
  title: string;
  summary: string;
  partner?: { name: string; url?: string | undefined } | undefined;
  version: string;
  license: string | null;
  repoUrl: string;
}

/** Connecteurs affichables : plugins stables, enrichis de leur curation (D9). */
export async function stableConnectors(lang: Locale): Promise<ConnectorView[]> {
  const curated = new Map((await getCollection('connectors')).map((e) => [e.data.slug, e.data]));
  return plugins
    .map((p): ConnectorView => {
      const c = curated.get(p.slug);
      return {
        slug: p.slug,
        category: (c?.category ?? 'gestion') as Category,
        // Plugin stable sans curation : affiché au bureau avec le résumé de son README (§4.2).
        zone: c?.zone ?? 'bureau',
        dataFlow: c?.dataFlow ?? 'both',
        title: c?.title[lang] ?? p.slug,
        summary: c?.summary[lang] ?? p.readmeSummary,
        ...(c?.partner ? { partner: c.partner } : {}),
        version: p.latestTag,
        license: p.license,
        repoUrl: p.url,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title, lang));
}

export interface FamilyView {
  id: string;
  icon: IconName;
  title: string;
  rows: number;
  datasets: Array<{
    name: string;
    label: string;
    provider: string;
    licence: string;
    rows: number;
    scope: 'open' | 'members';
    href: string;
  }>;
}

/** Familles du Lexicon avec leurs jeux de données (ordre du fichier de curation). */
export async function lexiconFamilies(lang: Locale): Promise<FamilyView[]> {
  const byName = new Map(datasets.map((d) => [d.name, d]));
  const families = await getCollection('families');
  return families.map((f) => {
    const items = Object.entries(f.data.datasets)
      .map(([name, label]) => {
        const d = byName.get(name);
        return d
          ? {
              name,
              label: label[lang],
              provider: d.provider,
              licence: d.licence,
              rows: d.rows,
              scope: d.scope as 'open' | 'members',
              href: d.href,
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.rows - a.rows);
    return {
      id: f.data.id,
      icon: f.data.icon as IconName,
      title: f.data.title[lang],
      rows: items.reduce((s, d) => s + d.rows, 0),
      datasets: items,
    };
  });
}
