#!/usr/bin/env node
// B5 — Import des anciennes actualités du site WordPress ekylibre.com depuis la Wayback Machine.
//
// Entrée : docs/brainstorm/anciennes-urls-ekylibre-com.txt (anciens chemins du site).
// Sorties : src/content/news/fr/<slug>.md, src/assets/news/<slug>/*.webp,
//           src/content/news/fr/_import-report.json
//
// Le HTML téléchargé est une donnée non fiable : il est analysé (tokenizer maison), jamais exécuté.
// Requêtes séquentielles, ~1 s entre deux appels réseau, cache disque pour des relances idempotentes.
//
// Usage : node scripts/import-wayback.mjs [--only <slug>] [--cache <dir>]
import { mkdir, readFile, writeFile, access, readdir, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_LIST = join(ROOT, 'docs/brainstorm/anciennes-urls-ekylibre-com.txt');
const OUT_MD = join(ROOT, 'src/content/news/fr');
const OUT_ASSETS = join(ROOT, 'src/assets/news');
const REPORT = join(OUT_MD, '_import-report.json');

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const ONLY = argValue('--only');
const CACHE =
  argValue('--cache') ??
  process.env.WAYBACK_CACHE ??
  '/tmp/claude-1000/-home-djoulin-projects-ekylibre-sas/4ba28799-4231-431f-97b5-b61d202c2015/scratchpad/wayback-cache';

const DELAY_MS = 1000;
const TIMEOUT_MS = 60_000;
const RETRIES = 2;
const MAX_WIDTH = 1600;
const MIN_IMAGE_BYTES = 2048;
const ALLOWED_TAGS = new Set(['actu-tech', 'communique', 'evenement', 'job', 'software-news']);

// Pages du site (pas des articles).
// Décisions éditoriales du 2026-11-03 :
// - articles dont le contenu (un PDF) n'a pas été archivé → non importés, ancienne URL redirigée vers les actualités ;
// - date WordPress réinitialisée lors d'une republication → date réelle de l'événement.
const DROPPED = new Set([
  '/des-solutions-connectees-pour-l-agriculture-quand-3-entreprises-innovantes-s-engagent/',
  '/formation-la-comptabilite-accessible-a-tous-7-11-19/',
  '/clic-and-farm-sia-2018/',
]);
const DATE_OVERRIDES = {
  '/ekylibre-1ere-entreprise-labellisee-data-agri-par-la-fnsea-jeunes-agriculteurs/': '2019-03-01',
};

const EXCLUDE = [
  /^\/$/,
  /^\/about\/$/,
  /^\/category\//,
  /^\/community\/$/,
  /^\/conditions-of-sale\/$/,
  /^\/connexions-partenaires\/$/,
  /^\/contact\/$/,
  /^\/cookies\/$/,
  /^\/custom-services\/$/,
  /^\/data-agri-(chart|infos|principles)\/$/,
  /^\/developpeurs\/$/,
  /^\/ekyagri/,
  /^\/ekyviti\/$/,
  /^\/ekyviti\/creer-mon-domaine\/$/,
  /^\/elementor-/,
  /^\/eng\//,
  /^\/equipe\//,
  /^\/faq\/$/,
  /^\/features\/$/,
  /^\/formation\/$/,
  /^\/innovation\/$/,
  /^\/jobs\/$/,
  /^\/news\/$/,
  /^\/news\/77\/$/,
  /^\/nos-offres\/$/,
  /^\/on-recrute\/$/,
  /^\/open-source\/$/,
  /^\/paiement-/,
  /^\/partners\/$/,
  /^\/press\/$/,
  /^\/sitemap\/$/,
  /^\/subscription-/,
  /^\/support/,
  /^\/terms/,
  /^\/type_/,
  /^\/clicnfarm\/$/,
];

// ---------------------------------------------------------------------------
// Réseau + cache
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;

async function politeFetch(url) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const wait = lastRequest + DELAY_MS * (attempt + 1) ** 2 - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'ekylibre-sas-site-build (archive import)' },
        redirect: 'follow',
      });
      if (res.status === 404) return { status: 404, body: null };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return {
        status: res.status,
        body: Buffer.from(await res.arrayBuffer()),
        type: res.headers.get('content-type') ?? '',
      };
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`${url} : ${lastErr?.message ?? lastErr}`);
}

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16);

async function cached(key, url) {
  const file = join(CACHE, key);
  if (await exists(file)) return readFile(file);
  if (await exists(`${file}.404`)) return null;
  const res = await politeFetch(url);
  if (!res.body) {
    await writeFile(`${file}.404`, url);
    return null;
  }
  await writeFile(file, res.body);
  return res.body;
}

/** Captures 200 d'un chemin : { first, last } (timestamp + URL d'origine). */
async function snapshots(path) {
  const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(
    `ekylibre.com${path}`,
  )}&output=json&fl=timestamp,original,statuscode&filter=statuscode:200`;
  const buf = await cached(`cdx-${hash(path)}.json`, url);
  if (!buf) return null;
  const text = buf.toString('utf8').trim();
  const rows = text ? JSON.parse(text).slice(1) : [];
  if (!rows.length) return null;
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  const [ft, fo] = rows[0];
  const [lt, lo] = rows.at(-1);
  return { first: { timestamp: ft, original: fo }, last: { timestamp: lt, original: lo } };
}

const rawUrl = (timestamp, original) =>
  `https://web.archive.org/web/${timestamp}id_/${encodeURI(decodeURIComponentSafe(original))}`;

function decodeURIComponentSafe(s) {
  try {
    return decodeURI(s);
  } catch {
    return s;
  }
}

// ---------------------------------------------------------------------------
// Analyse HTML (tokenizer tolérant, sans exécution)
// ---------------------------------------------------------------------------

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'noscript', 'template']);
// Balises fermées implicitement à l'ouverture d'une autre (sous-ensemble utile du HTML5).
const P_CLOSERS = new Set([
  'p',
  'div',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'figure',
  'blockquote',
  'section',
  'article',
  'header',
  'footer',
  'form',
  'hr',
  'pre',
  'dl',
  'nav',
  'aside',
  'address',
]);

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  euml: 'ë',
  agrave: 'à',
  acirc: 'â',
  auml: 'ä',
  ccedil: 'ç',
  icirc: 'î',
  iuml: 'ï',
  ocirc: 'ô',
  ouml: 'ö',
  ugrave: 'ù',
  ucirc: 'û',
  uuml: 'ü',
  Eacute: 'É',
  Egrave: 'È',
  Ecirc: 'Ê',
  Agrave: 'À',
  Acirc: 'Â',
  Ccedil: 'Ç',
  Icirc: 'Î',
  Ocirc: 'Ô',
  Ucirc: 'Û',
  oelig: 'œ',
  OElig: 'Œ',
  aelig: 'æ',
  euro: '€',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  times: '×',
  middot: '·',
  bull: '•',
  sbquo: '‚',
  bdquo: '„',
  prime: '′',
  thinsp: ' ',
  ensp: ' ',
  emsp: ' ',
  shy: '',
  zwnj: '',
  zwj: '',
  sup2: '²',
  sup3: '³',
  frac12: '½',
  iexcl: '¡',
  iquest: '¿',
  ntilde: 'ñ',
  szlig: 'ß',
  yuml: 'ÿ',
  rarr: '→',
  larr: '←',
  check: '✓',
};

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);?/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return m;
      return String.fromCodePoint(code);
    }
    return Object.hasOwn(NAMED_ENTITIES, e) ? NAMED_ENTITIES[e] : m;
  });
}

function parseHtml(html) {
  const root = { name: '#root', attrs: {}, children: [], parent: null };
  let cur = root;
  let i = 0;
  const n = html.length;
  const text = (value) => {
    if (value) cur.children.push({ name: '#text', value: decodeEntities(value), parent: cur });
  };
  const closeTo = (name) => {
    for (let node = cur; node && node !== root; node = node.parent) {
      if (node.name === name) {
        cur = node.parent;
        return true;
      }
    }
    return false;
  };
  const inScope = (name) => {
    for (let node = cur; node && node !== root; node = node.parent) if (node.name === name) return true;
    return false;
  };
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) {
      text(html.slice(i));
      break;
    }
    if (lt > i) text(html.slice(i, lt));
    i = lt;
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end < 0 ? n : end + 3;
      continue;
    }
    if (html[i + 1] === '!' || html[i + 1] === '?') {
      const end = html.indexOf('>', i);
      i = end < 0 ? n : end + 1;
      continue;
    }
    const close = html[i + 1] === '/';
    const m = /^<\/?([a-zA-Z][a-zA-Z0-9:-]*)/.exec(html.slice(i, i + 64));
    if (!m) {
      text('<');
      i += 1;
      continue;
    }
    const name = m[1].toLowerCase();
    i += m[0].length;
    // Attributs
    const attrs = {};
    let selfClose = false;
    while (i < n) {
      while (i < n && /\s/.test(html[i])) i++;
      if (html[i] === '>') {
        i++;
        break;
      }
      if (html[i] === '/' && html[i + 1] === '>') {
        selfClose = true;
        i += 2;
        break;
      }
      if (html[i] === '/') {
        i++;
        continue;
      }
      const am = /^[^\s=>/]+/.exec(html.slice(i, i + 256));
      if (!am) {
        i++;
        continue;
      }
      const an = am[0].toLowerCase();
      i += am[0].length;
      while (i < n && /\s/.test(html[i])) i++;
      let value = '';
      if (html[i] === '=') {
        i++;
        while (i < n && /\s/.test(html[i])) i++;
        const q = html[i];
        if (q === '"' || q === "'") {
          const end = html.indexOf(q, i + 1);
          value = html.slice(i + 1, end < 0 ? n : end);
          i = end < 0 ? n : end + 1;
        } else {
          const vm = /^[^\s>]+/.exec(html.slice(i, i + 2048));
          value = vm ? vm[0] : '';
          i += value.length;
        }
      }
      if (!(an in attrs)) attrs[an] = decodeEntities(value);
    }
    if (close) {
      if (name === 'p' && !inScope('p')) continue;
      closeTo(name);
      continue;
    }
    if (P_CLOSERS.has(name) && inScope('p')) {
      // ferme le <p> ouvert le plus proche s'il est l'ancêtre direct de la position courante
      for (let node = cur; node && node !== root; node = node.parent) {
        if (node.name === 'p') {
          cur = node.parent;
          break;
        }
        if (!['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'font'].includes(node.name)) break;
      }
    }
    if (name === 'li') {
      for (let node = cur; node && node !== root; node = node.parent) {
        if (node.name === 'li') {
          cur = node.parent;
          break;
        }
        if (node.name === 'ul' || node.name === 'ol') break;
      }
    }
    const el = { name, attrs, children: [], parent: cur };
    cur.children.push(el);
    if (VOID.has(name) || selfClose) continue;
    if (RAW_TEXT.has(name)) {
      const re = new RegExp(`</${name}\\s*>`, 'i');
      const rest = html.slice(i);
      const em = re.exec(rest);
      const end = em ? i + em.index : n;
      el.children.push({ name: '#text', value: html.slice(i, end), parent: el, raw: true });
      i = em ? end + em[0].length : n;
      continue;
    }
    cur = el;
  }
  return root;
}

const classes = (el) => (el.attrs?.class ?? '').split(/\s+/).filter(Boolean);
const hasClass = (el, c) => classes(el).includes(c);

function* walk(node) {
  for (const child of node.children ?? []) {
    yield child;
    if (child.children) yield* walk(child);
  }
}
const findAll = (node, pred) => [...walk(node)].filter((n) => n.name !== '#text' && pred(n));
const find = (node, pred) => {
  for (const n of walk(node)) if (n.name !== '#text' && pred(n)) return n;
  return null;
};
const textOf = (node) =>
  node.name === '#text' ? (node.raw ? '' : node.value) : (node.children ?? []).map(textOf).join('');

// ---------------------------------------------------------------------------
// Extraction des métadonnées
// ---------------------------------------------------------------------------

function meta(doc, key) {
  const el = find(doc, (n) => n.name === 'meta' && (n.attrs.property === key || n.attrs.name === key));
  return el?.attrs.content?.trim() || null;
}

const cleanTitle = (t) =>
  t
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–|]\s*Ekylibre\s*$/i, '')
    .replace(/\.\.\./g, '…')
    .trim();

function jsonLdDate(doc) {
  for (const el of findAll(doc, (n) => n.name === 'script' && /ld\+json/i.test(n.attrs.type ?? ''))) {
    const m = /"datePublished"\s*:\s*"([^"]+)"/.exec(el.children[0]?.value ?? '');
    if (m) return m[1];
  }
  return null;
}

const MONTHS = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
};

function frenchDate(s) {
  const m = /(\d{1,2})(?:er)?\s+([a-zéû]+)\s+(\d{4})/i.exec(s);
  const month = m && MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const isoDay = (s) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);

function extractDate(doc, article) {
  const published = isoDay(meta(doc, 'article:published_time'));
  if (published) return published;
  const ld = isoDay(jsonLdDate(doc));
  if (ld) return ld;
  const time = find(doc, (n) => n.name === 'time' && n.attrs.datetime);
  if (time && isoDay(time.attrs.datetime)) return isoDay(time.attrs.datetime);
  const metaTime = article && find(article, (n) => hasClass(n, 'meta-time'));
  if (metaTime) return frenchDate(textOf(metaTime));
  return null;
}

function truncate(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–-]+$/, '')}…`;
}

function cleanSummary(s) {
  if (!s) return '';
  return truncate(
    s
      .replace(/\s+/g, ' ')
      .replace(/\s*\[(…|\.\.\.)\]\s*$/, '')
      .trim(),
    200,
  );
}

// ---------------------------------------------------------------------------
// Conversion HTML -> Markdown
// ---------------------------------------------------------------------------

const DROP_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'nav',
  'aside',
  'footer',
  'header',
  'svg',
  'canvas',
  'link',
  'meta',
  'object',
  'embed',
  'title',
]);
const DROP_CLASS = [
  /^entry-title$/,
  /^meta$/,
  /share/i,
  /sharedaddy/,
  /jp-relatedposts/,
  /related/i,
  /comments?$/,
  /comment-respond/,
  /^post-navigation$/,
  /^nav-links$/,
  /cookie/i,
  /^wpcf7/,
  /newsletter/i,
  /^addtoany/,
  /^a2a_/,
  /^elementor-share/,
  /^elementor-post-navigation/,
  /^screen-reader-text$/,
  /^sr-only$/,
  /^fa$/,
  /^fa-/,
  /^post-tags$/,
  /^tags-links$/,
  /^author-box/,
  /^breadcrumb/,
];
const BLOCK = new Set([
  'p',
  'div',
  'section',
  'article',
  'main',
  'figure',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'table',
  'pre',
  'hr',
  'iframe',
  'video',
  'center',
  'dl',
  'dt',
  'dd',
]);

function shouldDrop(el) {
  if (DROP_TAGS.has(el.name)) return true;
  if (el.attrs['aria-hidden'] === 'true' && el.name !== 'img') return true;
  if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(el.attrs.style ?? '')) return true;
  return classes(el).some((c) => DROP_CLASS.some((re) => re.test(c)));
}

const escapeText = (s) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/([*`[\]<])/g, '\\$1')
    .replace(/(^|\s)_/g, '$1\\_')
    .replace(/_(?=\s|$)/g, '\\_');

function stripTracking(href) {
  try {
    const u = new URL(href);
    for (const k of [...u.searchParams.keys()])
      if (/^(fbclid|gclid|mc_[a-z]+|utm_[a-z]+)$/i.test(k)) u.searchParams.delete(k);
    return u.href;
  } catch {
    return href;
  }
}

/** Contexte de conversion d'un article. */
class Converter {
  constructor({ snapshot, imageFor }) {
    this.snapshot = snapshot;
    this.imageFor = imageFor; // (src, srcset) => chemin Markdown | null
    this.missingFiles = new Set();
  }

  link(href) {
    if (!href) return null;
    href = href.trim();
    if (/^(javascript|data):/i.test(href) || href === '#') return null;
    if (/^mailto:|^tel:/i.test(href)) return href;
    // Liens déjà réécrits par la Wayback Machine
    const wb = /^(?:https?:)?\/\/web\.archive\.org\/web\/\d+[a-z_]*\/(.+)$/i.exec(href);
    if (wb) href = wb[1];
    const m = /^(?:https?:)?\/\/(?:www\.)?ekylibre\.com(\/[^#?]*)?(\?[^#]*)?(#.*)?$/i.exec(href);
    if (m) {
      let path = m[1] || '/';
      if (/^\/wp-content\//.test(path)) {
        // fichiers (PDF…) : l'archive reste la seule source ; on vise la capture réelle si elle existe
        const abs = href.replace(/^\/\//, 'https://');
        const rec = uploadsIndex?.byKey.get(normKey(abs));
        if (!rec) {
          // fichier jamais archivé : lien mort, on le retire (signalé dans le rapport)
          this.missingFiles.add(abs);
          return false;
        }
        return `https://web.archive.org/web/${rec.timestamp}/${rec.original}`;
      }
      if (!/\.[a-z0-9]{2,5}$/i.test(path) && !path.endsWith('/')) path += '/';
      return path + (m[3] ?? '');
    }
    if (/^\/[^/]/.test(href) && !href.startsWith('/wp-content/')) return href;
    if (/^https?:\/\//i.test(href)) return stripTracking(href);
    return null;
  }

  /** Texte brut : échappement Markdown + shortcodes WordPress résiduels ([pdfjs-viewer url=…] -> lien). */
  text(value) {
    return value
      .split(/(\[\/?[a-z][\w-]*(?:\s[^\]]*)?\])/i)
      .map((part, i) => {
        if (i % 2 === 0) return escapeText(part);
        const url = /\burl=["']?([^\s"'\]]+)/i.exec(part)?.[1];
        const href = url && this.link(url);
        if (/^\[pdfjs-viewer/i.test(part) && href) return mdLink('Consulter le document (PDF)', href);
        // autre shortcode : supprimé ; un crochet ordinaire (ex. « [Formation] ») est conservé
        return /^\[\/?[a-z]+[_-][\w-]*|^\[\/?(embed|caption|gallery|video|audio|contact-form[\w-]*)\b/i.test(part)
          ? ''
          : escapeText(part);
      })
      .join('');
  }

  async inline(nodes) {
    let out = '';
    for (const node of nodes) out += await this.inlineNode(node);
    return out;
  }

  async inlineNode(node) {
    if (node.name === '#text') return node.raw ? '' : this.text(node.value.replace(/\s+/g, ' '));
    if (shouldDrop(node)) return '';
    const kids = () => this.inline(node.children);
    switch (node.name) {
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return wrap(await kids(), '**');
      case 'em':
      case 'i':
      case 'cite':
        return wrap(await kids(), '*');
      case 'code':
        return `\`${textOf(node).replace(/`/g, '')}\``;
      case 'img':
        return (await this.img(node)) ?? '';
      case 'a': {
        const inner = (await kids()).trim();
        const href = this.link(node.attrs.href);
        if (!inner || href === false) return '';
        // pas de lien imbriqué (lien autour d'une image ou d'un lien déjà converti)
        if (!href || inner.startsWith('![') || /\]\([^)]*\)/.test(inner)) return inner;
        return mdLink(inner.replace(/\n/g, ' '), href);
      }
      case 'sup':
      case 'sub':
      case 'span':
      case 'font':
      case 'u':
      case 'small':
      case 'mark':
      case 'abbr':
      case 'time':
      case 'label':
        return kids();
      default:
        if (BLOCK.has(node.name)) return ` ${(await this.blocks(node.children)).join(' ')} `;
        return kids();
    }
  }

  async img(node) {
    const a = node.attrs;
    let src = a['data-lazy-src'] || a['data-src'] || a['data-orig-file'] || a.src;
    if (!src || src.startsWith('data:')) return null;
    if (Number(a.width) === 1 || Number(a.height) === 1) return null;
    const alt = (a.alt ?? '').replace(/\s+/g, ' ').trim();
    const path = await this.imageFor(src, a['data-lazy-srcset'] || a['data-srcset'] || a.srcset);
    if (!path) return null;
    return `![${escapeText(alt).replace(/\n/g, ' ')}](${path})`;
  }

  /** Convertit une liste de nœuds en blocs Markdown. */
  async blocks(nodes) {
    const out = [];
    let buf = [];
    const flush = async () => {
      if (!buf.length) return;
      const text = tidyInline(await this.inline(buf));
      if (text) out.push(text);
      buf = [];
    };
    for (const node of nodes) {
      if (node.name !== '#text' && shouldDrop(node)) continue;
      if (node.name === '#text' || !BLOCK.has(node.name)) {
        buf.push(node);
        continue;
      }
      await flush();
      out.push(...(await this.block(node)));
    }
    await flush();
    return out.filter(Boolean);
  }

  async block(node) {
    const name = node.name;
    if (hasClass(node, 'elementor-widget-video')) {
      let settings = {};
      try {
        settings = JSON.parse(node.attrs['data-settings'] ?? '{}');
      } catch {}
      const url = settings.youtube_url || settings.vimeo_url;
      const id = url && /(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{6,})/.exec(url)?.[1];
      if (id) return [`[Voir la vidéo sur YouTube](https://www.youtube.com/watch?v=${id})`];
      if (url && /^https:\/\//.test(url)) return [mdLink('Voir la vidéo', url)];
      return [];
    }
    if (/^h[1-6]$/.test(name)) {
      const level = name <= 'h2' ? 2 : 3;
      const text = oneLine(tidyInline(await this.inline(node.children)));
      // les images dans un titre sont sorties à part
      const imgs = text.match(/!\[[^\]]*\]\([^)]+\)/g) ?? [];
      const plain = text
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/^\*\*(.*)\*\*$/, '$1')
        .trim();
      return [...(plain ? [`${'#'.repeat(level)} ${plain}`] : []), ...imgs];
    }
    switch (name) {
      case 'hr':
        return [];
      case 'ul':
      case 'ol':
        return [await this.list(node, name === 'ol', 0)];
      case 'blockquote': {
        const inner = await this.blocks(node.children);
        return inner.length ? [inner.map((b) => b.replace(/^/gm, '> ')).join('\n>\n')] : [];
      }
      case 'pre':
        return [`\`\`\`\n${textOf(node).replace(/\n+$/, '')}\n\`\`\``];
      case 'iframe':
      case 'video': {
        const src = node.attrs.src || find(node, (n) => n.name === 'source')?.attrs.src;
        const yt = src && /youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/.exec(src);
        if (yt) return [`[Voir la vidéo sur YouTube](https://www.youtube.com/watch?v=${yt[1]})`];
        const vimeo = src && /player\.vimeo\.com\/video\/(\d+)/.exec(src);
        if (vimeo) return [`[Voir la vidéo sur Vimeo](https://vimeo.com/${vimeo[1]})`];
        return [];
      }
      case 'figcaption': {
        const t = tidyInline(await this.inline(node.children));
        return t ? [`*${t.replace(/^\*+|\*+$/g, '')}*`] : [];
      }
      case 'table':
        return [await this.table(node)];
      default:
        return this.blocks(node.children);
    }
  }

  async list(node, ordered, depth) {
    const items = node.children.filter((c) => c.name === 'li');
    const lines = [];
    let idx = 1;
    for (const li of items) {
      const nested = li.children.filter((c) => c.name === 'ul' || c.name === 'ol');
      const rest = li.children.filter((c) => !nested.includes(c));
      const text = oneLine((await this.blocks(rest)).join(' '));
      const indent = '   '.repeat(depth);
      if (text) lines.push(`${indent}${ordered ? `${idx++}.` : '-'} ${text}`);
      for (const sub of nested) lines.push(await this.list(sub, sub.name === 'ol', depth + 1));
    }
    return lines.filter(Boolean).join('\n');
  }

  async table(node) {
    const rows = findAll(node, (n) => n.name === 'tr');
    const data = [];
    for (const tr of rows) {
      const cells = tr.children.filter((c) => c.name === 'td' || c.name === 'th');
      const row = [];
      for (const c of cells) row.push(oneLine(tidyInline(await this.inline(c.children))).replace(/\|/g, '\\|'));
      if (row.length) data.push(row);
    }
    if (!data.length) return '';
    const width = Math.max(...data.map((r) => r.length));
    const line = (r) => `| ${[...r, ...Array(width - r.length).fill('')].join(' | ')} |`;
    return [line(data[0]), `|${' --- |'.repeat(width)}`, ...data.slice(1).map(line)].join('\n');
  }
}

const mdLink = (text, href) => `[${text}](${href.replace(/[()\s<>]/g, (c) => encodeURIComponent(c))})`;

function wrap(inner, mark) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
  if (!m[2]) return inner;
  // pas d'emphase autour d'une image seule
  if (/^!\[[^\]]*\]\([^)]+\)$/.test(m[2])) return inner;
  return `${m[1]}${mark}${m[2]}${mark}${m[3]}`;
}

const oneLine = (s) =>
  s
    .replace(/\\?\n+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

function tidyInline(s) {
  return s
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\]\(([^)\s]+)\)\[[^\]]*\]\(\1\)/g, ']($1)')
    .replace(/\)\[/g, ') [')
    .replace(/([^\s(\[])\[(https?:\/\/)/g, '$1 [$2')
    .replace(/([^\s*\\])\*\[/g, '$1* [')
    .replace(/\*\*\*\*/g, '')
    .replace(/\*\*(\s*)\*\*/g, '$1')
    .split(/\n{2,}/) // <br><br> : nouveau paragraphe
    .map((group) =>
      group
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\\\n'),
    )
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function finalizeMarkdown(blocks) {
  return (
    blocks
      .map((b) => b.trim())
      .filter((b) => b && !/^(\*+|\\)$/.test(b))
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

function imageName(src, used) {
  let base = decodeURIComponentSafe(src.split(/[?#]/)[0].split('/').pop() || 'image');
  base =
    base
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/-\d+x\d+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image';
  let name = base;
  for (let k = 2; used.has(name); k++) name = `${base}-${k}`;
  used.add(name);
  return name;
}

const TRACKERS =
  /(facebook\.com\/tr|google-analytics|doubleclick|pixel|gravatar\.com|stats\.wp\.com|\/emoji\/|s\.w\.org)/i;

function absoluteImageUrl(src, original) {
  src = src.trim();
  const wb = /^(?:https?:)?\/\/web\.archive\.org\/web\/\d+[a-z_]*\/(.+)$/i.exec(src);
  if (wb) src = wb[1];
  try {
    return new URL(src, original).href;
  } catch {
    return null;
  }
}

// Index des fichiers de wp-content/uploads réellement archivés (une seule requête CDX).
// Les images des captures pointent souvent vers une taille jamais archivée : on retrouve
// alors la meilleure variante disponible (original, sinon la plus grande miniature).
let uploadsIndex;
const normKey = (u) =>
  decodeURIComponentSafe(u.replace(/^https?:\/\/(www\.)?[^/]+/i, ''))
    .normalize('NFC')
    .toLowerCase();
const stemOf = (key) => {
  const m = /^(.*?)(?:-(\d+)x(\d+))?(?:-[a-z0-9]{40,})?\.([a-z0-9]+)$/.exec(key);
  return m ? { stem: `${m[1]}.${m[4]}`, width: m[2] ? Number(m[2]) : Infinity } : { stem: key, width: Infinity };
};

async function loadUploadsIndex() {
  if (uploadsIndex) return uploadsIndex;
  const url =
    'https://web.archive.org/cdx/search/cdx?url=ekylibre.com/wp-content/uploads/*&output=json' +
    '&fl=timestamp,original,statuscode,length&filter=statuscode:200&collapse=urlkey';
  const buf = await cached('cdx-uploads.json', url);
  const rows = buf ? JSON.parse(buf.toString('utf8') || '[]').slice(1) : [];
  uploadsIndex = { byKey: new Map(), byStem: new Map(), byName: new Map() };
  for (const [timestamp, original, , length] of rows) {
    const key = normKey(original);
    const rec = { timestamp, original, length: Number(length) || 0, key };
    uploadsIndex.byKey.set(key, rec);
    const { stem, width } = stemOf(key);
    rec.width = width;
    for (const [map, k] of [
      [uploadsIndex.byStem, stem],
      [uploadsIndex.byName, stem.split('/').pop()],
    ]) {
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(rec);
    }
  }
  return uploadsIndex;
}

/** Choisit la capture d'image à télécharger pour une liste d'URL candidates (par ordre de préférence). */
async function resolveImage(candidates) {
  const idx = await loadUploadsIndex();
  const keys = candidates.map(normKey);
  for (const k of keys) if (idx.byKey.has(k)) return idx.byKey.get(k);
  const best = (list) =>
    list && list.length ? [...list].sort((a, b) => b.width - a.width || b.length - a.length)[0] : null;
  for (const k of keys) {
    const hit = best(idx.byStem.get(stemOf(k).stem));
    if (hit) return hit;
  }
  for (const k of keys) {
    // miniatures Elementor (elementor/thumbs/<nom>-<hash>.png) ou autre dossier : même nom de fichier
    const name = stemOf(k).stem.split('/').pop();
    const hit = best(idx.byName.get(name));
    if (hit) return hit;
  }
  return null;
}

async function downloadImage(candidates, destFile, snapshot) {
  if (await exists(destFile)) return { ok: true, cached: true };
  const local = candidates.filter((u) => /^https?:\/\/(www\.)?ekylibre\.(com|dev)\b/i.test(u));
  let rec = local.length ? await resolveImage(local) : null;
  // image externe : on tente la capture la plus proche de l'article
  if (!rec && !local.length) rec = { timestamp: snapshot.timestamp, original: candidates.at(-1), length: 0 };
  if (!rec) throw new Error('non archivée');
  if (rec.length && rec.length < MIN_IMAGE_BYTES / 2) throw new Error(`trop petite (${rec.length} o compressés)`);
  const buf = await cached(`img-${hash(rec.original)}`, rawUrl(rec.timestamp, rec.original));
  if (!buf) throw new Error('404');
  if (buf.length < MIN_IMAGE_BYTES) throw new Error(`trop petite (${buf.length} o)`);
  const img = sharp(buf, { animated: true, failOn: 'none' });
  const metaData = await img.metadata();
  if (!metaData.width || metaData.width < 16) throw new Error('pas une image exploitable');
  await mkdir(dirname(destFile), { recursive: true });
  await img.resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(destFile);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

function contentRoot(doc) {
  const elementor = find(doc, (n) => hasClass(n, 'elementor-widget-theme-post-content'));
  if (elementor) return find(elementor, (n) => hasClass(n, 'elementor-widget-container')) ?? elementor;
  const entry = find(doc, (n) => hasClass(n, 'entry-content'));
  if (entry) return entry;
  return find(doc, (n) => n.name === 'article');
}

function isArticle(doc) {
  const body = find(doc, (n) => n.name === 'body');
  const bodyClasses = body ? classes(body) : [];
  if (bodyClasses.includes('single-post')) return true;
  if (meta(doc, 'og:type') === 'article' && meta(doc, 'article:published_time')) return true;
  return Boolean(find(doc, (n) => n.name === 'article' && hasClass(n, 'type-post')));
}

function categories(doc) {
  const tags = new Set();
  for (const a of findAll(doc, (n) => n.name === 'a' && /category/.test(n.attrs.rel ?? ''))) {
    const m = /\/category\/([^/]+)\/?/.exec(a.attrs.href ?? '');
    if (m && ALLOWED_TAGS.has(m[1])) tags.add(m[1]);
  }
  const art = find(doc, (n) => n.name === 'article' && hasClass(n, 'type-post'));
  for (const c of art ? classes(art) : []) {
    const m = /^category-(.+)$/.exec(c);
    if (m && ALLOWED_TAGS.has(m[1])) tags.add(m[1]);
  }
  return [...tags].sort();
}

async function importArticle(path) {
  const slug = path
    .replace(/^\/|\/$/g, '')
    .replace(/\//g, '-')
    .toLowerCase();
  const entry = { slug, legacyUrl: path, status: 'failed', reason: '', images: { ok: 0, failed: 0 } };
  const snaps = await snapshots(path);
  if (!snaps) return { ...entry, status: 'skipped', reason: 'aucune capture 200 dans la Wayback Machine' };
  const snapshot = snaps.last;
  const htmlBuf = await cached(
    `page-${hash(path)}-${snapshot.timestamp}.html`,
    rawUrl(snapshot.timestamp, snapshot.original),
  );
  if (!htmlBuf) return { ...entry, reason: 'capture introuvable' };
  const doc = parseHtml(htmlBuf.toString('utf8'));

  if (!isArticle(doc))
    return { ...entry, status: 'skipped', reason: "page d'atterrissage (pas de date ni de corps d'article)" };
  const root = contentRoot(doc);
  if (!root) return { ...entry, status: 'skipped', reason: "pas de corps d'article" };

  const article = find(doc, (n) => n.name === 'article');
  const headline = article && find(article, (n) => /^h[12]$/.test(n.name));
  const title = cleanTitle(
    meta(doc, 'og:title') ??
      (headline && textOf(headline)) ??
      textOf(find(doc, (n) => n.name === 'title') ?? { name: '#text', value: slug }),
  );
  let date = DATE_OVERRIDES[entry.legacyUrl] ?? extractDate(doc, article);
  const dateApprox = !date;
  if (!date) {
    const t = snaps.first.timestamp;
    date = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
  }
  const summary = cleanSummary(meta(doc, 'og:description') ?? meta(doc, 'description'));
  const tags = categories(doc);

  // Images
  const assetDir = join(OUT_ASSETS, slug);
  const used = new Set(['cover']);
  const byUrl = new Map();
  const wanted = new Set();
  const failures = [];
  const imageFor = async (src, srcset, forcedName) => {
    const url = absoluteImageUrl(src, snapshot.original);
    if (!url || TRACKERS.test(url) || !/^https?:/.test(url)) return null;
    // préférence : plus grande variante du srcset, puis src
    const variants = (srcset ?? '')
      .split(/,\s+(?=\S)/)
      .map((c) => c.trim().split(/\s+/))
      .filter(([u]) => u)
      .map(([u, w]) => ({ u: absoluteImageUrl(u, snapshot.original), w: parseInt(w, 10) || 0 }))
      .filter((v) => v.u)
      .sort((a, b) => b.w - a.w)
      .map((v) => v.u);
    const candidates = [...variants, url];
    const key = forcedName ? `${forcedName}:${url}` : url;
    if (byUrl.has(key)) return byUrl.get(key);
    const name = forcedName ?? imageName(url, used);
    const file = `${name}.webp`;
    try {
      await downloadImage(candidates, join(assetDir, file), snapshot);
      entry.images.ok++;
      wanted.add(file);
      const rel = `../../../assets/news/${slug}/${file}`;
      byUrl.set(key, rel);
      return rel;
    } catch (err) {
      entry.images.failed++;
      failures.push(`${url} (${err.message})`);
      byUrl.set(key, null);
      return null;
    }
  };

  const converter = new Converter({ snapshot, imageFor });
  const body = finalizeMarkdown(await converter.blocks(root.children));
  const ogImage = meta(doc, 'og:image');
  const cover = ogImage ? await imageFor(ogImage, '', 'cover') : null;

  // Nettoyage des images orphelines d'une exécution précédente
  if (await exists(assetDir)) {
    for (const f of await readdir(assetDir)) if (!wanted.has(f)) await unlink(join(assetDir, f));
  }

  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${date}`,
    `dateApprox: ${dateApprox}`,
    'lang: fr',
    `translationKey: ${slug}`,
    `summary: ${JSON.stringify(summary)}`,
    ...(cover ? [`cover: ${cover}`] : []),
    `legacyUrl: ${path}`,
    `tags: [${tags.join(', ')}]`,
    `source: https://web.archive.org/web/${snapshot.timestamp}/${snapshot.original}`,
    '---',
    '',
  ].join('\n');
  await writeFile(join(OUT_MD, `${slug}.md`), `${fm}${body}`);

  const words = body
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
  return {
    ...entry,
    status: 'ok',
    reason: [
      dateApprox ? 'date approximative (première capture)' : '',
      words < 60 ? `corps court (${words} mots)` : '',
      failures.length ? `images en échec : ${failures.join(' ; ')}` : '',
      converter.missingFiles.size ? `fichiers liés non archivés : ${[...converter.missingFiles].join(' ; ')}` : '',
    ]
      .filter(Boolean)
      .join(' | '),
    date,
    words,
    snapshot: snapshot.timestamp,
  };
}

// ---------------------------------------------------------------------------

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(OUT_MD, { recursive: true });
  await mkdir(OUT_ASSETS, { recursive: true });
  await loadUploadsIndex();
  const paths = (await readFile(URL_LIST, 'utf8'))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('/'))
    .map((l) => (l.endsWith('/') ? l : `${l}/`))
    .filter((p) => !EXCLUDE.some((re) => re.test(p)) && !DROPPED.has(p))
    .filter((p) => !ONLY || p.replace(/\//g, '') === ONLY);

  const previous = (await exists(REPORT)) ? JSON.parse(await readFile(REPORT, 'utf8')) : [];
  const report = ONLY ? previous.filter((r) => !paths.includes(r.legacyUrl)) : [];
  for (const path of paths) {
    let res;
    try {
      res = await importArticle(path);
    } catch (err) {
      res = {
        slug: path.replace(/\//g, ''),
        legacyUrl: path,
        status: 'failed',
        reason: String(err.message ?? err),
        images: { ok: 0, failed: 0 },
      };
    }
    report.push(res);
    console.log(`${res.status.padEnd(7)} ${path}${res.reason ? `  — ${res.reason.slice(0, 160)}` : ''}`);
  }
  report.sort((a, b) => a.legacyUrl.localeCompare(b.legacyUrl));
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  const count = (s) => report.filter((r) => r.status === s).length;
  console.log(`\n${count('ok')} importés, ${count('skipped')} ignorés, ${count('failed')} en échec.`);
}

await main();
