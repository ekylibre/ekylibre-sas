// Serveur statique minimal pour les tests Playwright : sert dist/ comme GitHub Pages.
// - le site est monté sous BASE_PATH (« / » ou « /ekylibre-sas/ ») ;
// - /chemin → 301 vers /chemin/ si c'est un dossier ; /chemin/ → /chemin/index.html ;
// - toute URL inconnue → dist/404.html avec le statut 404.
// Usage : node tests/server.mjs [port]   (PORT et BASE_PATH lus dans l'environnement)
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.env.DIST_DIR ?? 'dist');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4322);
const base = `/${(process.env.BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
};

const stat = (p) => {
  try {
    return statSync(p);
  } catch {
    return null;
  }
};

function send(res, file, status = 200) {
  res.writeHead(status, {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
}

function notFound(res) {
  const page = join(root, '404.html');
  if (stat(page)) return send(res, page, 404);
  res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return notFound(res);
  }
  if (`${pathname}/` === base) {
    res.writeHead(301, { Location: base + url.search }).end();
    return;
  }
  if (!pathname.startsWith(base)) return notFound(res);
  const rel = normalize(pathname.slice(base.length)).replace(/^(\.\.[/\\])+/, '');
  const target = join(root, rel);
  if (!target.startsWith(root)) return notFound(res);
  const info = stat(target);
  if (info?.isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    const index = join(target, 'index.html');
    return stat(index) ? send(res, index) : notFound(res);
  }
  if (info?.isFile()) return send(res, target);
  return notFound(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`dist/ servi sur http://127.0.0.1:${port}${base}`);
});
