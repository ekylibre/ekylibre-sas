// C5 — FlowLayer : flux de données en arc de chaque zone vers le cœur (Ekylibre).
// Ligne épaisse en tirets dont le décalage défile (« paquets » de données), doublée d'un halo
// additif large et transparent qui tient lieu de lueur sans post-traitement.
// Deux verts comme dans le schéma de flux de la doc : vert Ekylibre pour l'entrant, vert clair pour le sortant.
import { AdditiveBlending, CatmullRomCurve3, Group, Vector2, Vector3 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { AnchorRegistry } from './anchors';
import { GREEN, GREEN_LIGHT } from './connectors';
import type { Stage } from './stage';
import type { SceneConnector } from './types';

export interface Flow {
  zone: string;
  line: Line2;
  halo: Line2;
  material: LineMaterial;
  direction: 1 | -1;
}

export interface FlowLayer {
  group: Group;
  flows: Flow[];
  setVisible(zoneIds: Set<string> | 'all'): void;
  /** Arc libre entre deux points (utilisé pour Aiffel et la constellation). */
  arc(from: Vector3, to: Vector3, lift: number): Vector3[];
}

function arc(from: Vector3, to: Vector3, lift: number): Vector3[] {
  const mid = from.clone().lerp(to, 0.5);
  mid.y = Math.max(from.y, to.y) + lift;
  return new CatmullRomCurve3([from, mid, to], false, 'centripetal').getPoints(64);
}

export function createFlowLayer(
  stage: Stage,
  anchors: AnchorRegistry,
  zones: Map<string, SceneConnector[]>,
  animate: boolean,
): FlowLayer {
  const group = new Group();
  group.name = 'flows';
  const hub = anchors.get('hub');
  const flows: Flow[] = [];
  const resolution = new Vector2(1, 1);

  if (hub) {
    for (const [zoneId, list] of zones) {
      if (zoneId === 'hub') continue;
      const start = anchors.get(zoneId);
      if (!start) continue;
      // Un flux sortant d'Ekylibre (ex. audits, analyses) part du cœur ; sinon il y arrive.
      const outgoing = list.every((c) => c.dataFlow === 'out');
      const bothWays = list.some((c) => c.dataFlow === 'both');
      const points = arc(start, hub, 8 + start.distanceTo(hub) * 0.28);
      const positions = points.flatMap((p) => [p.x, p.y, p.z]);

      const geometry = new LineGeometry().setPositions(positions);
      const material = new LineMaterial({
        color: outgoing ? GREEN_LIGHT : GREEN,
        linewidth: 2.6,
        dashed: true,
        dashSize: 6,
        gapSize: bothWays ? 3 : 5,
        transparent: true,
        opacity: 0.95,
        toneMapped: false,
      });
      const line = new Line2(geometry, material);
      line.computeLineDistances();

      const halo = new Line2(
        geometry,
        new LineMaterial({
          color: outgoing ? GREEN_LIGHT : GREEN,
          linewidth: 9,
          transparent: true,
          opacity: 0.18,
          blending: AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      group.add(halo, line);
      flows.push({ zone: zoneId, line, halo, material, direction: outgoing ? 1 : -1 });
    }
  }
  stage.scene.add(group);

  const setResolution = () => {
    stage.renderer.getSize(resolution);
    for (const f of flows) {
      f.material.resolution.copy(resolution);
      (f.halo.material as LineMaterial).resolution.copy(resolution);
    }
  };
  setResolution();
  stage.onResize(setResolution);

  if (animate) {
    stage.onFrame((dt) => {
      for (const f of flows) f.material.dashOffset += f.direction * dt * 14;
      return true;
    });
  }

  return {
    group,
    flows,
    arc,
    setVisible(visible) {
      for (const f of flows) {
        const on = visible === 'all' || visible.has(f.zone);
        f.line.visible = on;
        f.halo.visible = on;
      }
      stage.invalidate();
    },
  };
}
