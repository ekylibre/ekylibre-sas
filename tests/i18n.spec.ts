// F1 — Sélecteur de langue : sur chaque route, le lien pointe vers la route traduite (table ROUTES)
// et mène à une page dans l'autre langue.
import { test, expect } from '@playwright/test';
import { ALL_ROUTES, NEWS_SAMPLES, ROUTES, url } from './helpers';

for (const r of ALL_ROUTES) {
  const other = r.lang === 'fr' ? 'en' : 'fr';
  const expected = url(ROUTES[r.key][other]);
  test(`${r.lang} ${r.key} → ${expected}`, async ({ page }) => {
    await page.goto(url(r.path));
    const link = page.locator(`header a[hreflang="${other}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', expected);
    await expect(link).toHaveAttribute('lang', other);
    // La page traduite existe et déclare la bonne langue.
    const response = await page.request.get(expected);
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(new RegExp(`<html[^>]*lang="${other}"`));
  });
}

// Un article traduit : le sélecteur mène à l'article dans l'autre langue (même translationKey),
// et la page déclare les deux versions en hreflang.
test('le sélecteur d’un article mène à l’article traduit', async ({ page }) => {
  const slug = NEWS_SAMPLES[0]!;
  for (const [from, other, article] of [
    [`/actualites/${slug}/`, 'en', `/en/news/${slug}/`],
    [`/en/news/${slug}/`, 'fr', `/actualites/${slug}/`],
  ] as const) {
    await page.goto(url(from));
    const link = page.locator(`header a[hreflang="${other}"]`);
    await expect(link).toHaveAttribute('href', url(article));
    await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveCount(1);
    await link.click();
    await expect(page.locator('html')).toHaveAttribute('lang', other);
    await expect(page).toHaveURL(new RegExp(`${url(article).replace(/[/.]/g, '\\$&')}$`));
  }
});
