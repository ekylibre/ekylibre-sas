// Collections de contenu (docs/design/02-architecture.md §4).
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

const i18n = z.object({ fr: z.string().min(1), en: z.string().min(1) });

export const CATEGORIES = [
  'machines',
  'meteo',
  'elevage',
  'vigne',
  'finance',
  'gestion',
  'durabilite',
  'terrain',
] as const;

const connectors = defineCollection({
  // L'identifiant de chaque entrée est le slug du plugin (dépôt ekylibre-<slug>).
  loader: file('src/data/connectors.yaml', {
    parser: (text) => (parse(text) as Array<{ slug: string }>).map((entry) => ({ id: entry.slug, ...entry })),
  }),
  schema: z.object({
    slug: z.string(),
    category: z.enum(CATEGORIES),
    zone: z.string(),
    dataFlow: z.enum(['in', 'out', 'both']),
    partner: z.object({ name: z.string(), url: z.url().optional() }).optional(),
    title: i18n,
    summary: i18n,
  }),
});

const families = defineCollection({
  loader: file('src/data/lexicon-families.yaml'),
  schema: z.object({
    id: z.enum(['territoire', 'climat', 'intrants', 'entreprises', 'marches', 'savoirs', 'filiere']),
    icon: z.string(),
    title: i18n,
    datasets: z.record(z.string(), i18n),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*'], base: 'src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      dateApprox: z.boolean().default(false),
      lang: z.enum(['fr', 'en']),
      translationKey: z.string(),
      summary: z.string().default(''),
      cover: image().optional(),
      legacyUrl: z.string().optional(),
      tags: z.array(z.string()).default([]),
      source: z.string().optional(),
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/legal' }),
  schema: z.object({
    title: z.string(),
    lang: z.enum(['fr', 'en']),
    routeKey: z.enum(['legal', 'terms', 'privacy', 'cookies']),
    description: z.string(),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = { connectors, families, news, legal };
