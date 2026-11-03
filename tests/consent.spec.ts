// F1 — RGPD (§9) : aucune requête Google avant consentement ; formulaires Brevo.
// Les deux branches dépendent de src/data/integrations.yaml :
// - GA4 configuré → bandeau, refus = aucune requête, accord = gtag.js chargé ;
// - GA4 vide → aucun bandeau, aucun bouton « Gérer les cookies », aucune requête Google ;
// - Brevo configuré → envoi POST vers sibforms.com (intercepté, rien ne part réellement) ;
// - Brevo vide → bouton d'envoi désactivé et message « disponible très prochainement ».
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { INTEGRATIONS, url } from './helpers';

// vanilla-cookieconsent n'affiche pas le bandeau aux robots (navigator.webdriver).
test.use({ launchOptions: { args: ['--disable-blink-features=AutomationControlled'] } });

const GOOGLE = /(^|\.)(google-analytics|googletagmanager|analytics\.google|doubleclick)\.|(^|\.)google\.com$/;

/** Enregistre les requêtes vers Google ; gtag.js est simulé (aucun accès réseau réel). */
async function recordGoogle(page: Page): Promise<string[]> {
  const hits: string[] = [];
  page.on('request', (req) => {
    if (GOOGLE.test(new URL(req.url()).hostname)) hits.push(req.url());
  });
  await page.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* gtag simulé */' }),
  );
  return hits;
}

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(500);
};

test.describe('consentement GA4', () => {
  if (INTEGRATIONS.ga4) {
    test('aucune requête Google avant accord, puis refus', async ({ page }) => {
      const hits = await recordGoogle(page);
      await page.goto(url('/'));
      const banner = page.locator('#cc-main .cm');
      await expect(banner).toBeVisible({ timeout: 10_000 });
      await settle(page);
      expect(hits, 'requêtes Google avant consentement').toEqual([]);

      // Le bandeau lui-même est accessible.
      const axe = await new AxeBuilder({ page })
        .include('#cc-main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        axe.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
      ).toEqual([]);

      await banner.locator('[data-role="necessary"]').click();
      await expect(banner).toBeHidden();
      await page.goto(url('/contact/'));
      await settle(page);
      await expect(page.locator('#cc-main .cm')).toBeHidden();
      expect(hits, 'requêtes Google après refus').toEqual([]);
      // Le choix peut être modifié depuis le pied de page.
      await expect(page.locator('footer [data-consent-manage]')).toBeVisible();
    });

    test('accord : gtag.js chargé', async ({ page }) => {
      const hits = await recordGoogle(page);
      await page.goto(url('/en/'));
      const banner = page.locator('#cc-main .cm');
      await expect(banner).toBeVisible({ timeout: 10_000 });
      expect(hits).toEqual([]);
      const gtag = page.waitForRequest(/googletagmanager\.com\/gtag\/js/);
      await banner.locator('[data-role="all"]').click();
      expect((await gtag).url()).toContain(encodeURIComponent(INTEGRATIONS.ga4!));
      await expect(banner).toBeHidden();
      // Choix mémorisé : pas de bandeau à la page suivante.
      await page.goto(url('/en/contact/'));
      await settle(page);
      await expect(page.locator('#cc-main .cm')).toBeHidden();
    });
  } else {
    test('GA4 non configuré : ni bandeau ni requête Google', async ({ page }) => {
      const hits = await recordGoogle(page);
      for (const path of ['/', '/en/', '/contact/', '/interoperabilite/']) {
        await page.goto(url(path));
        await settle(page);
        await expect(page.locator('#cc-main')).toHaveCount(0);
        await expect(page.locator('#consent-config')).toHaveCount(0);
        await expect(page.locator('[data-consent-manage]')).toBeHidden();
      }
      expect(hits, 'requêtes Google').toEqual([]);
      const cookies = await page.context().cookies();
      expect(cookies.filter((c) => /^_ga|eky_consent/.test(c.name))).toEqual([]);
    });
  }
});

const FORMS = [
  { kind: 'demo', lang: 'fr', path: '/contact/', unavailable: /très prochainement/ },
  { kind: 'demo', lang: 'en', path: '/en/contact/', unavailable: /very soon/ },
  { kind: 'projet', lang: 'fr', path: '/services/', unavailable: /très prochainement/ },
  { kind: 'projet', lang: 'en', path: '/en/services/', unavailable: /very soon/ },
  { kind: 'newsletter', lang: 'fr', path: '/', unavailable: /très prochainement/ },
  { kind: 'newsletter', lang: 'en', path: '/en/', unavailable: /very soon/ },
] as const;

test.describe('formulaires Brevo', () => {
  for (const f of FORMS) {
    const action = INTEGRATIONS.brevo(f.kind, f.lang);
    test(`${f.kind} ${f.lang} (${action ? 'configuré' : 'non configuré'})`, async ({ page }) => {
      const posts: { url: string; body: string }[] = [];
      await page.route(/\.sibforms\.com\//, async (route) => {
        posts.push({ url: route.request().url(), body: route.request().postData() ?? '' });
        await route.fulfill({ status: 200, body: '' });
      });
      await page.goto(url(f.path));
      // Bandeau de consentement (GA4 configuré) : il couvre le bas de page, on le referme d'abord.
      if (INTEGRATIONS.ga4) {
        const banner = page.locator('#cc-main .cm');
        await expect(banner).toBeVisible({ timeout: 10_000 });
        await banner.locator('[data-role="necessary"]').click();
        await expect(banner).toBeHidden();
      }
      const form = page.locator(`form.brevo-form[data-kind="${f.kind}"]`);
      await expect(form).toHaveCount(1);
      await form.scrollIntoViewIfNeeded();
      const submit = form.locator('button[type="submit"]');
      const status = form.locator('.form-status');

      if (!action) {
        await expect(form).toHaveAttribute('data-ready', 'false');
        await expect(form).not.toHaveAttribute('action', /./);
        await expect(submit).toBeDisabled();
        await expect(status).toHaveText(f.unavailable);
        expect(posts).toEqual([]);
        return;
      }

      await expect(form).toHaveAttribute('data-ready', 'true');
      await expect(form).toHaveAttribute('action', action);
      await expect(submit).toBeEnabled();
      // Champs requis vides : la validation native bloque l'envoi.
      await submit.click();
      await page.waitForTimeout(300);
      expect(posts).toEqual([]);

      await form.locator('input[name="EMAIL"]').fill('test@example.org');
      if (f.kind !== 'newsletter') await form.locator('input[name="PRENOM"]').fill('Camille');
      await form.locator('input[name="OPT_IN"]').check();
      const request = page.waitForRequest((r) => r.method() === 'POST' && /\.sibforms\.com\//.test(r.url()));
      await submit.click();
      expect((await request).url()).toBe(action);
      await expect(status).not.toHaveText('');
      await expect(status).toHaveText(new RegExp(f.lang === 'fr' ? 'Merci' : 'Thank you'));
      expect(posts[0]!.body).toContain('test@example.org');
      expect(posts[0]!.body).toContain(f.lang);
    });
  }
});
