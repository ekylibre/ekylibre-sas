// C4 — ConnectorLayer : un médaillon par zone de la ferme (langage du « schéma de flux » de la doc).
// Le médaillon est un <button> HTML positionné en 3D (CSS2D) : net, accessible au clavier, stylé en CSS.
// Dans la scène : un fil vertical relie le médaillon au sol, un anneau pulse au pied.
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
} from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { AnchorRegistry } from './anchors';
import type { Stage } from './stage';
import type { FarmSceneProps, SceneConnector } from './types';

export const GREEN = new Color('#00c15d');
export const GREEN_LIGHT = new Color('#4ed164');

export interface ConnectorLayer {
  group: Group;
  /** Zones qui portent au moins un connecteur (hors cœur). */
  zones: Map<string, SceneConnector[]>;
  setVisible(zoneIds: Set<string> | 'all'): void;
}

const iconSvg = (sprite: string, name: string) =>
  `<svg class="icon" aria-hidden="true" focusable="false"><use href="${sprite}#i-${name}"></use></svg>`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

export function createConnectorLayer(stage: Stage, anchors: AnchorRegistry, props: FarmSceneProps): ConnectorLayer {
  const group = new Group();
  group.name = 'connectors';
  const zones = new Map<string, SceneConnector[]>();
  for (const c of props.connectors) {
    const list = zones.get(c.zone) ?? [];
    list.push(c);
    zones.set(c.zone, list);
  }

  const stems: number[] = [];
  const rings: Mesh[] = [];
  const ringMaterial = new MeshBasicMaterial({
    color: GREEN_LIGHT,
    transparent: true,
    opacity: 0.55,
    side: DoubleSide,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const ringGeometry = new RingGeometry(2.2, 3, 40).rotateX(-Math.PI / 2);
  const markers = new Map<string, CSS2DObject>();

  const ids = ['hub', ...[...zones.keys()].filter((z) => z !== 'hub')];
  for (const zoneId of ids) {
    const anchor = anchors.get(zoneId);
    const meta = props.zones[zoneId];
    if (!anchor || !meta) continue;
    const list = zones.get(zoneId) ?? [];
    const isHub = zoneId === 'hub';

    const ground = anchors.groundAt(anchor.x, anchor.z) ?? anchor.y - 8;
    stems.push(anchor.x, ground, anchor.z, anchor.x, anchor.y - 1.5, anchor.z);
    const ring = new Mesh(ringGeometry, ringMaterial.clone());
    ring.position.set(anchor.x, ground + 0.4, anchor.z);
    ring.userData.phase = rings.length * 0.7;
    rings.push(ring);
    group.add(ring);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scene-medallion${isHub ? ' is-hub' : ''}`;
    button.dataset.zone = zoneId;
    const partners = [...new Set(list.map((c) => c.partner ?? c.title))].slice(0, 2).join(' · ');
    const subtitle = isHub ? props.strings['hub.subtitle'] : partners;
    button.innerHTML =
      `<span class="scene-medallion__disc">${iconSvg(props.iconSprite, meta.icon)}</span>` +
      `<span class="scene-medallion__label"><strong>${escapeHtml(isHub ? 'Ekylibre' : meta.title)}</strong>` +
      (subtitle ? ` <span>${escapeHtml(subtitle)}</span>` : '') +
      `</span>`;
    // Le nom accessible commence par le texte visible, à l'identique (WCAG 2.5.3 « Label in Name »),
    // puis donne la liste complète des connecteurs.
    const connectorsList = list.map((c) => c.title).join(', ');
    button.setAttribute(
      'aria-label',
      `${[isHub ? 'Ekylibre' : meta.title, subtitle].filter(Boolean).join(', ')}${connectorsList ? ` — ${connectorsList}` : ''}`,
    );
    button.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('eky:select', { detail: { kind: 'zone', id: zoneId, origin: button } }));
    });
    const label = new CSS2DObject(button);
    label.position.copy(anchor);
    label.center.set(0.5, 0.5);
    markers.set(zoneId, label);
    group.add(label);
  }

  const stemGeometry = new BufferGeometry();
  stemGeometry.setAttribute('position', new Float32BufferAttribute(stems, 3));
  group.add(
    new LineSegments(
      stemGeometry,
      new LineBasicMaterial({ color: GREEN_LIGHT, transparent: true, opacity: 0.7, toneMapped: false }),
    ),
  );
  stage.scene.add(group);

  // Pulsation des anneaux au sol (désactivée en mouvement réduit par l'appelant).
  stage.onFrame((_dt, t) => {
    for (const ring of rings) {
      const k = (((t * 0.5 + (ring.userData.phase as number)) % 1) + 1) % 1;
      ring.scale.setScalar(1 + k * 1.6);
      (ring.material as MeshBasicMaterial).opacity = 0.6 * (1 - k);
    }
    return true;
  });

  return {
    group,
    zones,
    setVisible(visible) {
      for (const [id, marker] of markers) {
        const on = visible === 'all' || visible.has(id) || id === 'hub';
        marker.visible = on;
      }
      stage.invalidate();
    },
  };
}
