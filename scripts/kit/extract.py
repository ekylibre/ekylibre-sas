#!/usr/bin/env python3
"""Kit isométrique, étape 2 (docs/design/04-accueil-kit-connecteurs.md §5.3).

Découpe les éléments décrits dans docs/kit-isometrique/elements.yaml dans les SVG convertis par
scripts/kit/convert.mjs, puis les nettoie (Inkscape --vacuum-defs) et les optimise (svgo).

    python3 -I scripts/kit/extract.py            tous les éléments
    python3 -I scripts/kit/extract.py id1 id2    seulement ceux-là

Règle de sélection : un objet de premier niveau du calque est gardé si sa boîte englobante
(inkscape --query-all) est entièrement dans `rect`, et s'il n'est pas dans `exclude`.
`exclude_fill` écarte aussi les tracés de ces couleurs ; `drop_larger` (fraction) écarte les objets
presque aussi grands que le cadre (fond et anneau d'un médaillon).
Bibliothèque standard et Pillow (WebP) ; le YAML est lu via le paquet `yaml` du projet (Node).
"""
import copy
import gzip
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KIT = os.environ.get('KIT_OUT', os.path.expanduser('~/Documents/archive_ekylibre/kit-isometrique'))
ELEMENTS = os.path.join(ROOT, 'docs/kit-isometrique/elements.yaml')
DEST = os.path.join(ROOT, 'src/assets/kit')
INKSCAPE = os.environ.get('INKSCAPE', '/snap/bin/inkscape')
WORK = os.path.join(KIT, 'work', 'extract')  # dossier lisible par Inkscape (snap)
SVGO = os.path.join(ROOT, 'node_modules/.bin/svgo')
SVGO_CONFIG = os.path.join(ROOT, 'scripts/kit/svgo.config.mjs')
NODE = os.environ.get('NODE', 'node')
SVG_NS = 'http://www.w3.org/2000/svg'
XLINK = '{http://www.w3.org/1999/xlink}href'
N = '{%s}' % SVG_NS
ET.register_namespace('', SVG_NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
REF = re.compile(r'url\(#([^)]+)\)')
LIMIT_GZIP = 40_000  # D37 : au-delà, le schéma utilise une WebP dérivée
RASTER_WIDTH = 960  # largeur de la WebP dérivée (2× la plus grande taille d'affichage prévue)


def load_elements():
    js = "const {parse}=require('yaml');process.stdout.write(JSON.stringify(parse(require('fs').readFileSync(process.argv[1],'utf8'))))"
    out = subprocess.run([NODE, '-e', js, ELEMENTS], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def source_paths(source):
    svg = os.path.join(KIT, 'svg', source[:-4] + '__svg.svg' if source.lower().endswith('.svg') else source + '.svg')
    csv = os.path.join(KIT, 'bbox', source + '.csv')
    return svg, csv


_cache = {}


def load_source(source):
    if source not in _cache:
        svg, csv = source_paths(source)
        tree = ET.parse(svg)
        boxes = {}
        with open(csv) as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) == 5:
                    boxes[parts[0]] = tuple(float(v) for v in parts[1:])
        root = tree.getroot()
        defs = {}
        for d in root.iter(N + 'defs'):
            for child in d.iter():
                if child.get('id'):
                    defs[child.get('id')] = child
        layer = next(c for c in root if c.tag == N + 'g')
        _cache[source] = (root, layer, boxes, defs)
    return _cache[source]


def refs(el):
    found = set()
    for node in el.iter():
        for k, v in node.attrib.items():
            if k == XLINK and v.startswith('#'):
                found.add(v[1:])
            else:
                found.update(REF.findall(v))
    return found


def fills(el):
    out = set()
    for node in el.iter():
        m = re.search(r'fill:(#[0-9a-fA-F]{6})', node.get('style', ''))
        if m:
            out.add(m.group(1).lower())
    return out


def extract(e):
    root, layer, boxes, defs = load_source(e['source'])
    x, y, w, h = e['rect']
    exclude = set(e.get('exclude', []))
    exclude_fill = {c.lower() for c in e.get('exclude_fill', [])}
    drop = e.get('drop_larger')  # écarte les objets plus grands que cette fraction du cadre (fond de médaillon)
    kept = []
    for child in layer:
        cid = child.get('id')
        b = boxes.get(cid)
        if not b or cid in exclude:
            continue
        bx, by, bw, bh = b
        if bx >= x and by >= y and bx + bw <= x + w and by + bh <= y + h:
            if drop and (bw > drop * w or bh > drop * h):
                continue
            if exclude_fill and child.tag == N + 'path' and fills(child) <= exclude_fill:
                continue
            kept.append(child)
    # defs référencés, récursivement
    need, seen = set(), set()
    for k in kept:
        need |= refs(k)
    while need - seen:
        i = (need - seen).pop()
        seen.add(i)
        if i in defs:
            need |= refs(defs[i])
    svg = ET.Element(N + 'svg', {'viewBox': f'{x} {y} {w} {h}', 'width': str(w), 'height': str(h)})
    d = ET.SubElement(svg, N + 'defs')
    for i in sorted(seen):
        if i in defs:
            d.append(copy.deepcopy(defs[i]))
    g = ET.SubElement(svg, N + 'g', {k: v for k, v in layer.attrib.items() if k != 'id'})
    for k in kept:
        g.append(copy.deepcopy(k))
    return svg, len(kept)


def main():
    elements = load_elements()
    wanted = set(sys.argv[1:])
    os.makedirs(WORK, exist_ok=True)
    manifest_path = os.path.join(DEST, 'kit.json')
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {'elements': []}
    by_id = {m['id']: m for m in manifest['elements']}
    for e in elements:
        if wanted and e['id'] not in wanted:
            continue
        svg, count = extract(e)
        raw = os.path.join(WORK, e['id'] + '.raw.svg')
        clean = os.path.join(WORK, e['id'] + '.svg')
        ET.ElementTree(svg).write(raw, xml_declaration=True, encoding='utf-8')
        subprocess.run([INKSCAPE, raw, '--vacuum-defs', '--export-type=svg', '--export-plain-svg',
                        f'--export-filename={clean}'], capture_output=True, check=True)
        out_dir = os.path.join(DEST, e['category'])
        os.makedirs(out_dir, exist_ok=True)
        dest = os.path.join(out_dir, e['id'] + '.svg')
        subprocess.run([SVGO, '--config', SVGO_CONFIG, '-i', clean, '-o', dest], cwd=ROOT, capture_output=True, check=True)
        # WebP dérivée (D37) : Astro ne rastérise pas les SVG sans option dangereuse ; on la produit ici.
        png = os.path.join(WORK, e['id'] + '.png')
        subprocess.run([INKSCAPE, dest, '--export-type=png', f'--export-width={RASTER_WIDTH}',
                        f'--export-filename={png}'], capture_output=True, check=True)
        from PIL import Image  # Pillow système (lancer avec python3 -I)
        Image.open(png).save(os.path.join(out_dir, e['id'] + '.webp'), 'WEBP', quality=85, method=6)
        data = open(dest, 'rb').read()
        gz = len(gzip.compress(data, 9))
        x, y, w, h = e['rect']
        by_id[e['id']] = {
            'id': e['id'],
            'category': e['category'],
            'title': e['title'],
            'source': e['source'],
            'file': f"{e['category']}/{e['id']}.svg",
            'raster': f"{e['category']}/{e['id']}.webp",
            'viewBox': [x, y, w, h],
            'foot': e.get('foot', [0.5, 1]),
            'objects': count,
            'bytes': len(data),
            'gzipBytes': gz,
        }
        alert = '  ⚠ > 40 Ko gzip (WebP dérivée, D37)' if gz > LIMIT_GZIP else ''
        print(f"✓ {e['id']} : {count} objets, {len(data) / 1000:.0f} Ko, {gz / 1000:.0f} Ko gzip{alert}")
    order = [e['id'] for e in elements]
    manifest['elements'] = sorted(by_id.values(), key=lambda m: order.index(m['id']) if m['id'] in order else 1e9)
    manifest['elements'] = [m for m in manifest['elements'] if m['id'] in order]
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write('\n')


if __name__ == '__main__':
    main()
