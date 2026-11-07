#!/usr/bin/env node
// D9 — Images de partage (OpenGraph, 1200 × 630) : une par route et par langue.
// Gabarit HTML rendu par Playwright (polices du site, photo de La Vauzelle, logo) → public/og/<route>-<lang>.jpg
// Usage : node scripts/og-images.mjs   (relancer si les titres ou la charte changent ; fichiers commités)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const OUT = 'public/og';
const file = (p) => pathToFileURL(resolve(p)).href;

// Titres et accroches (repris de src/i18n/ui.ts ROUTE_TITLES et des pages).
const PAGES = {
  home: {
    fr: ['Le système d’information agricole interopérable', 'Machines, capteurs, banque, filières, données publiques : tout est relié.'],
    en: ['The interoperable farm information system', 'Machinery, sensors, banking, supply chains, public data: all connected.'],
  },
  interop: {
    fr: ['Interopérabilité', 'La ferme connectée à tout son écosystème'],
    en: ['Interoperability', 'The farm connected to its whole ecosystem'],
  },
  fourmy: {
    fr: ['Fourmy', 'Le jumeau numérique de la ferme, nouvelle génération d’Ekylibre'],
    en: ['Fourmy', 'The farm’s digital twin, the next generation of Ekylibre'],
  },
  lexicon: {
    fr: ['Lexicon', 'Les données publiques agricoles françaises, reliées'],
    en: ['Lexicon', 'French public agricultural data, linked together'],
  },
  aiffel: {
    fr: ['Aiffel', 'Dites-le une fois. Aiffel le range au bon endroit.'],
    en: ['Aiffel', 'Say it once. Aiffel files it in the right place.'],
  },
  lyvre: {
    fr: ['Lyvre', 'La comptabilité libre, sobre et souveraine'],
    en: ['Lyvre', 'Free, frugal, self-hosted accounting'],
  },
  services: {
    fr: ['Services', 'Intégration, formation, connecteurs, support'],
    en: ['Services', 'Integration, training, connectors, support'],
  },
  developers: {
    fr: ['Développeurs', 'API, connecteurs, MCP : construire avec Ekylibre'],
    en: ['Developers', 'APIs, connectors, MCP: build with Ekylibre'],
  },
  company: {
    fr: ['Entreprise', 'Des logiciels libres, au service de ceux qui cultivent'],
    en: ['Company', 'Free software, serving those who farm'],
  },
  news: { fr: ['Actualités', 'Les nouvelles d’Ekylibre'], en: ['News', 'News from Ekylibre'] },
  contact: {
    fr: ['Contact', 'Voyons Ekylibre sur vos données'],
    en: ['Contact', 'Let’s see Ekylibre on your data'],
  },
  legal: { fr: ['Mentions légales', 'Ekylibre SAS'], en: ['Legal notice', 'Ekylibre SAS'] },
  terms: { fr: ['Conditions d’utilisation', 'Ekylibre SAS'], en: ['Terms of use', 'Ekylibre SAS'] },
  privacy: { fr: ['Confidentialité', 'Ekylibre SAS'], en: ['Privacy', 'Ekylibre SAS'] },
  cookies: { fr: ['Cookies', 'Ekylibre SAS'], en: ['Cookies', 'Ekylibre SAS'] },
};

const logo = (await readFile('src/assets/brand/ekylibre-logo.svg', 'utf8')).replace('<svg ', '<svg class="logo" ');
const photo = file('src/assets/images/la-vauzelle-drone.jpg');
const fonts = `
  @font-face { font-family: M; font-weight: 700; src: url(${file('node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2')}); }
  @font-face { font-family: I; font-weight: 100 900; src: url(${file('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}); }
  @font-face { font-family: J; font-weight: 100 800; src: url(${file('node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')}); }`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = (title, tagline, eyebrow) => `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fonts}
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #07140e url(${photo}) 70% 40% / cover; color: #faf6ec; font-family: I, sans-serif; }
  .veil { position: absolute; inset: 0; background: linear-gradient(100deg, rgb(7 20 14 / .96) 0%, rgb(7 20 14 / .82) 45%, rgb(7 20 14 / .2) 100%); }
  .wrap { position: absolute; inset: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
  .logo { height: 64px; width: 150px; align-self: flex-start; color: #faf6ec; }
  .eyebrow { font-family: J, monospace; font-size: 18px; letter-spacing: .18em; text-transform: uppercase; color: #4ed164; }
  h1 { font-family: M, sans-serif; font-weight: 700; font-size: ${title.length > 34 ? 64 : 84}px; line-height: 1.05; letter-spacing: -.01em; max-width: 860px; margin-top: 16px; }
  p { font-size: 28px; color: rgb(250 246 236 / .82); max-width: 760px; margin-top: 22px; line-height: 1.35; }
  .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: linear-gradient(90deg, #00c15d, #4ed164 60%, #e2b76c); }
</style></head><body><div class="veil"></div><div class="wrap">${logo}
  <div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(tagline)}</p></div></div><div class="bar"></div></body></html>`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
let count = 0;
for (const [route, langs] of Object.entries(PAGES)) {
  for (const [lang, [title, tagline]] of Object.entries(langs)) {
    const eyebrow = route === 'home' ? 'FarmLab La Vauzelle' : 'ekylibre.com';
    // Fichier temporaire : une page servie en file:// peut charger la photo et les polices locales.
    const tmp = join(tmpdir(), `og-${route}-${lang}.html`);
    await writeFile(tmp, html(title, tagline, eyebrow));
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: 'png' });
    await writeFile(`${OUT}/${route}-${lang}.jpg`, await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
    count++;
  }
}
await browser.close();
console.log(`✓ ${count} images OpenGraph → ${OUT}/`);
