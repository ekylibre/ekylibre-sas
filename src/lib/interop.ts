// Croise la curation éditoriale (connecteurs Fourmy et Lyvre, familles Lexicon) avec les données
// générées (catalogue Lexicon). Source unique pour la scène 3D et les tableaux HTML.
import { getCollection } from 'astro:content';
import { datasets } from '~/lib/data';
import { routePath, type Locale } from '~/i18n/routes';
import type { IconName } from '~/lib/icon-names';

export type Category = 'machines' | 'meteo' | 'elevage' | 'vigne' | 'finance' | 'gestion' | 'durabilite' | 'terrain';
export type ConnectorProduct = 'fourmy' | 'lyvre';
export type ConnectorStatus = 'stable' | 'en-cours';

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

export const CONNECTOR_STATUS_LABEL: Record<ConnectorStatus, Record<Locale, string>> = {
  stable: { fr: 'Stable', en: 'Stable' },
  'en-cours': { fr: 'En cours', en: 'In progress' },
};

const PRODUCT_NAME: Record<ConnectorProduct, string> = { fourmy: 'Fourmy', lyvre: 'Lyvre' };

export interface ConnectorView {
  slug: string;
  product: ConnectorProduct;
  productName: string;
  status: ConnectorStatus;
  category: Category;
  /** Ancre dans la scène 3D ; intégrations de Fourmy seulement (D34). */
  zone?: string | undefined;
  dataFlow: 'in' | 'out' | 'both';
  title: string;
  summary: string;
  partner?: { name: string; url?: string | undefined } | undefined;
  /** Code publié (stable) ou, à défaut, page du logiciel sur le site. */
  codeUrl: string;
  /** Vrai si codeUrl pointe vers le dépôt (connecteur stable). */
  hasCode: boolean;
}

const PRODUCT_ORDER: ConnectorProduct[] = ['fourmy', 'lyvre'];
const STATUS_ORDER: ConnectorStatus[] = ['stable', 'en-cours'];

/** Connecteurs de Fourmy et de Lyvre (docs/design/04-accueil-kit-connecteurs.md §4). */
export async function connectors(lang: Locale, filter: { product?: ConnectorProduct } = {}): Promise<ConnectorView[]> {
  return (await getCollection('connectors'))
    .map(({ data: c }): ConnectorView & { order: number } => ({
      order: c.order,
      slug: c.slug,
      product: c.product,
      productName: PRODUCT_NAME[c.product],
      status: c.status,
      category: c.category,
      zone: c.zone,
      dataFlow: c.dataFlow,
      title: c.title[lang],
      summary: c.summary[lang],
      ...(c.partner ? { partner: c.partner } : {}),
      codeUrl: c.source
        ? `https://github.com/ekylibre/${c.product}/tree/main/${c.source}`
        : routePath(c.product, lang),
      hasCode: Boolean(c.source),
    }))
    .filter((c) => !filter.product || c.product === filter.product)
    .sort(
      (a, b) =>
        PRODUCT_ORDER.indexOf(a.product) - PRODUCT_ORDER.indexOf(b.product) ||
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
        // puis l'ordre du fichier : il fixe l'ordre des partenaires sur les médaillons.
        a.order - b.order,
    );
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
  const ORDER = ['territoire', 'climat', 'intrants', 'entreprises', 'marches', 'savoirs', 'filiere'];
  const families = (await getCollection('families')).sort(
    (a, b) => ORDER.indexOf(a.data.id) - ORDER.indexOf(b.data.id),
  );
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

/** Zones de la ferme : titre affiché sur le médaillon et pictogramme (docs/design §8.3). */
export const ZONE_META: Record<string, { icon: IconName; title: Record<Locale, string> }> = {
  hub: { icon: 'owl', title: { fr: 'Fourmy, le cœur', en: 'Fourmy, the core' } },
  bureau: { icon: 'calendar-check', title: { fr: 'Le bureau', en: 'The farm office' } },
  hangars: { icon: 'tractor', title: { fr: 'Le hangar', en: 'The machinery shed' } },
  elevage: { icon: 'cow', title: { fr: 'L’élevage', en: 'Livestock' } },
  parcelles: { icon: 'wheat', title: { fr: 'Les grandes cultures', en: 'Arable fields' } },
  meteo: { icon: 'cloudy', title: { fr: 'La météo', en: 'Weather' } },
  maraichage: { icon: 'seedling-solid', title: { fr: 'Le maraîchage', en: 'Market garden' } },
  vigne: { icon: 'grape', title: { fr: 'La vigne', en: 'The vineyard' } },
  cour: { icon: 'mobile', title: { fr: 'L’agriculteur', en: 'The farmer' } },
  ciel: { icon: 'database', title: { fr: 'Le ciel de données', en: 'The data sky' } },
};

export const FAMILY_COLORS: Record<string, string> = {
  territoire: '#c46a3c',
  climat: '#8ec5e8',
  intrants: '#4ed164',
  entreprises: '#f3ebd8',
  marches: '#e2b76c',
  savoirs: '#8db44f',
  filiere: '#e8a39b',
};
