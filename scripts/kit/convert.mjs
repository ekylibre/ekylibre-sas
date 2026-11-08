// Kit isométrique, étape 1 (docs/design/04-accueil-kit-connecteurs.md §5.1) : convertit chaque .ai/.svg
// de l'archive Graphisme en SVG simple, en aperçu PNG et en boîtes englobantes (inkscape --query-all).
// Sorties hors dépôt (fichiers de ~100 Mo) ; seul l'inventaire Markdown entre dans le dépôt.
//
//   node scripts/kit/convert.mjs               conversion (reprend là où elle s'était arrêtée)
//   node scripts/kit/convert.mjs --inventory   régénère docs/kit-isometrique/inventaire.md
//
// Inkscape est un snap : chemins absolus obligatoires, pas de /tmp ni de dossier caché.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, extname, join, relative, resolve } from 'node:path';

const SRC = resolve(process.env.KIT_SRC ?? join(homedir(), 'Documents/archive_ekylibre/ewannin@ekylibre.com/Graphisme'));
const OUT = resolve(process.env.KIT_OUT ?? join(homedir(), 'Documents/archive_ekylibre/kit-isometrique'));
const INKSCAPE = process.env.INKSCAPE ?? '/snap/bin/inkscape';
const TIMEOUT_MS = 5 * 60 * 1000;
const REPORT = join(OUT, 'report.json');
const INVENTORY = resolve('docs/kit-isometrique/inventaire.md');
const ELEMENTS = resolve('docs/kit-isometrique/elements.yaml');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (/^\.(ai|svg)$/i.test(extname(entry.name))) out.push(p);
  }
  return out.sort((a, b) => a.localeCompare(b, 'fr'));
}

function run(args) {
  return new Promise((done) => {
    const child = spawn(INKSCAPE, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      done({ ok: code === 0, code, signal, stdout, stderr });
    });
  });
}

const fresh = async (target, source) => existsSync(target) && (await stat(target)).mtimeMs >= (await stat(source)).mtimeMs;
const lastLine = (s) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/icc-color|^\*\* \(org\.inkscape/.test(l))
    .pop() ?? '';

async function convert() {
  const files = await walk(SRC);
  const report = existsSync(REPORT) ? JSON.parse(await readFile(REPORT, 'utf8')) : {};
  console.log(`${files.length} fichiers .ai/.svg dans ${SRC}`);
  let i = 0;
  for (const file of files) {
    i++;
    const rel = relative(SRC, file);
    // Inkscape retire un « .svg » redoublé (x.svg.svg → x.svg) : les sources SVG prennent un suffixe distinct.
    const svg = join(OUT, 'svg', /\.svg$/i.test(rel) ? `${rel.slice(0, -4)}__svg.svg` : `${rel}.svg`);
    const png = join(OUT, 'preview', `${rel}.png`);
    const csv = join(OUT, 'bbox', `${rel}.csv`);
    const entry = { rel, format: extname(file).slice(1).toLowerCase(), bytes: (await stat(file)).size };
    if ((await fresh(svg, file)) && (await fresh(png, svg)) && (await fresh(csv, svg)) && report[rel]?.status === 'ok') {
      console.log(`[${i}/${files.length}] déjà fait : ${rel}`);
      continue;
    }
    for (const p of [svg, png, csv]) await mkdir(dirname(p), { recursive: true });
    const t0 = Date.now();
    const steps = [
      ['svg', [file, '--export-type=svg', '--export-plain-svg', `--export-filename=${svg}`]],
      ['png', [svg, '--export-type=png', '--export-width=800', `--export-filename=${png}`]],
    ];
    let failed = null;
    for (const [name, args] of steps) {
      const r = await run(args);
      if (!r.ok || !existsSync(name === 'svg' ? svg : png)) {
        failed = `${name} : ${r.signal ? `interrompu (${r.signal})` : lastLine(r.stderr) || `code ${r.code}`}`;
        break;
      }
    }
    if (!failed) {
      const q = await run(['--query-all', svg]);
      if (q.ok && q.stdout.trim()) {
        await writeFile(csv, q.stdout);
        entry.objects = q.stdout.trim().split('\n').length - 1;
      } else failed = `query-all : ${lastLine(q.stderr) || 'sortie vide'}`;
    }
    entry.status = failed ? 'échec' : 'ok';
    if (failed) entry.error = failed;
    else entry.svgBytes = (await stat(svg)).size;
    entry.seconds = Math.round((Date.now() - t0) / 1000);
    report[rel] = entry;
    await writeFile(REPORT, JSON.stringify(report, null, 2));
    console.log(`[${i}/${files.length}] ${entry.status} ${entry.seconds}s : ${rel}${failed ? ` — ${failed}` : ''}`);
  }
  await inventory();
}

const mo = (b) => (b / 1e6).toFixed(b < 1e6 ? 2 : 1);

async function inventory() {
  const report = JSON.parse(await readFile(REPORT, 'utf8'));
  // Fichiers d'où au moins un élément est extrait (elements.yaml, étape 2) : colonne « isométrique ».
  const used = new Set();
  if (existsSync(ELEMENTS)) {
    for (const m of (await readFile(ELEMENTS, 'utf8')).matchAll(/^\s*source:\s*['"]?(.+?)['"]?\s*$/gm)) used.add(m[1]);
  }
  const rows = Object.values(report).sort((a, b) => a.rel.localeCompare(b.rel, 'fr'));
  const ok = rows.filter((r) => r.status === 'ok').length;
  const lines = [
    '# Kit isométrique — inventaire des sources',
    '',
    '> Généré par `node scripts/kit/convert.mjs --inventory` — ne pas modifier à la main.',
    `> Archive : \`${SRC.replace(homedir(), '~')}\` · sorties : \`${OUT.replace(homedir(), '~')}\` (hors dépôt).`,
    '',
    `${rows.length} fichiers · ${ok} convertis · ${rows.length - ok} en échec.`,
    '',
    '| Fichier | Format | État | Taille source (Mo) | SVG converti (Mo) | Objets | Éléments extraits | Remarque |',
    '|---|---|---|---:|---:|---:|---|---|',
    ...rows.map(
      (r) =>
        `| \`${r.rel}\` | ${r.format} | ${r.status} | ${mo(r.bytes)} | ${r.svgBytes ? mo(r.svgBytes) : '—'} | ${r.objects ?? '—'} | ${used.has(r.rel) ? 'oui' : ''} | ${(r.error ?? '').replaceAll('|', '/')} |`,
    ),
    '',
  ];
  await mkdir(dirname(INVENTORY), { recursive: true });
  await writeFile(INVENTORY, lines.join('\n'));
  console.log(`✓ ${relative(process.cwd(), INVENTORY)} : ${rows.length} fichiers, ${ok} convertis`);
}

await (process.argv.includes('--inventory') ? inventory() : convert());
