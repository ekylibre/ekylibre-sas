#!/usr/bin/env node
// Construit le sprite SVG des pictogrammes à partir des glyphes de la police `agric`
// (github.com/ekylibre/agric, licence MIT, voir vendor/agric/LICENSE.txt).
//
// Entrée  : vendor/agric/glyphs/<nom>.svg (glyphes copiés depuis le dépôt agric)
// Sortie  : public/icons/agric.svg (un <symbol id="i-<nom>"> par glyphe)
//           src/lib/icon-names.ts (liste typée des noms disponibles)
//
// Pour ajouter un pictogramme : copier le glyphe du dépôt agric dans vendor/agric/glyphs/
// en le renommant <nom>.svg, puis lancer `npm run icons`.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { optimize } from 'svgo';

const SRC = 'vendor/agric/glyphs';
const OUT_SPRITE = 'public/icons/agric.svg';
const OUT_NAMES = 'src/lib/icon-names.ts';

const files = (await readdir(SRC)).filter((f) => f.endsWith('.svg')).sort();
const symbols = [];
const names = [];

for (const file of files) {
  const name = basename(file, '.svg');
  const raw = await readFile(join(SRC, file), 'utf8');
  const width = Number(raw.match(/width="([\d.]+)"/)?.[1] ?? 1000);
  const height = Number(raw.match(/height="([\d.]+)"/)?.[1] ?? 1000);
  const { data } = optimize(raw, {
    multipass: true,
    plugins: ['preset-default', { name: 'removeAttrs', params: { attrs: ['fill', 'width', 'height', 'xmlns'] } }],
  });
  const inner = data.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  if (!inner.trim()) throw new Error(`Glyphe vide : ${file}`);
  symbols.push(`<symbol id="i-${name}" viewBox="0 0 ${width} ${height}">${inner}</symbol>`);
  names.push(name);
}

await mkdir('public/icons', { recursive: true });
await writeFile(
  OUT_SPRITE,
  `<svg xmlns="http://www.w3.org/2000/svg"><!-- Pictogrammes agric (MIT) © Brice Texier / Ekylibre --><defs>${symbols.join('')}</defs></svg>\n`,
);
await writeFile(
  OUT_NAMES,
  `// Généré par scripts/build-icons.mjs — ne pas modifier à la main.\nexport const ICON_NAMES = ${JSON.stringify(names, null, 2)} as const;\nexport type IconName = (typeof ICON_NAMES)[number];\n`,
);
console.log(`${names.length} pictogrammes → ${OUT_SPRITE}`);
