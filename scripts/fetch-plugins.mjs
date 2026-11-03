#!/usr/bin/env node
// B1 — Plugins stables et statistiques du dépôt cœur, depuis l'organisation GitHub `ekylibre`.
//
// Règle de stabilité (décision D9) : dépôt `ekylibre-*`, non archivé, actif depuis
// ACTIVE_SINCE, qui n'est pas un outil technique (EXCLUDED) et qui a publié au moins un tag.
//
// Sorties : src/data/generated/plugins.json, src/data/generated/stats.json
import { z } from 'zod';
import { refreshSnapshot, githubToken, fetchWithTimeout } from './lib/snapshot.mjs';

const ORG = 'ekylibre';
const CORE = 'ekylibre';
const ACTIVE_SINCE = '2023-01-01';
// Dépôts `ekylibre-*` qui ne sont pas des plugins fonctionnels.
const EXCLUDED = new Set([
  'ekylibre-sas',
  'ekylibre-cli',
  'ekylibre-doc',
  'ekylibre-website',
  'ekylibre-indicators',
  'ekylibre-multitenancy',
  'ekylibre-saassy',
  'ekylibre-duke',
]);

const token = githubToken();
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'ekylibre-sas-site-build',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};
const api = (path, init) => fetchWithTimeout(`https://api.github.com${path}`, { headers, ...init });
const json = async (path) => (await api(path)).json();

/** Nombre total d'éléments d'une liste paginée, lu dans l'en-tête Link (per_page=1). */
async function countViaLink(path) {
  const res = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=1`);
  const last = res.headers.get('link')?.match(/[?&]page=(\d+)>; rel="last"/);
  if (last) return Number(last[1]);
  return (await res.json()).length;
}

async function listRepos() {
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = await json(`/orgs/${ORG}/repos?per_page=100&page=${page}&type=public`);
    repos.push(...batch);
    if (batch.length < 100) return repos;
  }
}

const semverish = (a, b) => b.localeCompare(a, 'en', { numeric: true });

async function readmeSummary(repo) {
  try {
    const res = await api(`/repos/${ORG}/${repo}/readme`, {
      headers: { ...headers, Accept: 'application/vnd.github.raw' },
    });
    const text = await res.text();
    const line = text
      .split('\n')
      .map((l) => l.trim())
      .find(
        (l) =>
          l &&
          !/^(#|=|!\[|\[!|<|```|-{3,}|\|)/.test(l) &&
          !/MIT-LICENSE|rocks|^(add|create|this (project|sub-project)|you need|see )/i.test(l),
      );
    return (line ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 280);
  } catch {
    return '';
  }
}

const PluginSchema = z.object({
  repo: z.string(),
  slug: z.string(),
  latestTag: z.string(),
  pushedAt: z.string(),
  commits: z.number().int().nonnegative(),
  license: z.string().nullable(),
  url: z.url(),
  readmeSummary: z.string(),
});
const PluginsFileSchema = z.object({
  generatedAt: z.string(),
  rule: z.string(),
  plugins: z.array(PluginSchema).min(1),
});
const StatsFileSchema = z.object({
  generatedAt: z.string(),
  core: z.object({
    repo: z.string(),
    firstCommit: z.string(),
    commits: z.number().int().positive(),
    contributors: z.number().int().positive(),
    stars: z.number().int().nonnegative(),
    forks: z.number().int().nonnegative(),
  }),
  stablePlugins: z.number().int().nonnegative(),
});

const generatedAt = new Date().toISOString();
let pluginCount = null;

await refreshSnapshot('src/data/generated/plugins.json', PluginsFileSchema, async () => {
  const repos = await listRepos();
  const candidates = repos.filter(
    (r) => r.name.startsWith('ekylibre-') && !r.archived && !EXCLUDED.has(r.name) && r.pushed_at >= ACTIVE_SINCE,
  );
  const plugins = [];
  for (const r of candidates) {
    const tags = (await json(`/repos/${ORG}/${r.name}/tags?per_page=100`)).map((t) => t.name).sort(semverish);
    if (tags.length === 0) continue;
    plugins.push({
      repo: r.name,
      slug: r.name.replace(/^ekylibre-/, ''),
      latestTag: tags[0],
      pushedAt: r.pushed_at,
      commits: await countViaLink(`/repos/${ORG}/${r.name}/commits`),
      license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
      url: r.html_url,
      readmeSummary: await readmeSummary(r.name),
    });
  }
  plugins.sort((a, b) => a.slug.localeCompare(b.slug));
  pluginCount = plugins.length;
  return {
    generatedAt,
    rule: `ekylibre-*, non archivé, actif depuis ${ACTIVE_SINCE}, au moins un tag publié`,
    plugins,
  };
});

await refreshSnapshot('src/data/generated/stats.json', StatsFileSchema, async () => {
  if (pluginCount === null) throw new Error('liste des plugins indisponible');
  const core = await json(`/repos/${ORG}/${CORE}`);
  const commits = await countViaLink(`/repos/${ORG}/${CORE}/commits`);
  const [first] = await json(`/repos/${ORG}/${CORE}/commits?per_page=1&page=${commits}`);
  return {
    generatedAt,
    core: {
      repo: `${ORG}/${CORE}`,
      firstCommit: first.commit.author.date,
      commits,
      contributors: await countViaLink(`/repos/${ORG}/${CORE}/contributors`),
      stars: core.stargazers_count,
      forks: core.forks_count,
    },
    stablePlugins: pluginCount,
  };
});

console.log(`✓ plugins stables : ${pluginCount ?? '(instantané conservé)'}`);
