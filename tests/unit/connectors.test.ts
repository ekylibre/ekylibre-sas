// Cohérence de connectors.yaml (scripts/lib/connectors.mjs, D33) : node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { connectorErrors } from '../../scripts/lib/connectors.mjs';

const zones = new Set(['hub', 'hangars', 'meteo']);
const t = { fr: 'a', en: 'b' };
const base = { slug: 'x', product: 'fourmy', status: 'en-cours', zone: 'meteo', title: t, summary: t };

test('connecteur Fourmy en cours avec zone connue : valide', () => {
  assert.deepEqual(connectorErrors([base], zones), []);
});

test('stable sans source : refusé', () => {
  const errors = connectorErrors([{ ...base, status: 'stable' }], zones);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /stable sans source/);
});

test('stable avec source : valide ; en cours avec source : refusé', () => {
  assert.deepEqual(connectorErrors([{ ...base, status: 'stable', source: 'packages/x' }], zones), []);
  assert.match(connectorErrors([{ ...base, source: 'packages/x' }], zones)[0]!, /en cours/);
});

test('zone : obligatoire et connue pour Fourmy, interdite pour Lyvre', () => {
  assert.match(connectorErrors([{ ...base, zone: undefined }], zones)[0]!, /zone obligatoire/);
  assert.match(connectorErrors([{ ...base, zone: 'lune' }], zones)[0]!, /zone inconnue/);
  assert.match(connectorErrors([{ ...base, product: 'lyvre' }], zones)[0]!, /pas de zone/);
  assert.deepEqual(connectorErrors([{ slug: 'q', product: 'lyvre', status: 'en-cours', title: t, summary: t }], zones), []);
});

test('slug en double et valeurs inconnues', () => {
  const errors = connectorErrors([base, { ...base, product: 'ekylibre', status: 'beta' }], zones);
  assert.ok(errors.some((e) => /en double/.test(e)));
  assert.ok(errors.some((e) => /logiciel inconnu/.test(e)));
  assert.ok(errors.some((e) => /état inconnu/.test(e)));
});

test('le fichier réel est cohérent avec scene.json', () => {
  const connectors = parse(readFileSync('src/data/connectors.yaml', 'utf8'));
  const scene = JSON.parse(readFileSync('public/3d/scene.json', 'utf8'));
  assert.deepEqual(connectorErrors(connectors, new Set(Object.keys(scene.zones))), []);
  assert.ok(connectors.every((c: { product: string }) => c.product === 'fourmy' || c.product === 'lyvre'));
});

test('title et summary : exactement fr et en (virgule YAML non protégée)', () => {
  const broken = { fr: 'Relief', 'photo et bâtiments': null, en: 'Terrain' };
  assert.match(connectorErrors([{ ...base, title: broken }], zones)[0]!, /exactement fr et en/);
});
