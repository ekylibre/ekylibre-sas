// Outils partagés des tests F1.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { Page } from '@playwright/test';
import { ROUTES, LOCALES, type Locale, type RouteKey } from '../src/i18n/routes';

export { ROUTES, LOCALES, type Locale, type RouteKey };

/** Base de déploiement (« / » ou « /ekylibre-sas/ »), toujours encadrée de barres obliques. */
export const BASE = `/${(process.env.BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
export const DIST = resolve(process.env.DIST_DIR ?? 'dist');

/** Chemin absolu sur le serveur de test, base comprise (« /contact/ » → « /ekylibre-sas/contact/ »). */
export const url = (path: string) => `${BASE}${path.replace(/^\//, '')}`;

/** Retire la base d'un chemin servi (inverse de `url`). */
export const unbase = (path: string) => (path.startsWith(BASE) ? `/${path.slice(BASE.length)}` : path);

/** Toutes les routes de la table (clé, langue, chemin sans base). */
export const ALL_ROUTES = (Object.keys(ROUTES) as RouteKey[]).flatMap((key) =>
  LOCALES.map((lang) => ({ key, lang, path: ROUTES[key][lang] as string })),
);

/** Trois actualités présentes en FR et en EN (ordre alphabétique, stable). */
export const NEWS_SAMPLES: string[] = (() => {
  const md = (dir: string) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .map((f) => f.replace(/\.md$/, ''));
  const en = new Set(md('src/content/news/en'));
  return md('src/content/news/fr')
    .filter((s) => en.has(s))
    .sort()
    .slice(0, 3);
})();

/**
 * Intégrations externes déclarées (src/data/integrations.yaml), mêmes règles que src/lib/integrations.ts.
 * INTEGRATIONS_FILE permet de tester un build fait avec un autre fichier (branche « configuré »).
 */
export const INTEGRATIONS = (() => {
  const raw = parse(readFileSync(process.env.INTEGRATIONS_FILE ?? 'src/data/integrations.yaml', 'utf8')) ?? {};
  const ga4 = /^G-[A-Z0-9]{4,}$/.test(raw.ga4 ?? '') ? (raw.ga4 as string) : null;
  const brevo = (kind: string, lang: Locale): string | null => {
    const v = raw.brevo?.[kind]?.[lang] ?? '';
    return /^https:\/\/[a-z0-9-]+\.sibforms\.com\//.test(v) ? v : null;
  };
  return { ga4, brevo };
})();

/** Le fichier de dist/ qui sert un chemin (sans base), ou null. */
export function distFile(path: string): string | null {
  const clean = decodeURI(path.split(/[?#]/)[0]!).replace(/^\//, '');
  const candidates =
    clean === '' || clean.endsWith('/')
      ? [join(DIST, clean, 'index.html')]
      : [join(DIST, clean), join(DIST, clean, 'index.html')];
  return candidates.find((c) => existsSync(c)) ?? null;
}

export interface PageWatch {
  consoleErrors: string[];
  pageErrors: string[];
  cspViolations: () => Promise<string[]>;
}

/**
 * Collecte erreurs console, exceptions et violations CSP d'une page.
 * À appeler avant `page.goto`.
 */
export async function watchPage(page: Page): Promise<PageWatch> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${msg.text()} @ ${msg.location().url}`);
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.violatedDirective} ← ${e.blockedURI || '(inline)'} @ ${e.sourceFile}:${e.lineNumber}`),
    );
  });
  return {
    consoleErrors,
    pageErrors,
    cspViolations: () => page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []),
  };
}

/** Arguments de lancement de Chromium sans WebGL (repli 2D). */
export const NO_WEBGL_ARGS = ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'];
