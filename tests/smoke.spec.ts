// F1 — Fumée : toutes les routes FR et EN, la page 404 et trois actualités par langue.
import { test, expect, type Page } from '@playwright/test';
import { ALL_ROUTES, NEWS_SAMPLES, url, watchPage } from './helpers';

async function checkPage(
  page: Page,
  path: string,
  lang: 'fr' | 'en',
  opts: { status?: number; alternates?: boolean } = {},
) {
  const watch = await watchPage(page);
  const response = await page.goto(url(path));
  expect(response?.status(), `statut HTTP de ${path}`).toBe(opts.status ?? 200);

  await expect(page.locator('html')).toHaveAttribute('lang', lang);
  await expect(page.locator('h1'), 'une et une seule <h1>').toHaveCount(1);
  expect((await page.title()).trim(), '<title> non vide').not.toBe('');
  if (opts.status === undefined) {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https?:\/\//);
    await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveCount(1);
    if (opts.alternates !== false) {
      await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    }
  }

  // Laisse les îlots (consentement, scène 3D, narration) se charger avant le bilan.
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(300);

  expect(watch.pageErrors, 'exceptions JavaScript').toEqual([]);
  const consoleErrors =
    opts.status === 404 ? watch.consoleErrors.filter((e) => !/status of 404/.test(e)) : watch.consoleErrors;
  expect(consoleErrors, 'erreurs console').toEqual([]);
  expect(await watch.cspViolations(), 'violations CSP').toEqual([]);
}

test.describe('routes', () => {
  for (const r of ALL_ROUTES) {
    test(`${r.lang} ${r.key} ${r.path}`, async ({ page }) => {
      await checkPage(page, r.path, r.lang);
    });
  }
});

test('page 404 pour une URL inconnue', async ({ page }) => {
  await checkPage(page, '/cette-page-n-existe-pas/', 'fr', { status: 404 });
  await expect(page.locator('h1')).toContainText(/n’existe pas/);
});

test.describe('actualités', () => {
  test('au moins trois articles traduits', () => {
    expect(NEWS_SAMPLES).toHaveLength(3);
  });
  for (const slug of NEWS_SAMPLES) {
    test(`fr ${slug}`, async ({ page }) => {
      await checkPage(page, `/actualites/${slug}/`, 'fr', { alternates: false });
    });
    test(`en ${slug}`, async ({ page }) => {
      await checkPage(page, `/en/news/${slug}/`, 'en', { alternates: false });
    });
  }
});

test('menu mobile : le bouton ouvre et ferme la navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile uniquement');
  await page.goto(url('/'));
  const toggle = page.locator('.nav-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#nav-principale')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-principale')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
