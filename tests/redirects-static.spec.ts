// F1 — Redirections (EF7, ADR-7), vérification statique de dist/ (sans navigateur) :
// chacune des 129 anciennes URL est servie par une page, ou par une redirection meta refresh
// dont la cible (base comprise) est une vraie page de dist/ (pas de chaîne de redirections).
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { BASE, distFile, unbase } from './helpers';

const OLD = readFileSync('docs/brainstorm/anciennes-urls-ekylibre-com.txt', 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.startsWith('/'));

const REFRESH = /<meta http-equiv="refresh" content="\d+;\s*url=([^"]+)"/i;

function resolve(path: string): { kind: 'page' | 'redirect' | 'missing'; target?: string } {
  const file = distFile(path);
  if (!file) return { kind: 'missing' };
  const target = readFileSync(file, 'utf8').match(REFRESH)?.[1];
  return target ? { kind: 'redirect', target } : { kind: 'page' };
}

test('la liste des anciennes URL est complète', () => {
  expect(OLD).toHaveLength(129);
});

test('toutes les anciennes URL aboutissent à une page existante', () => {
  const problems: string[] = [];
  let pages = 0;
  let redirects = 0;
  for (const path of OLD) {
    const r = resolve(path);
    if (r.kind === 'missing') {
      problems.push(`${path} : absent de dist/`);
      continue;
    }
    if (r.kind === 'page') {
      pages++;
      continue;
    }
    redirects++;
    const target = r.target!;
    if (!target.startsWith(BASE)) {
      problems.push(`${path} → ${target} : la cible n'a pas la base ${BASE}`);
      continue;
    }
    const next = resolve(unbase(target));
    if (next.kind === 'missing') problems.push(`${path} → ${target} : cible absente de dist/`);
    else if (next.kind === 'redirect') problems.push(`${path} → ${target} → ${next.target} : chaîne de redirections`);
  }
  expect(problems).toEqual([]);
  expect(pages + redirects).toBe(OLD.length);
  test.info().annotations.push({ type: 'bilan', description: `${pages} pages, ${redirects} redirections` });
});

test('les redirections ne sont pas indexées et pointent vers une URL canonique', () => {
  for (const path of OLD) {
    const file = distFile(path)!;
    const html = readFileSync(file, 'utf8');
    if (!REFRESH.test(html)) continue;
    expect(html, path).toMatch(/<meta name="robots" content="noindex">/);
    expect(html, path).toMatch(/<link rel="canonical" href="https?:\/\/[^"]+">/);
  }
});
