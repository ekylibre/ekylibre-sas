#!/usr/bin/env node
// Vérifie les contrastes WCAG 2.2 des paires de couleurs utilisées par le design system.
// Les valeurs sont lues dans src/styles/global.css (bloc @theme) pour rester synchronisées.
import { readFile } from 'node:fs/promises';

const css = await readFile('src/styles/global.css', 'utf8');
const color = (name) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Jeton introuvable : --color-${name}`);
  return m[1];
};

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [premier plan, fond, usage, seuil]
const PAIRS = [
  ['soil-800', 'straw-50', 'texte courant (clair)', 4.5],
  ['soil-800', 'straw-100', 'texte courant (crème)', 4.5],
  ['ink-500', 'straw-50', 'texte secondaire (clair)', 4.5],
  ['eky-green-text', 'straw-50', 'liens (clair)', 4.5],
  ['eky-green-text', 'straw-100', 'liens (crème)', 4.5],
  ['eky-green-deep', 'straw-50', 'grands titres / graphismes verts (clair)', 3],
  ['straw-50', 'night-900', 'texte courant (sombre)', 4.5],
  ['straw-50', 'night-700', 'texte sur carte sombre', 4.5],
  ['eky-green-light', 'night-900', 'liens (sombre)', 4.5],
  ['eky-green', 'night-900', 'accent vert (sombre)', 4.5],
  ['night-900', 'eky-green', 'texte des boutons primaires', 4.5],
  ['night-900', 'eky-green-light', 'texte des boutons primaires (survol)', 4.5],
  ['wheat-400', 'night-900', 'accent blé (sombre)', 4.5],
];

let failed = 0;
for (const [fg, bg, usage, min] of PAIRS) {
  const r = ratio(color(fg), color(bg));
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1 (≥ ${min}) ${fg} sur ${bg} — ${usage}`);
}
// Paire interdite, documentée : le blanc sur le vert Ekylibre.
console.log(`ℹ ${ratio('#ffffff', color('eky-green')).toFixed(2)}:1 blanc sur eky-green → interdit pour le texte`);
if (failed) {
  console.error(`${failed} paire(s) sous le seuil.`);
  process.exit(1);
}
