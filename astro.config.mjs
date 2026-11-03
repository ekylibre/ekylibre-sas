// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

// SITE_URL et BASE_PATH sont fournis par le workflow GitHub Pages (actions/configure-pages) :
// - avant la bascule DNS : https://ekylibre.github.io + /ekylibre-sas/
// - après la bascule     : https://ekylibre.com + /
const site = process.env.SITE_URL || 'https://ekylibre.com';
const base = process.env.BASE_PATH || '/';

// B6 — Redirections des anciennes URL (pages statiques meta refresh, ADR-7) :
// src/data/redirects.yaml + anciens articles repris (champ legacyUrl → /actualites/<slug>/).
// Les cibles sont écrites sans base ; on la préfixe ici (Astro ne le fait pas pour les redirections).
function legacyRedirects() {
  /** @type {Record<string, string>} */
  const map = { ...parse(readFileSync('src/data/redirects.yaml', 'utf8')) };
  const dir = 'src/content/news/fr';
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue;
    const legacy = readFileSync(`${dir}/${file}`, 'utf8').match(/^legacyUrl:\s*(\S+)/m)?.[1];
    if (legacy) map[legacy] = `/actualites/${file.replace(/\.md$/, '')}/`;
  }
  const prefix = base.replace(/\/$/, '');
  return Object.fromEntries(Object.entries(map).map(([from, to]) => [from, `${prefix}${to}`]));
}
const redirects = legacyRedirects();

/**
 * Liens des contenus Markdown (anciennes actualités) : les liens internes absolus reçoivent la base
 * de déploiement (sinon ils cassent en recette sous /ekylibre-sas/), les liens externes s'ouvrent
 * dans un nouvel onglet avec rel="noopener".
 */
function rehypeSiteLinks() {
  const prefix = base.replace(/\/$/, '');
  /** @param {any} node */
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'a' && typeof node.properties?.href === 'string') {
      const href = node.properties.href;
      if (href.startsWith('/') && !href.startsWith('//')) {
        if (prefix && !href.startsWith(`${prefix}/`)) node.properties.href = `${prefix}${href}`;
      } else if (/^https?:\/\//.test(href)) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener'];
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  return (/** @type {any} */ tree) => visit(tree);
}
const redirectSources = new Set(Object.keys(redirects));

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  redirects,

  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-GB' } },
      filter: (page) => {
        const path = new URL(page).pathname.slice(base.replace(/\/$/, '').length);
        return !page.includes('/design-system/') && !redirectSources.has(path);
      },
    }),
  ],

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      options: {
        variants: [
          { src: ['@fontsource/montserrat/files/montserrat-latin-600-normal.woff2'], weight: 600, style: 'normal' },
          { src: ['@fontsource/montserrat/files/montserrat-latin-700-normal.woff2'], weight: 700, style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['system-ui', 'Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
          },
          {
            src: ['@fontsource-variable/inter/files/inter-latin-wght-italic.woff2'],
            weight: '100 900',
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains',
      fallbacks: ['ui-monospace', 'Menlo', 'monospace'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'],
            weight: '100 800',
            style: 'normal',
          },
        ],
      },
    },
  ],

  markdown: { rehypePlugins: [rehypeSiteLinks] },

  vite: {
    plugins: [tailwindcss()],
  },
});
