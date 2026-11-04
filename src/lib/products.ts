// Les logiciels édités par Ekylibre SAS (src/data/products.yaml), validés au build.
// docs/design/03-outils-lyvre.md §2.
import { parse } from 'yaml';
import { z } from 'astro/zod';
import type { ImageMetadata } from 'astro';
import raw from '~/data/products.yaml?raw';
import type { Locale } from '~/i18n/routes';

export const PRODUCT_KEYS = ['ekylibre', 'lexicon', 'aiffel', 'lyvre'] as const;
export type ProductKey = (typeof PRODUCT_KEYS)[number];
export const STATUSES = ['service', 'en-cours', 'beta'] as const;
export type Status = (typeof STATUSES)[number];

const i18n = z.object({ fr: z.string().min(1), en: z.string().min(1) });
const i18nList = z.object({ fr: z.array(z.string().min(1)).min(1), en: z.array(z.string().min(1)).min(1) });

const schema = z.object({
  products: z
    .array(
      z.object({
        key: z.enum(PRODUCT_KEYS),
        name: z.string(),
        logo: z.string(),
        status: z.enum(STATUSES),
        subStatus: i18n.optional(),
        steward: z.string().optional(),
        role: i18n,
        tagline: i18n,
        summary: i18n,
        points: i18nList,
        links: z.object({ site: z.url(), code: z.url().optional() }),
      }),
    )
    .length(PRODUCT_KEYS.length),
  flows: z.array(
    z.object({
      from: z.enum([...PRODUCT_KEYS, 'farmer']),
      to: z.enum(PRODUCT_KEYS),
      status: z.enum(STATUSES),
      label: i18n,
    }),
  ),
});

const data = schema.parse(parse(raw));

const logos = import.meta.glob<{ default: ImageMetadata }>('~/assets/brand/products/*.svg', { eager: true });
function logoFor(file: string): ImageMetadata {
  const entry = Object.entries(logos).find(([path]) => path.endsWith(`/${file}`));
  if (!entry) throw new Error(`products.yaml : logo introuvable (${file})`);
  return entry[1].default;
}

export interface Product {
  key: ProductKey;
  name: string;
  logo: ImageMetadata;
  status: Status;
  subStatus?: string;
  steward?: string;
  role: string;
  tagline: string;
  summary: string;
  points: string[];
  links: { site: string; code?: string };
}

export interface Flow {
  from: ProductKey | 'farmer';
  to: ProductKey;
  status: Status;
  label: string;
}

/** Les quatre logiciels, dans l'ordre de présentation. */
export function getProducts(lang: Locale): Product[] {
  return data.products.map((p) => ({
    key: p.key,
    name: p.name,
    logo: logoFor(p.logo),
    status: p.status,
    ...(p.subStatus ? { subStatus: p.subStatus[lang] } : {}),
    ...(p.steward ? { steward: p.steward } : {}),
    role: p.role[lang],
    tagline: p.tagline[lang],
    summary: p.summary[lang],
    points: p.points[lang],
    links: { site: p.links.site, ...(p.links.code ? { code: p.links.code } : {}) },
  }));
}

export function getProduct(key: ProductKey, lang: Locale): Product {
  return getProducts(lang).find((p) => p.key === key)!;
}

/** Flux entre logiciels ; avec `focus`, seulement ceux qui touchent ce logiciel. */
export function getFlows(lang: Locale, focus?: ProductKey): Flow[] {
  return data.flows
    .filter((f) => !focus || f.from === focus || f.to === focus)
    .map((f) => ({ from: f.from, to: f.to, status: f.status, label: f.label[lang] }));
}

export const STATUS_LABEL: Record<Status, Record<Locale, string>> = {
  service: { fr: 'En service', en: 'In service' },
  'en-cours': { fr: 'En cours', en: 'In progress' },
  beta: { fr: 'Bêta', en: 'Beta' },
};
