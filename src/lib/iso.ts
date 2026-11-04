// Géométrie isométrique (30°) pour les schémas au trait (docs/design/03-outils-lyvre.md §4.1).
// Exécutée au build uniquement : le navigateur ne reçoit que des chemins SVG.
// Repère : x vers le bas à droite, y vers le bas à gauche, z vers le haut. Le spectateur regarde
// depuis +x +y : les faces visibles d'un pavé sont le dessus, la face y = y+d (gauche) et x = x+w (droite).

export type Point3 = readonly [number, number, number];
export type Point2 = readonly [number, number];

export const COS30 = Math.cos(Math.PI / 6);

export interface Projection {
  /** Position écran de l'origine du monde. */
  ox: number;
  oy: number;
  /** Échelle (unités écran par unité monde). */
  scale: number;
}

const round = (n: number) => Math.round(n * 10) / 10;

export function project([x, y, z]: Point3, p: Projection): Point2 {
  return [round(p.ox + (x - y) * COS30 * p.scale), round(p.oy + ((x + y) / 2 - z) * p.scale)];
}

/** Polyligne (fermée par défaut) → attribut `d`. */
export function path(points: readonly Point3[], p: Projection, close = true): string {
  const d = points.map((pt, i) => `${i ? 'L' : 'M'}${project(pt, p).join(' ')}`).join('');
  return close ? `${d}Z` : d;
}

export interface BoxFaces {
  top: string;
  left: string;
  right: string;
}

/** Pavé : coin (x, y, z), largeur w (axe x), profondeur d (axe y), hauteur h. */
export function box(x: number, y: number, z: number, w: number, d: number, h: number, p: Projection): BoxFaces {
  const t = z + h;
  return {
    top: path(
      [
        [x, y, t],
        [x + w, y, t],
        [x + w, y + d, t],
        [x, y + d, t],
      ],
      p,
    ),
    left: path(
      [
        [x, y + d, z],
        [x + w, y + d, z],
        [x + w, y + d, t],
        [x, y + d, t],
      ],
      p,
    ),
    right: path(
      [
        [x + w, y, z],
        [x + w, y + d, z],
        [x + w, y + d, t],
        [x + w, y, t],
      ],
      p,
    ),
  };
}

/** Demi-axes écran de l'ellipse projetée d'un cercle horizontal de rayon r. */
export function ellipseRadii(r: number, p: Projection): Point2 {
  return [round(r * Math.SQRT2 * COS30 * p.scale), round((r * Math.SQRT2 * p.scale) / 2)];
}

export interface CylinderFaces {
  /** Ellipse du dessus. */
  top: string;
  /** Flanc visible (rectangle + demi-ellipse basse). */
  side: string;
}

/** Cylindre vertical : centre de la base (cx, cy, z), rayon r, hauteur h. */
export function cylinder(cx: number, cy: number, z: number, r: number, h: number, p: Projection): CylinderFaces {
  const [rx, ry] = ellipseRadii(r, p);
  const [bx, by] = project([cx, cy, z], p);
  const [, ty] = project([cx, cy, z + h], p);
  const top = `M${round(bx - rx)} ${ty}A${rx} ${ry} 0 1 0 ${round(bx + rx)} ${ty}A${rx} ${ry} 0 1 0 ${round(bx - rx)} ${ty}Z`;
  const side = `M${round(bx - rx)} ${ty}L${round(bx - rx)} ${by}A${rx} ${ry} 0 0 0 ${round(bx + rx)} ${by}L${round(bx + rx)} ${ty}Z`;
  return { top, side };
}

/** Courbe quadratique entre deux points écran, bombée de `bend` (perpendiculaire, en unités écran). */
export function curve(a: Point2, b: Point2, bend = 0): string {
  const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy) || 1;
  const c: Point2 = [round(mx - (dy / len) * bend), round(my + (dx / len) * bend)];
  return `M${a.join(' ')}Q${c.join(' ')} ${b.join(' ')}`;
}

/** Point de la courbe quadratique en t (pour placer une étiquette). */
export function curvePoint(a: Point2, b: Point2, bend: number, t = 0.5): Point2 {
  const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy) || 1;
  const c = [mx - (dy / len) * bend, my + (dx / len) * bend];
  const u = 1 - t;
  return [round(u * u * a[0] + 2 * u * t * c[0]! + t * t * b[0]), round(u * u * a[1] + 2 * u * t * c[1]! + t * t * b[1])];
}
