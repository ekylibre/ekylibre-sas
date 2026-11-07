// Logiciels de l'accueil (docs/design/03-outils-lyvre.md §10) : logos réels, schéma du système
// (souris, clavier), récit à onglets (ARIA, flèches), mouvement réduit.
import { test, expect } from '@playwright/test';
import { url } from './helpers';

const NAMES = ['Fourmy', 'Lexicon', 'Aiffel', 'Lyvre'];

test('les quatre logos officiels sont servis', async ({ page }) => {
  await page.goto(url('/'));
  for (const key of ['fourmy', 'lexicon', 'aiffel', 'lyvre']) {
    const img = page.locator(`[data-system] .product-logo[data-product="${key}"] img`);
    await expect(img).toHaveCount(1);
    const src = await img.getAttribute('src');
    expect((await page.request.get(src!)).ok()).toBe(true);
  }
});

test('schéma : au clavier, Lyvre affiche ses trois flux en cours', async ({ page }) => {
  await page.goto(url('/'));
  const system = page.locator('[data-system]');
  await expect(system).toHaveAttribute('data-active', 'aiffel');
  await page.locator('.system-button[data-key="lyvre"]').focus();
  await expect(system).toHaveAttribute('data-active', 'lyvre');
  await expect(page.locator('.system-button[data-key="lyvre"]')).toHaveAttribute('aria-pressed', 'true');
  const panel = page.locator('#system-panel-lyvre');
  await expect(panel).toBeVisible();
  await expect(page.locator('#system-panel-aiffel')).toBeHidden();
  await expect(panel.locator('li')).toHaveCount(3);
  await expect(panel.getByText('(en cours)')).toHaveCount(3);
});

test('récit : les flèches changent d’onglet et de panneau', async ({ page }) => {
  await page.goto(url('/'));
  const tabs = page.getByRole('tablist', { name: 'Nos logiciels' }).getByRole('tab');
  await expect(tabs).toHaveText(NAMES.map((n, i) => new RegExp(`0${i + 1} ${n}`)));
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.locator('#tool-lexicon')).toBeVisible();
  await expect(page.locator('#tool-fourmy')).toBeHidden();
  await page.keyboard.press('End');
  await expect(page.locator('#tool-lyvre')).toBeVisible();
  await expect(page.locator('#tool-lyvre')).toContainText('Partie agricole en cours');
  // Après une interaction, l'avance automatique s'arrête.
  await expect(page.locator('[data-tool-story]')).toHaveAttribute('data-autoplay', 'off');
});

test.describe('mouvement réduit', () => {
  test.use({ reducedMotion: 'reduce' });
  test('aucune animation, schéma et maquettes dans leur état final', async ({ page }) => {
    await page.goto(url('/'));
    const story = page.locator('[data-tool-story]');
    await story.scrollIntoViewIfNeeded();
    await expect(story).toHaveAttribute('data-autoplay', 'off');
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running')
        .map((a) => (a as CSSAnimation).animationName ?? ''),
    );
    expect(running).toEqual([]);
    await expect(page.locator('#tool-fourmy').getByText('21,5 kg')).toBeVisible();
    // Le schéma ne change pas seul.
    await page.waitForTimeout(5500);
    await expect(page.locator('[data-system]')).toHaveAttribute('data-active', 'aiffel');
  });
});

for (const [key, path] of [
  ['fourmy', '/fourmy/'],
  ['lexicon', '/en/lexicon/'],
  ['aiffel', '/aiffel/'],
  ['lyvre', '/en/lyvre/'],
] as const) {
  test(`en-tête produit ${path} : logo, état et maquette jouée à l’écran`, async ({ page }) => {
    await page.goto(url(path));
    const hero = page.locator('main section').first();
    await expect(hero.locator(`.product-logo[data-product="${key}"]`)).toBeVisible();
    await expect(hero.locator('.status-badge')).toBeVisible();
    const mockup = hero.locator('[data-mockup][data-autoplay-visible]');
    await expect(mockup).toHaveAttribute('role', 'img');
    await expect(mockup).toHaveAttribute('data-play', '');
  });
}

test('page Lyvre : schéma centré sur Lyvre, sans avance automatique', async ({ page }) => {
  await page.goto(url('/lyvre/'));
  const system = page.locator('[data-system]');
  await expect(system).toHaveAttribute('data-active', 'lyvre');
  await expect(system).toHaveAttribute('data-autoplay', 'off');
  await expect(page.locator('#system-panel-lyvre')).toBeVisible();
});
