#!/usr/bin/env node
// B2 — Catalogue des jeux de données du Lexicon (lexicon.osfarm.org/catalog.json).
// Sortie : src/data/generated/datasets.json
import { z } from 'zod';
import { refreshSnapshot, fetchWithTimeout } from './lib/snapshot.mjs';

const CATALOG = process.env.LEXICON_CATALOG_URL || 'https://lexicon.osfarm.org/catalog.json';
const BASE = 'https://lexicon.osfarm.org';

const RawDataset = z.object({
  name: z.string(),
  provider: z.string().nullable().optional(),
  licence: z.string().nullable().optional(),
  'licence-url': z.string().nullable().optional(),
  scope: z.string(),
  rows: z.number().int().nonnegative(),
  'source-date': z.string().nullable().optional(),
  'source-url': z.string().nullable().optional(),
  version: z.string(),
  href: z.string(),
});
// Attention : `items-count` du catalogue compte les jeux de données, pas les lignes.
const RawCatalog = z.object({ datasets: z.array(RawDataset).min(1) });

const Dataset = z.object({
  name: z.string(),
  provider: z.string(),
  licence: z.string(),
  licenceUrl: z.string().optional(),
  scope: z.enum(['open', 'members']),
  rows: z.number().int().nonnegative(),
  sourceDate: z.string().optional(),
  sourceUrl: z.string().optional(),
  version: z.string(),
  href: z.url(),
});
const DatasetsFile = z.object({
  generatedAt: z.string(),
  source: z.url(),
  totalRows: z.number().int().positive(),
  providers: z.number().int().positive(),
  byEkylibre: z.number().int().nonnegative(),
  datasets: z.array(Dataset).min(1),
});

const optional = (v) => (v ? v : undefined);

const result = await refreshSnapshot('src/data/generated/datasets.json', DatasetsFile, async () => {
  const raw = RawCatalog.parse(await (await fetchWithTimeout(CATALOG)).json());
  const datasets = raw.datasets
    .map((d) => ({
      name: d.name,
      provider: d.provider?.trim() || 'OSFarm',
      licence: d.licence?.trim() || 'non indiquée',
      licenceUrl: optional(d['licence-url']),
      // Le catalogue indique « open » pour l'accès libre ; tout autre périmètre est réservé aux adhérents OSFarm.
      scope: d.scope === 'open' ? 'open' : 'members',
      rows: d.rows,
      sourceDate: optional(d['source-date']),
      sourceUrl: optional(d['source-url']),
      version: d.version,
      href: new URL(d.href, BASE).href,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    generatedAt: new Date().toISOString(),
    source: CATALOG,
    totalRows: datasets.reduce((sum, d) => sum + d.rows, 0),
    providers: new Set(datasets.map((d) => d.provider)).size,
    byEkylibre: datasets.filter((d) => /ekylibre/i.test(d.provider)).length,
    datasets,
  };
});

if (result)
  console.log(
    `✓ Lexicon : ${result.datasets.length} jeux, ${result.totalRows.toLocaleString('fr-FR')} lignes, ${result.providers} fournisseurs`,
  );
