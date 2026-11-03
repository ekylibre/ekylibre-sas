// F1 — Accessibilité : axe-core sur toutes les routes FR et EN (WCAG 2.1 A/AA).
// Échec sur toute violation « serious » ou « critical » ; les violations mineures sont journalisées.
//
// Exclusion : le <canvas> WebGL de la scène 3D (dans <farm-scene>) n'est qu'une image décorative
// doublée en HTML (ConnectorDiagram, ConnectorTable, DatasetTable) ; axe ne peut pas l'analyser
// (contrastes calculés sur des pixels 3D en mouvement). Les médaillons <button> superposés restent
// analysés : seul le canvas est exclu.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ALL_ROUTES, NEWS_SAMPLES, url } from './helpers';

const pages = [
  ...ALL_ROUTES.map((r) => ({ name: `${r.lang} ${r.key}`, path: r.path })),
  { name: 'fr 404', path: '/cette-page-n-existe-pas/' },
  { name: `fr article`, path: `/actualites/${NEWS_SAMPLES[0]}/` },
  { name: `en article`, path: `/en/news/${NEWS_SAMPLES[0]}/` },
  // Scène 3D réelle (médaillons <button> de la couche CSS2D) : en headless, sans ?force3d, repli 2D.
  { name: 'fr home 3D', path: '/?force3d', scene: true },
  { name: 'en interop 3D', path: '/en/interoperability/?force3d', scene: true },
];

for (const p of pages) {
  test(`axe ${p.name} ${p.path}`, async ({ page }, testInfo) => {
    await page.goto(url(p.path));
    if ('scene' in p) {
      const scene = page.locator('farm-scene');
      await scene.scrollIntoViewIfNeeded();
      await expect(scene).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
    }
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    // Les animations d'entrée (GSAP) peuvent laisser du texte semi-transparent : on attend leur fin.
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .exclude('farm-scene canvas')
      .analyze();

    const lines = results.violations.map(
      (v) =>
        `[${v.impact}] ${v.id} — ${v.help}\n` +
        v.nodes
          .slice(0, 8)
          .map(
            (n) =>
              `    ${n.target.join(' ')}${n.failureSummary ? `\n      ${n.failureSummary.replace(/\n/g, '\n      ')}` : ''}`,
          )
          .join('\n'),
    );
    if (lines.length) {
      await testInfo.attach('axe-violations.txt', { body: lines.join('\n\n'), contentType: 'text/plain' });
      console.log(`\n${p.path}\n${lines.join('\n')}`);
    }

    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
      'violations axe sérieuses ou critiques',
    ).toEqual([]);
  });
}
