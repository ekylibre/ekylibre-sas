// Géométrie isométrique (src/lib/iso.ts) : node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { project, box, cylinder, curve, curvePoint, ellipseRadii, COS30 } from '../../src/lib/iso.ts';

const P = { ox: 100, oy: 100, scale: 1 };

test('project : origine, axes et hauteur', () => {
  assert.deepEqual(project([0, 0, 0], P), [100, 100]);
  assert.deepEqual(project([10, 0, 0], P), [100 + Math.round(10 * COS30 * 10) / 10, 105]);
  assert.deepEqual(project([0, 10, 0], P), [100 - Math.round(10 * COS30 * 10) / 10, 105]);
  assert.deepEqual(project([0, 0, 10], P), [100, 90]);
});

test('box : trois faces fermées de quatre sommets', () => {
  const b = box(0, 0, 0, 10, 10, 10, P);
  for (const face of [b.top, b.left, b.right]) {
    assert.match(face, /^M[^L]+(L[^L]+){3}Z$/);
  }
});

test('cylinder : ellipse du dessus centrée au-dessus de la base', () => {
  const [rx, ry] = ellipseRadii(10, P);
  assert.ok(rx > ry);
  const c = cylinder(0, 0, 0, 10, 20, P);
  assert.ok(c.top.startsWith(`M${100 - rx} 80A${rx} ${ry}`));
  assert.ok(c.side.includes('L'));
});

test('curve : sans courbure, le point milieu est sur le segment', () => {
  assert.equal(curve([0, 0], [10, 0]), 'M0 0Q5 0 10 0');
  assert.deepEqual(curvePoint([0, 0], [10, 0], 0), [5, 0]);
  const [, y] = curvePoint([0, 0], [10, 0], 8);
  assert.equal(y, 4);
});
