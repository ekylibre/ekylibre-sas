// Contrats partagés entre la page (Astro) et l'îlot 3D (docs/design/02-architecture.md §8.2).
import type { Tier } from './quality';

export type Vec3 = [number, number, number];

export interface CameraView {
  position: Vec3;
  cible: Vec3;
  /** Champ de vision pour lequel la vue a été cadrée ; absent = vue de la maquette (40°). */
  fov?: number;
}

export interface SceneManifest {
  title: string;
  frame: string;
  assets: Record<'hero' | 'full', { file: string; bytes: number; trees: number; sha256: string }>;
  views: Record<string, CameraView>;
  zones: Record<string, ZoneDef>;
}

/** Zone d'ancrage : sur un objet glTF nommé, ou à une position (x, z) dont la hauteur est lue sur le terrain. */
export interface ZoneDef {
  node?: string;
  xz?: [number, number];
  /** Hauteur du marqueur au-dessus de l'ancre, en mètres. */
  lift?: number;
  /** Libellé interne (documentation du manifeste). */
  label?: string;
}

/** Connecteur affiché dans la scène (sous-ensemble de ConnectorView, déjà traduit). */
export interface SceneConnector {
  slug: string;
  category: string;
  icon: string;
  zone: string;
  dataFlow: 'in' | 'out' | 'both';
  title: string;
  summary: string;
  partner?: string | undefined;
  partnerUrl?: string | undefined;
  version: string;
  repoUrl: string;
}

export interface SceneDataset {
  name: string;
  label: string;
  provider: string;
  rows: number;
  scope: 'open' | 'members';
  href: string;
}

export interface SceneFamily {
  id: string;
  icon: string;
  title: string;
  color: string;
  rows: number;
  datasets: SceneDataset[];
}

export interface SceneZoneMeta {
  title: string;
  icon: string;
}

export interface FarmSceneProps {
  mode: 'hero' | 'explore';
  lang: 'fr' | 'en';
  manifestUrl: string;
  modelUrl: string;
  /** Vue caméra initiale (clé de manifest.views). */
  view: string;
  /** Position horizontale de la cible à l'écran (0 = gauche, 0,5 = centre), sur grand écran. */
  focusX?: number;
  /** Désactive l'orbite automatique (captures, débogage). */
  still?: boolean;
  connectors: SceneConnector[];
  families: SceneFamily[];
  zones: Record<string, SceneZoneMeta>;
  iconSprite: string;
  strings: Record<string, string>;
}

export interface SelectDetail {
  kind: 'zone' | 'family';
  id: string;
  /** Élément à qui rendre le focus à la fermeture de la fiche. */
  origin?: HTMLElement;
}

export interface ReadyDetail {
  tier: Tier;
}
export interface FallbackDetail {
  reason: string;
}

declare global {
  interface DocumentEventMap {
    'eky:ready': CustomEvent<ReadyDetail>;
    'eky:fallback': CustomEvent<FallbackDetail>;
    'eky:chapter': CustomEvent<{ id: string; progress?: number }>;
    'eky:select': CustomEvent<SelectDetail>;
  }
}
