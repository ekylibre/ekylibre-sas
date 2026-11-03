// F1 — Repli 2D sans WebGL (§8.5) : Chromium lancé avec WebGL désactivé. ?force3d lève l'exclusion
// robots/rendu logiciel : le repli observé est donc bien dû à l'absence de WebGL.
import { test, expect } from '@playwright/test';
import { NO_WEBGL_ARGS, url } from './helpers';

test.use({ launchOptions: { args: NO_WEBGL_ARGS } });

test.describe('sans WebGL : repli 2D', () => {
  for (const [lang, path] of [
    ['fr', '/'],
    ['en', '/en/'],
  ] as const) {
    test(`accueil ${lang}`, async ({ page }) => {
      await page.addInitScript(() =>
        document.addEventListener('eky:fallback', (e) => {
          (window as unknown as { __reason: string }).__reason = (e as CustomEvent<{ reason: string }>).detail.reason;
        }),
      );
      await page.goto(url(`${path}?force3d`));
      await expect(page.locator('farm-scene')).toHaveAttribute('data-state', 'fallback', { timeout: 15_000 });
      await expect(page.locator('farm-scene')).toHaveAttribute('data-tier', 'none');
      expect(await page.evaluate(() => (window as unknown as { __reason?: string }).__reason)).toBe('no-webgl2');
      await expect(page.locator('[data-story]')).toHaveAttribute('data-fallback', 'true');
      await expect(page.locator('farm-scene canvas')).toHaveCount(0);
      const fallback = page.locator('.fallback-only');
      await fallback.scrollIntoViewIfNeeded();
      await expect(fallback).toBeVisible();
      // La photo d'attente reste affichée sous la scène.
      await expect(page.locator('.story-stage img').first()).toBeVisible();
    });
  }

  for (const [lang, path] of [
    ['fr', '/interoperabilite/'],
    ['en', '/en/interoperability/'],
  ] as const) {
    test(`interopérabilité ${lang}`, async ({ page }) => {
      await page.goto(url(`${path}?force3d`));
      const scene = page.locator('farm-scene');
      await scene.scrollIntoViewIfNeeded();
      await expect(scene).toHaveAttribute('data-state', 'fallback', { timeout: 15_000 });
      await expect(page.locator('.explore-fallback')).toBeVisible();
      await expect(page.locator('.explore-controls')).toBeHidden();
    });
  }
});
