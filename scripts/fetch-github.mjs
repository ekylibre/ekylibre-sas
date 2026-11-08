#!/usr/bin/env node
// B1 — Statistiques du dépôt cœur d'Ekylibre (premier commit, commits, contributeurs), depuis GitHub.
// La liste des plugins Ekylibre a été retirée (docs/design/04-accueil-kit-connecteurs.md, D32) :
// les connecteurs affichés sont ceux de src/data/connectors.yaml (Fourmy et Lyvre).
//
// Sortie : src/data/generated/stats.json
import { z } from 'zod';
import { refreshSnapshot, githubToken, fetchWithTimeout } from './lib/snapshot.mjs';

const ORG = 'ekylibre';
const CORE = 'ekylibre';

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
});

const generatedAt = new Date().toISOString();

await refreshSnapshot('src/data/generated/stats.json', StatsFileSchema, async () => {
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
  };
});

console.log('✓ statistiques du dépôt cœur');
