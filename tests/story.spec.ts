// F1 — Narration de l'accueil (§8.6) : chaque chapitre [data-chapter] émet `eky:chapter` au défilement.
import { test, expect } from '@playwright/test';
import { url } from './helpers';

// ?force3d : la scène 3D réelle écoute les chapitres (sans lui, repli 2D en headless).
for (const [lang, path] of [
  ['fr', '/?force3d'],
  ['en', '/en/?force3d'],
] as const) {
  test(`chapitres de l'accueil ${lang}`, async ({ page }) => {
    test.skip(!!process.env.CI, 'Scène 3D réelle : testée en local uniquement (pas de GPU en CI)');
    await page.addInitScript(() => {
      const w = window as unknown as { __chapters: string[] };
      w.__chapters = [];
      document.addEventListener('eky:chapter', (e) => w.__chapters.push((e as CustomEvent<{ id: string }>).detail.id));
    });
    await page.goto(url(path));
    const ids = await page
      .locator('[data-story] [data-chapter]')
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.chapter!));
    expect(ids).toEqual(['ouverture', 'champs', 'elevage', 'vigne', 'bureau', 'ciel', 'voix', 'synthese']);

    // Le premier chapitre est actif dès le chargement (ScrollTrigger initialisé à l'inactivité).
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __chapters: string[] }).__chapters), { timeout: 10_000 })
      .toContain('ouverture');

    for (const id of ids.slice(1)) {
      // Amène le haut du chapitre à 40 % de la fenêtre (déclencheur : « top 55% »).
      await page.evaluate((chapter) => {
        const el = document.querySelector<HTMLElement>(`[data-story] [data-chapter="${chapter}"]`)!;
        const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4;
        window.scrollTo({ top, behavior: 'instant' });
      }, id);
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __chapters: string[] }).__chapters.at(-1)), {
          message: `eky:chapter « ${id} »`,
          timeout: 5_000,
        })
        .toBe(id);
      await expect(page.locator('[data-story]')).toHaveAttribute('data-chapter', id);
    }

    // Retour en haut : le premier chapitre est réémis.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __chapters: string[] }).__chapters.at(-1)))
      .toBe('ouverture');
  });
}

// Accueil aligné sur Fourmy (docs/brainstorm/04, critères d'acceptation §5) : plus aucun ancien nom,
// ni dans le récit ni dans les données de la scène (médaillons construits côté client).
for (const [lang, path] of [
  ['fr', '/'],
  ['en', '/en/'],
] as const) {
  test(`accueil ${lang} : récit en 7 chapitres, sans les anciens noms`, async ({ page }) => {
    await page.goto(url(path));
    const eyebrows = await page.locator('[data-story] [data-chapter] .eyebrow').allTextContents();
    expect(eyebrows.filter((t) => /^\d · /.test(t.trim()))).toHaveLength(7);
    const html = await page.content();
    for (const name of ['Ekyviti', 'Nordigen', 'Samsys', 'La vigne et le chai', 'Vineyard and cellar', 'EDNotif', 'Hajimari']) {
      expect(html, name).not.toContain(name);
    }
  });
}
