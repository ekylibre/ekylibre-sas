#!/usr/bin/env node
/**
 * Extrait les illustrations isométriques de la documentation Ekylibre
 * (github.com/ekylibre/ekylibre.github.io) vers src/assets/illustrations/.
 *
 * Lancé à la main, une seule fois (les fichiers produits sont commités) :
 *   git clone --depth 1 https://github.com/ekylibre/ekylibre.github.io .cache/ekylibre.github.io
 *   node scripts/export-illustrations.mjs [chemin-du-clone]
 *
 * Les scènes isométriques n'existent qu'en PNG dans la doc (bandeaux 1000×340 en
 * 3 panneaux, versions « -carre » 500×500) : le fichier .ai du dépôt ne contient
 * que les illustrations « à plat » du guide de démarrage. Aucun agrandissement :
 * les images sont exportées à leur résolution d'origine.
 * Inventaire et remarques : docs/illustrations-inventaire.md
 */
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const SRC = resolve(process.argv[2] ?? '.cache/ekylibre.github.io', 'content/fr/user-doc/images');
const OUT = resolve('src/assets/illustrations');

// Bandeaux 1000 px en 3 panneaux : jointures en x = 333 et x = 667 (colonnes
// de transition d'1 px). On rogne 1 px de chaque côté de chaque jointure.
const PANELS = [
  { left: 0, width: 332 },
  { left: 335, width: 331 },
  { left: 668, width: 332 },
];

/** Scènes opaques : [nom, fichier source, panneau (null = image entière)] */
const SCENES = [
  // Accueil de la doc
  ['bureau', 'accueil/introduction.png', 0],
  ['elevage', 'accueil/introduction.png', 1],
  ['marche', 'accueil/introduction.png', 2],
  ['support-probleme', 'accueil/formation.png', 0],
  ['support-accompagnement', 'accueil/formation.png', 1],
  ['support-reussite', 'accueil/formation.png', 2],
  // Vigne et vin (Ekyviti)
  ['vendange', 'ekyviti/ekyviti-carre.png', null],
  ['vinification', 'ekyviti/ekyviti.png', 1],
  ['chai', 'ekyviti/ekyviti.png', 2],
  // Exploitation, production
  ['marche-producteurs', 'chapitre7/ventes-carre.png', null],
  ['hangar-stockage', 'chapitre8/stocks-carre.png', null],
  ['metiers-agricoles', 'chapitre1/contacts.png', null],
  ['materiel-agricole', 'chapitre8/stocks.png', 2],
  ['moisson', 'chapitre9/production-carre.png', null],
  ['fenaison', 'chapitre9/production.png', 2],
  ['plan-exploitation', 'chapitre3/exploitation-carre.png', null],
  ['chantier-batiment', 'chapitre3/exploitation.png', 1],
  ['tracabilite-registres', 'chapitre1/tracabilite.png', null],
  // Gestion, bureau, numérique
  ['bureau-comptable', 'chapitre5/comptabilite-carre.png', null],
  ['cabinet-comptable', 'chapitre5/comptabilite.png', 1],
  ['pilotage-performance', 'performance/performance-carre.png', null],
  ['poste-developpeur', 'chapitre10/outils-carre.png', null],
  ['cloud-securite', 'chapitre4/interface.png', 2],
  ['salle-serveurs', 'chapitre1/introduction.png', 2],
];

/**
 * Médaillons ronds (fond transparent) : [fichier, [rMin, rMax], [[nom, cx, cy], ...]]
 * Les centres sont approximatifs ; le cercle exact est recalé sur l'anneau.
 */
const MEDALLIONS = [
  [
    'accueil/schema-flux.png',
    [46, 56],
    [
      ['agriculteur', 85, 95],
      ['hangar', 415, 95],
      ['tracteur', 585, 95],
      ['recolte-echantillon', 750, 95],
      ['cultures', 915, 95],
      ['paiement', 85, 265],
      ['achats', 250, 265],
      ['chariot-elevateur', 415, 265],
      ['intrants', 585, 265],
      ['intervention', 750, 265],
      ['silo', 915, 265],
      ['comptabilite', 85, 490],
      ['registre', 250, 490],
      ['encaissement', 415, 490],
      ['livraison', 585, 490],
      ['expedition', 750, 490],
      ['vente', 915, 490],
    ],
  ],
  [
    'ekyviti/illus-vendange.png',
    [80, 88],
    [
      ['raisin', 84, 87],
      ['machine-vendanger', 250, 87],
      ['benne-vendange', 416, 87],
      ['pressoir', 583, 87],
      ['cuve-vin', 749, 87],
      ['calendrier-chrono', 915, 87],
    ],
  ],
];

const webp = (img) => img.webp({ quality: 85, effort: 6 });

async function exportScene([name, file, panel]) {
  let img = sharp(join(SRC, file));
  if (panel !== null) {
    const { height } = await img.metadata();
    img = img.extract({ top: 0, height, ...PANELS[panel] });
  }
  await webp(img).toFile(join(OUT, `${name}.webp`));
}

/** Pixel de l'anneau vert (#0B8232 environ, opaque). */
function isRing(data, W, H, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const i = (y * W + x) * 4;
  return data[i + 3] > 200 && data[i] < 70 && data[i + 1] > 100 && data[i + 1] < 160 && data[i + 2] < 90;
}

/** Ajuste un cercle sur l'anneau : maximise le nombre de points verts. */
function fitRing(data, W, H, ax, ay, [rMin, rMax]) {
  let best = { score: -1 };
  for (let r = rMin; r <= rMax; r += 0.5)
    for (let cx = ax - 12; cx <= ax + 12; cx += 0.5)
      for (let cy = ay - 12; cy <= ay + 12; cy += 0.5) {
        let score = 0;
        for (let k = 0; k < 180; k++) {
          const a = (k * Math.PI) / 90;
          if (isRing(data, W, H, cx + r * Math.cos(a), cy + r * Math.sin(a))) score++;
        }
        if (score > best.score) best = { score, cx, cy, r };
      }
  return best;
}

/** Couleur la plus fréquente parmi des pixels (quantifiée à 4 bits par canal). */
function dominant(data, W, pts) {
  const counts = new Map();
  for (const [x, y] of pts) {
    const i = (Math.round(y) * W + Math.round(x)) * 4;
    if (data[i + 3] < 250) continue;
    const key = (data[i] >> 4) * 256 + (data[i + 1] >> 4) * 16 + (data[i + 2] >> 4);
    const c = counts.get(key) ?? { n: 0, rgb: [0, 0, 0] };
    c.n++;
    for (let k = 0; k < 3; k++) c.rgb[k] += data[i + k];
    counts.set(key, c);
  }
  const best = [...counts.values()].sort((p, q) => q.n - p.n)[0];
  return best.rgb.map((v) => Math.round(v / best.n));
}

const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

/** Points d'un cercle, limités à l'image. */
const circle = (cx, cy, r, W, H) =>
  Array.from({ length: 360 }, (_, k) => [
    cx + r * Math.cos((k * Math.PI) / 180),
    cy + r * Math.sin((k * Math.PI) / 180),
  ]).filter(([x, y]) => x >= 0 && y >= 0 && x < W - 0.5 && y < H - 0.5);

async function exportMedallions([file, radii, list]) {
  const { data, info } = await sharp(join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const fits = list.map(([name, ax, ay]) => ({ name, ...fitRing(data, W, H, ax, ay, radii) }));

  for (const fit of fits) {
    const { name, cx, cy, r } = fit;
    const rOut = r + 1.5; // bord extérieur de l'anneau
    const S = Math.ceil(2 * rOut) + 2;
    const ox = cx - S / 2; // origine de la vignette dans l'image source
    const oy = cy - S / 2;
    const ring = dominant(
      data,
      W,
      circle(cx, cy, r, W, H).filter(([x, y]) => isRing(data, W, H, x, y)),
    );
    const fill = dominant(data, W, circle(cx, cy, r - 6, W, H));
    // Voisins qui chevauchent ce médaillon (bandeaux où les cercles se touchent).
    const neighbours = fits.filter((f) => f !== fit && Math.hypot(f.cx - cx, f.cy - cy) < r + f.r + 4);

    // Vignette carrée : pixels source, zones de chevauchement repeintes dans la
    // couleur de fond du médaillon, extérieur transparent.
    const out = Buffer.alloc(S * S * 4);
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const sx = Math.floor(ox + x + 0.5);
        const sy = Math.floor(oy + y + 0.5);
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
        const o = (y * S + x) * 4;
        const inLens = neighbours.some((f) => Math.hypot(sx + 0.5 - f.cx, sy + 0.5 - f.cy) < f.r + 3);
        if (inLens) out.set([...fill, 255], o);
        else out.set(data.subarray((sy * W + sx) * 4, (sy * W + sx) * 4 + 4), o);
      }
    // Anneau redessiné (recouvre bouts de flèches et d'anneaux voisins), fond
    // complété là où l'image source est rognée, puis découpe circulaire.
    const c = `cx="${cx - ox}" cy="${cy - oy}"`;
    const svg = (body) =>
      Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${body}</svg>`);
    const under = svg(`<circle ${c} r="${r}" fill="${hex(fill)}"/>`);
    const ringSvg = svg(`<circle ${c} r="${r}" fill="none" stroke="${hex(ring)}" stroke-width="3"/>`);
    const maskSvg = svg(`<circle ${c} r="${rOut}" fill="#fff"/>`);
    const raw = await sharp(out, { raw: { width: S, height: S, channels: 4 } })
      .png()
      .toBuffer();
    const buf = await sharp(under)
      .composite([{ input: raw }, { input: ringSvg }])
      .png()
      .toBuffer();
    const clean = await sharp(buf)
      .composite([{ input: maskSvg, blend: 'dest-in' }])
      .png()
      .toBuffer();
    const base = join(OUT, `medaillon-${name}`);
    await sharp(clean).webp({ quality: 85, alphaQuality: 100, effort: 6 }).toFile(`${base}.webp`);
    await sharp(clean).webp({ lossless: true, effort: 6 }).toFile(`${base}-lossless.webp`);
    console.log(
      `medaillon-${name}: c=(${cx},${cy}) r=${r} score=${fit.score}/180 ${S}x${S} anneau ${hex(ring)} fond ${hex(fill)}`,
    );
  }
}

await mkdir(OUT, { recursive: true });
for (const s of SCENES) await exportScene(s);
for (const m of MEDALLIONS) await exportMedallions(m);
console.log(`${SCENES.length} scènes exportées dans ${OUT}`);
