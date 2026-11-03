// F1 — Redirections suivies dans le navigateur : échantillon d'anciennes URL (produits, services,
// entreprise, ancien article, catégorie) → page finale en 200, sous la base de déploiement.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { distFile, url, unbase } from './helpers';

const OLD = readFileSync('docs/brainstorm/anciennes-urls-ekylibre-com.txt', 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.startsWith('/'));

// Échantillon fixe et représentatif, complété par des URL tirées régulièrement dans la liste.
const FIXED = ['/ekyagri/', '/formation/', '/equipe/developpeur/', '/connexions-partenaires/', '/category/job/'];
const SPREAD = OLD.filter((_, i) => i % 9 === 4);
const SAMPLE = [...new Set([...FIXED, ...SPREAD])].slice(0, 20);

const REFRESH = /<meta http-equiv="refresh" content="\d+;\s*url=([^"]+)"/i;

for (const path of SAMPLE) {
  test(`ancienne URL ${path}`, async ({ page }) => {
    // Cible attendue lue dans dist/ ; une ancienne URL encore servie telle quelle est sa propre cible.
    const file = distFile(path);
    expect(file, `${path} absent de dist/`).not.toBeNull();
    const target = readFileSync(file!, 'utf8').match(REFRESH)?.[1] ?? url(path);

    const response = await page.goto(url(path));
    expect(response?.status(), path).toBe(200);
    await page.waitForURL((u) => u.pathname === target, { timeout: 10_000 });
    await page.waitForLoadState('load');
    expect((await page.request.get(page.url())).status(), `${path} → ${target}`).toBe(200);
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', unbase(target).startsWith('/en/') ? 'en' : 'fr');
  });
}
