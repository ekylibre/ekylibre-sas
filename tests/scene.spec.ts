// F1 — Scène 3D : repli 2D pour les robots et le rendu logiciel (§8.5), interaction avec WebGL
// (?force3d : fiche InfoCard, §8.7). Repli sans WebGL : scene-no-webgl.spec.ts.
import { test, expect, type Page } from '@playwright/test';
import { url } from './helpers';

test.describe('robot ou rendu logiciel, sans ?force3d : repli 2D', () => {
  // quality.ts sert la version 2D quand navigator.webdriver est vrai ou que WebGL est logiciel
  // (Lighthouse, PageSpeed, machines sans GPU) : c'est le comportement attendu en headless.
  test('accueil', async ({ page }) => {
    await page.goto(url('/'));
    const scene = page.locator('farm-scene');
    await expect(scene).toHaveAttribute('data-state', 'fallback', { timeout: 15_000 });
    await expect(scene).toHaveAttribute('data-tier', 'none');
    await expect(page.locator('[data-story]')).toHaveAttribute('data-fallback', 'true');
    await expect(scene.locator('canvas')).toHaveCount(0);
  });

  test('interopérabilité', async ({ page }) => {
    await page.goto(url('/interoperabilite/'));
    const scene = page.locator('farm-scene');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-state', 'fallback', { timeout: 15_000 });
    await expect(page.locator('.explore-fallback')).toBeVisible();
  });
});

test.describe('avec WebGL (?force3d)', () => {
  // Les runners GitHub n'ont pas de GPU : la 3D logicielle dépasse les délais. Le repli 2D (ce que voient
  // les robots) reste testé en CI ; la scène réelle est testée en local (`npm test`).
  test.skip(!!process.env.CI, 'Scène 3D réelle : testée en local uniquement (pas de GPU en CI)');
  // ?force3d lève l'exclusion robots/rendu logiciel. Rendu logiciel (SwiftShader) en CI : chargement plus lent, d'où le délai de 30 s.
  async function waitReady(page: Page) {
    const scene = page.locator('farm-scene');
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-state', /ready|fallback/, { timeout: 30_000 });
    const state = await scene.getAttribute('data-state');
    if (state === 'fallback') {
      // Diagnostic : WebGL2 indisponible pour ce Chromium (aucun GPU ni SwiftShader).
      const tier = await scene.getAttribute('data-tier');
      throw new Error(`La scène est passée en repli (tier ${tier}) alors que WebGL est actif.`);
    }
    await expect(scene.locator('canvas').first()).toBeVisible();
  }

  async function checkInfoCard(page: Page, open: () => Promise<void>, hub: ReturnType<Page['locator']>) {
    const card = page.locator('#scene-info');
    await expect(card).toBeHidden();
    await open();
    await expect(card).toBeVisible();
    await expect(card.locator('#scene-info-title')).toHaveText('Ekylibre');
    await expect(card.locator('#scene-info-title')).toBeFocused();
    await expect(hub).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
    await expect(hub).toBeFocused();
    await expect(hub).toHaveAttribute('aria-expanded', 'false');
  }

  test('interopérabilité : clic sur le médaillon Ekylibre, fiche, Échap', async ({ page }) => {
    await page.goto(url('/interoperabilite/?force3d'));
    await waitReady(page);
    const hub = page.locator('.scene-medallion[data-zone="hub"]');
    await expect(hub).toBeVisible();
    await checkInfoCard(page, () => hub.click(), hub);
    // Le bouton de fermeture fonctionne aussi.
    await hub.click();
    await page.locator('#scene-info .scene-info__close').click();
    await expect(page.locator('#scene-info')).toBeHidden();
    await expect(hub).toBeFocused();
  });

  test('accueil : médaillon Ekylibre au clavier (la caméra tourne : pas de clic souris)', async ({ page }) => {
    await page.goto(url('/?force3d'));
    await waitReady(page);
    const hub = page.locator('.scene-medallion[data-zone="hub"]');
    await expect(hub).toHaveCount(1);
    await checkInfoCard(
      page,
      async () => {
        await hub.focus();
        await page.keyboard.press('Enter');
      },
      hub,
    );
  });
});
