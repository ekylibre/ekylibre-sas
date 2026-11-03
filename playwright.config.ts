// F1 — Tests de bout en bout sur le site construit (dist/), servi comme GitHub Pages.
// Prérequis : `npm run build` (avec le même BASE_PATH que celui passé aux tests).
//   npm run build && npm test                                   → base « / »
//   BASE_PATH=/ekylibre-sas/ npm run build && BASE_PATH=/ekylibre-sas/ npm test   → recette
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.TEST_PORT ?? 4322);
const BASE = `/${(process.env.BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  ...(CI ? { workers: 2 } : {}),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  webServer: {
    command: `node tests/server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}${BASE}`,
    reuseExistingServer: !CI,
    timeout: 15_000,
    env: { BASE_PATH: BASE },
  },
  projects: [
    // Tests sans navigateur (vérification statique de dist/).
    { name: 'static', testMatch: '**/redirects-static.spec.ts' },
    {
      name: 'desktop',
      testIgnore: '**/redirects-static.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      testMatch: '**/smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
