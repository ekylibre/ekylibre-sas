#!/usr/bin/env node
// F6 — Vérification du site en production après la bascule DNS.
// Usage : node scripts/verify-production.mjs [https://ekylibre.com]
// Également utilisable sur la recette : node scripts/verify-production.mjs https://ekylibre.org/ekylibre-sas
import { readFile } from 'node:fs/promises';

const ORIGIN = (process.argv[2] ?? 'https://ekylibre.com').replace(/\/$/, '');
const production = new URL(ORIGIN).hostname === 'ekylibre.com';
const results = [];
const check = (ok, label, detail = '') => results.push({ ok, label, detail });

async function get(path, init = {}) {
  return fetch(`${ORIGIN}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(20_000), ...init });
}

// 1. Pages principales FR/EN
const pages = ['/', '/en/', '/interoperabilite/', '/en/interoperability/', '/ekylibre/', '/lexicon/', '/aiffel/', '/services/',
  '/developpeurs/', '/entreprise/', '/actualites/', '/contact/', '/mentions-legales/', '/terms-of-use/', '/confidentialite/', '/cookies/'];
for (const path of pages) {
  const res = await get(path);
  const html = res.status === 200 ? await res.text() : '';
  check(res.status === 200, `GET ${path}`, String(res.status));
  if (path === '/' && html) {
    check(!/name="robots" content="noindex"/.test(html) === production, 'Indexation conforme (noindex seulement hors ekylibre.com)');
    check(/http-equiv="content-security-policy"/.test(html), 'CSP présente');
    const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    if (og) check((await fetch(og)).ok, 'Image de partage accessible', og);
    check(html.includes(`<link rel="canonical" href="${ORIGIN}/"`), 'URL canonique de l’accueil');
  }
}

// 2. Fichiers techniques
for (const path of ['/robots.txt', '/sitemap-index.xml', '/3d/hero.glb', '/icons/agric.svg', '/404.html']) {
  const res = await get(path);
  check(res.ok, `GET ${path}`, String(res.status));
}

// 3. HTTPS et www (production uniquement)
if (production) {
  try {
    const http = await fetch('http://ekylibre.com/', { redirect: 'manual' });
    check([301, 308].includes(http.status) && http.headers.get('location')?.startsWith('https://'), 'http → https', String(http.status));
  } catch (e) {
    check(false, 'http → https', e.message);
  }
  try {
    const www = await fetch('https://www.ekylibre.com/', { redirect: 'manual' });
    check([301, 308].includes(www.status) && /^https:\/\/ekylibre\.com\/?/.test(www.headers.get('location') ?? ''), 'www → apex', `${www.status} ${www.headers.get('location')}`);
  } catch (e) {
    check(false, 'www → apex', e.message);
  }
}

// 4. Anciennes URL : chaque page de redirection répond et pointe vers une page existante
const legacy = (await readFile('docs/brainstorm/anciennes-urls-ekylibre-com.txt', 'utf8')).split('\n').filter(Boolean);
let broken = 0;
for (const path of legacy) {
  const res = await get(path);
  if (res.status !== 200) {
    broken++;
    check(false, `Ancienne URL ${path}`, String(res.status));
    continue;
  }
  const html = await res.text();
  const target = html.match(/http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
  if (target) {
    const final = await fetch(new URL(target, ORIGIN), { redirect: 'manual' });
    if (final.status !== 200) {
      broken++;
      check(false, `Redirection ${path} → ${target}`, String(final.status));
    }
  }
}
check(broken === 0, `${legacy.length} anciennes URL`, broken ? `${broken} en erreur` : 'toutes servies');

for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} contrôle(s) en échec` : '\nTous les contrôles passent');
process.exit(failed ? 1 : 0);
