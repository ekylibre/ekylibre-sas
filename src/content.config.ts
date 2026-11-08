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

export const CONNECTOR_PRODUCTS = ['fourmy', 'lyvre'] as const;
export const CONNECTOR_STATUSES = ['stable', 'en-cours'] as const;

const connectors = defineCollection({
  // Intégrations de Fourmy et de Lyvre (docs/design/04-accueil-kit-connecteurs.md §4.1).
  // Les règles croisées (zone, source) sont dans scripts/lib/connectors.mjs.
  loader: file('src/data/connectors.yaml', {
    // `order` : rang dans le fichier (getCollection trie par identifiant ; l'ordre éditorial compte).
    parser: (text) =>
      (parse(text) as Array<{ slug: string }>).map((entry, order) => ({ id: entry.slug, ...entry, order })),
  }),
  schema: z
    .object({
      slug: z.string(),
      order: z.number().int(),
      product: z.enum(CONNECTOR_PRODUCTS),
      status: z.enum(CONNECTOR_STATUSES),
      category: z.enum(CATEGORIES),
      zone: z.string().optional(),
      dataFlow: z.enum(['in', 'out', 'both']),
      partner: z.object({ name: z.string(), url: z.url().optional() }).optional(),
      title: i18n,
      summary: i18n,
      source: z.string().optional(),
    })
    .refine((c) => (c.product === 'fourmy') === (c.zone !== undefined), {
      message: 'zone obligatoire pour Fourmy, interdite pour Lyvre',
    })
    .refine((c) => c.status !== 'stable' || c.source !== undefined, {
      message: 'un connecteur stable doit indiquer sa source',
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
