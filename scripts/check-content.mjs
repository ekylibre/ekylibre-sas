#!/usr/bin/env node
// B4 — Contrôles de cohérence des contenus, exécutés avant le build (et après, avec --links).
//
//   node scripts/check-content.mjs           contenus et données (avant build)
//   node scripts/check-content.mjs --links   liens internes de dist/ (après build)
//
// Erreur  → code de sortie 1 (le build échoue).
// Avertissement → signalé, n'échoue pas (annotation ::warning:: en CI).
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { warn } from './lib/snapshot.mjs';
import { connectorErrors } from './lib/connectors.mjs';

const errors = [];
const warnings = [];
const error = (m) => errors.push(m);
const warning = (m) => warnings.push(m);

const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const yaml = async (p) => parse(await readFile(p, 'utf8'));

async function walk(dir, filter) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p, filter)));
    else if (filter(entry.name)) out.push(p);
  }
  return out;
}

async function checkContent() {
  const { datasets } = await json('src/data/generated/datasets.json');
  const scene = await json('public/3d/scene.json');
  const connectors = await yaml('src/data/connectors.yaml');
  const families = await yaml('src/data/lexicon-families.yaml');

  // Connecteurs Fourmy et Lyvre ↔ zones de la scène ; « stable » = code publié (D33)
  for (const e of connectorErrors(connectors, new Set(Object.keys(scene.zones ?? {})))) error(e);

  // Logiciels (products.yaml) ↔ logos ↔ routes (docs/design/03-outils-lyvre.md §2.2)
  const products = await yaml('src/data/products.yaml');
  const routes = await readFile('src/i18n/routes.ts', 'utf8');
  for (const p of products.products ?? []) {
    const logo = join('src/assets/brand/products', p.logo);
    if (!existsSync(logo)) error(`products.yaml : logo introuvable pour « ${p.key} » (${logo})`);
    else if (/\sstyle=/.test(await readFile(logo, 'utf8'))) warning(`${logo} : attribut style (vérifier la CSP)`);
    if (!new RegExp(`^\\s*${p.key}: \\{`, 'm').test(routes)) error(`products.yaml : « ${p.key} » n’a pas de route`);
  }

  // Jeux Lexicon ↔ familles
  const seen = new Map();
  for (const f of families) {
    for (const name of Object.keys(f.datasets ?? {})) {
      if (seen.has(name)) error(`lexicon-families.yaml : « ${name} » est dans « ${seen.get(name)} » et « ${f.id} »`);
      seen.set(name, f.id);
    }
  }
  for (const d of datasets) {
    if (!seen.has(d.name))
      error(`jeu Lexicon « ${d.name} » absent de lexicon-families.yaml (libellés FR/EN à ajouter)`);
  }
  const names = new Set(datasets.map((d) => d.name));
  for (const name of seen.keys()) {
    if (!names.has(name)) warning(`lexicon-families.yaml : « ${name} » n'existe plus dans le catalogue Lexicon`);
  }

  // Actualités : appariement FR/EN par translationKey
  const news = await walk('src/content/news', (n) => n.endsWith('.md') && !n.startsWith('_'));
  const byKey = new Map();
  for (const file of news) {
    const head = (await readFile(file, 'utf8')).match(/^---\n([\s\S]*?)\n---/)?.[1];
    if (!head) {
      error(`${file} : frontmatter absent`);
      continue;
    }
    const fm = parse(head);
    const langs = byKey.get(fm.translationKey) ?? new Set();
    langs.add(fm.lang);
    byKey.set(fm.translationKey, langs);
  }
  const untranslated = [...byKey].filter(([, l]) => !l.has('en')).length;
  if (untranslated) {
    // Les anciennes actualités peuvent rester en français seul (périmètre coupable B7).
    const msg = `${untranslated} actualité(s) sans version anglaise`;
    if (process.env.STRICT_NEWS) error(msg);
    else warning(msg);
  }

  // Redirections : chaque ancienne URL recensée a une cible, et chaque cible existe (B6)
  const legacyList = 'docs/brainstorm/anciennes-urls-ekylibre-com.txt';
  if (existsSync('src/data/redirects.yaml')) {
    const redirects = (await yaml('src/data/redirects.yaml')) ?? {};
    // Routes du nouveau site : table ROUTES de src/i18n/routes.ts + articles (/actualites/<slug>/, /en/news/<slug>/).
    const routesTs = await readFile('src/i18n/routes.ts', 'utf8');
    const block = routesTs.slice(routesTs.indexOf('export const ROUTES'), routesTs.indexOf('} as const'));
    const routes = new Set([...block.matchAll(/(?:fr|en): '([^']+)'/g)].map((m) => m[1]));
    const covered = new Set(Object.keys(redirects));
    for (const f of news) {
      const text = await readFile(f, 'utf8');
      const slug = f.split(/[\\/]/).pop().replace(/\.md$/, '');
      const lang = text.match(/^lang:\s*(\S+)/m)?.[1];
      routes.add(lang === 'en' ? `/en/news/${slug}/` : `/actualites/${slug}/`);
      const legacy = text.match(/^legacyUrl:\s*(\S+)/m)?.[1];
      if (!legacy) continue;
      if (covered.has(legacy)) error(`redirects.yaml : « ${legacy} » est aussi le legacyUrl de ${f}`);
      covered.add(legacy);
    }
    for (const [from, to] of Object.entries(redirects)) {
      if (!/^\/(.*\/)?$/.test(from)) error(`redirects.yaml : source « ${from} » (chemin absolu terminé par / attendu)`);
      if (routes.has(from)) error(`redirects.yaml : « ${from} » est une route du site, la redirection l'écraserait`);
      if (!routes.has(to)) error(`redirects.yaml : « ${from} » → cible inconnue « ${to} »`);
    }
    // Une ancienne URL est couverte par une redirection, un legacyUrl ou une route existante.
    const legacy = (await readFile(legacyList, 'utf8')).split('\n').filter(Boolean);
    const missing = legacy.filter((u) => !covered.has(u) && !routes.has(u));
    if (missing.length)
      error(`${missing.length} ancienne(s) URL sans redirection : ${missing.slice(0, 5).join(', ')}…`);
  }
}

// Prêt pour la mise en ligne ? Intégrations configurées et aucun texte « à compléter ».
// Avertissements en temps normal, erreurs avec LAUNCH=1 (recette finale, CK-5).
async function checkLaunchReadiness() {
  const report = process.env.LAUNCH ? error : warning;
  const integrations = await yaml('src/data/integrations.yaml');
  if (!/^G-[A-Z0-9]{4,}$/.test(integrations?.ga4 ?? '')) report('integrations.yaml : identifiant GA4 manquant (mesure d’audience désactivée)');
  for (const [kind, langs] of Object.entries(integrations?.brevo ?? {})) {
    for (const [lang, url] of Object.entries(langs ?? {})) {
      if (!/^https:\/\/[a-z0-9-]+\.sibforms\.com\//.test(url ?? '')) report(`integrations.yaml : formulaire Brevo « ${kind} » (${lang}) non configuré`);
    }
  }
  const files = await walk('src', (n) => /\.(astro|md|ts|yaml)$/.test(n));
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const count = (text.match(/\[À COMPLÉTER/g) ?? []).length;
    if (count) report(`${file} : ${count} mention(s) « [À COMPLÉTER] » à renseigner`);
  }
}

async function checkLinks() {
  const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
  const dist = 'dist';
  const pages = await walk(dist, (n) => n.endsWith('.html'));
  let checked = 0;
  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    for (const [, url] of html.matchAll(/\s(?:href|src)="([^"#?]+)[^"]*"/g)) {
      if (!url.startsWith(base) || url.startsWith('//')) continue;
      const path = decodeURI(url.slice(base.length));
      const target = join(dist, path);
      checked++;
      const ok = existsSync(target) && ((await stat(target)).isFile() || existsSync(join(target, 'index.html')));
      if (!ok) error(`${relative(dist, page)} → lien interne cassé : ${url}`);
    }
  }
  console.log(`  ${checked} liens internes vérifiés sur ${pages.length} pages`);
}

const mode = process.argv.includes('--links') ? 'links' : 'content';
await (mode === 'links' ? checkLinks() : Promise.all([checkContent(), checkLaunchReadiness()]));

for (const w of warnings) warn(w);
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) {
  console.error(`check-content (${mode}) : ${errors.length} erreur(s)`);
  process.exit(1);
}
console.log(`✓ check-content (${mode}) : aucune erreur, ${warnings.length} avertissement(s)`);
