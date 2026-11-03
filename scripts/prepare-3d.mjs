#!/usr/bin/env node
// C1 — Prépare les modèles 3D du site à partir de la maquette FarmLab La Vauzelle.
//
// La chaîne FreeCAD → Blender (~/Documents/SCI Chenes verts/maquette) reste la source de vérité ;
// ce script ne fait que consommer ses exports web (GLB Draco + scene.json) et produit :
//   public/3d/hero.glb        scène allégée de l'accueil      (budget 2,5 Mo)
//   public/3d/farm-full.glb   scène complète (Interopérabilité) (budget 5 Mo)
//   public/3d/scene.json      repère, vues caméra, poids, provenance
//
// Usage : node scripts/prepare-3d.mjs [dossier des exports web]
//   (défaut : ~/projects/osfarm.github.io/assets/3d/chenes-verts)
// Lancé à la main : les fichiers produits sont commités (la CI ne dispose pas de la maquette).
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  mergeDocuments,
  unpartition,
  dedup,
  instance,
  prune,
  weld,
  simplify,
  textureCompress,
  meshopt,
  compactPrimitive,
} from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const SRC = process.argv[2] ?? join(homedir(), 'projects/osfarm.github.io/assets/3d/chenes-verts');
const OUT = 'public/3d';
const MB = 1024 * 1024;

// Calques repris de la maquette. Exclus volontairement : réseaux enterrés, mobilier, état EDL
// (sans intérêt pour le message et sans raison d'être publics).
const LAYERS = ['terrain', 'contexte', 'paysage', 'rebus_ESQ', 'arbres'];
// Éléments intérieurs de REBUS retirés (seule l'enveloppe est visible depuis le ciel).
const REBUS_INTERIOR = new Set(['cloison', 'sol']);

const VARIANTS = {
  hero: {
    file: 'hero.glb',
    budget: 2.5 * MB,
    maxTrees: 1200,
    terrainRatio: 0.5, // part des triangles conservés sur le terrain proche
    farTerrainRatio: 0.35,
    textureSize: { ortho_web: 2048, ortho_lointain_web: 1024 },
  },
  full: {
    file: 'farm-full.glb',
    budget: 5 * MB,
    maxTrees: Infinity,
    terrainRatio: 0.8,
    farTerrainRatio: 0.6,
    textureSize: { ortho_web: 2048, ortho_lointain_web: 2048 },
  },
};

// Centre de la ferme dans le repère glTF (cible de la vue « site » de la maquette).
const FARM_CENTER = [22, -8];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'meshopt.encoder': MeshoptEncoder,
});
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const sourceManifest = JSON.parse(await readFile(join(SRC, 'scene.json'), 'utf8'));

async function sha(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex')
    .slice(0, 12);
}

async function build(name, v) {
  const doc = new Document();
  for (const layer of LAYERS) {
    const src = await io.read(join(SRC, `${layer}.glb`));
    mergeDocuments(doc, src);
  }
  const root = doc.getRoot();
  // Une seule scène contenant tous les nœuds racines.
  const [scene, ...others] = root.listScenes();
  for (const s of others) {
    for (const child of s.listChildren()) scene.addChild(child);
    s.dispose();
  }
  root.setDefaultScene(scene);
  await doc.transform(unpartition());

  let removed = 0;
  const trees = [];
  for (const node of root.listNodes()) {
    const extras = node.getExtras();
    if (REBUS_INTERIOR.has(extras.Categorie) && node.getName().startsWith('ESQ_')) {
      node.dispose();
      removed++;
    } else if (extras.Categorie === 'arbre') {
      const [x, , z] = node.getTranslation();
      trees.push({ node, d: Math.hypot(x - FARM_CENTER[0], z - FARM_CENTER[1]) });
    }
  }
  trees.sort((a, b) => a.d - b.d);
  const dropped = trees.slice(Number.isFinite(v.maxTrees) ? v.maxTrees : trees.length);
  for (const t of dropped) t.node.dispose();

  // Simplification du terrain (les maillages « drape_* » sont fins et restent intacts).
  await doc.transform(weld());
  for (const mesh of root.listMeshes()) {
    const name = mesh.getName();
    const ratio =
      name === 'SITE_terrain_terrain'
        ? v.terrainRatio
        : name === 'SITE_terrain_terrain_lointain'
          ? v.farTerrainRatio
          : 1;
    if (ratio >= 1) continue;
    for (const prim of mesh.listPrimitives()) {
      const before = prim.getIndices()?.getCount() ?? 0;
      await simplifyPrimitive(prim, ratio);
      const after = prim.getIndices()?.getCount() ?? 0;
      console.log(`  ${name} : ${before / 3} → ${after / 3} triangles`);
    }
  }

  // Textures : WebP redimensionné (three.js lit EXT_texture_webp nativement).
  for (const tex of root.listTextures()) {
    const size = v.textureSize[tex.getName()] ?? 1024;
    await doc.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        quality: 82,
        resize: [size, size],
        pattern: new RegExp(`^${tex.getName()}$`),
      }),
    );
  }

  // La sortie est compressée en Meshopt : l'extension Draco héritée des sources est retirée.
  for (const ext of root.listExtensionsUsed()) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  }
  await doc.transform(
    dedup(),
    instance({ min: 5 }),
    prune({ keepExtras: true }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );

  const file = join(OUT, v.file);
  await io.write(file, doc);
  const bytes = (await stat(file)).size;
  console.log(
    `✓ ${file} : ${(bytes / MB).toFixed(2)} Mo (budget ${(v.budget / MB).toFixed(1)} Mo) — ` +
      `${trees.length - dropped.length} arbres, ${removed} éléments intérieurs retirés`,
  );
  if (bytes > v.budget) throw new Error(`${file} dépasse le budget de ${(v.budget / MB).toFixed(1)} Mo`);
  return { file: v.file, bytes, trees: trees.length - dropped.length, sha256: await sha(file) };
}

/** Simplifie une primitive avec meshoptimizer en conservant les bords (raccords avec les drapés). */
async function simplifyPrimitive(prim, ratio) {
  const pos = prim.getAttribute('POSITION');
  const idx = prim.getIndices();
  if (!pos || !idx) return;
  const positions = new Float32Array(pos.getArray());
  const indices = new Uint32Array(idx.getArray());
  const target = Math.floor((indices.length * ratio) / 3) * 3;
  const [out] = MeshoptSimplifier.simplify(indices, positions, 3, target, 0.01, ['LockBorder']);
  idx.setArray(out);
  compactPrimitive(prim);
}

await mkdir(OUT, { recursive: true });
const outputs = {};
for (const [name, v] of Object.entries(VARIANTS)) outputs[name] = await build(name, v);

// Manifeste : repère et vues de la maquette, complétés au fil de C3 (zones, nouvelles vues).
const manifestFile = join(OUT, 'scene.json');
let previous = {};
try {
  previous = JSON.parse(await readFile(manifestFile, 'utf8'));
} catch {
  /* premier passage */
}
const manifest = {
  title: 'FarmLab La Vauzelle — la ferme connectée',
  frame: sourceManifest.repere,
  unit: 'm',
  provenance: {
    source: 'Maquette SCI Les Chênes Verts / FarmLab La Vauzelle (FreeCAD → Blender → glTF)',
    layers: LAYERS,
    excluded: ['reseaux', 'mobilier', 'rebus_EDL', 'REBUS : cloisons et sols intérieurs'],
    preparedAt: new Date().toISOString(),
    script: 'scripts/prepare-3d.mjs',
  },
  assets: outputs,
  views: { ...sourceManifest.vues, ...(previous.views ?? {}) },
  zones: previous.zones ?? {},
};
await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`✓ ${manifestFile}`);
