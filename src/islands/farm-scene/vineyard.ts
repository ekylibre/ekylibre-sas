// C7 — Petit vignoble procédural posé sur la zone « vigne » (La Vauzelle n'a pas de vigne :
// le module rend crédible la présence de Baqio). Rangs palissés + piquets, instanciés.
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import type { AnchorRegistry } from './anchors';
import type { Stage } from './stage';

const ROWS = 14;
const ROW_LENGTH = 34;
const SPACING = 2.4;
const POST_EVERY = 5.5;
const HEADING = 0.35; // orientation des rangs (rad), alignée sur le parcellaire voisin

export function createVineyard(stage: Stage, anchors: AnchorRegistry): Group {
  const group = new Group();
  group.name = 'vineyard';
  const anchor = anchors.get('vigne');
  if (!anchor) return group;

  const along = new Vector3(Math.cos(HEADING), 0, Math.sin(HEADING));
  const across = new Vector3(-along.z, 0, along.x);
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -HEADING);
  const postsPerRow = Math.floor(ROW_LENGTH / POST_EVERY) + 1;

  const canopy = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: '#4f7a2e', roughness: 0.9 }),
    ROWS,
  );
  const posts = new InstancedMesh(
    new CylinderGeometry(0.07, 0.09, 1.9, 5),
    new MeshStandardMaterial({ color: '#8a7a60', roughness: 1 }),
    ROWS * postsPerRow,
  );
  const m = new Matrix4();
  let postIndex = 0;
  for (let r = 0; r < ROWS; r++) {
    const offset = (r - (ROWS - 1) / 2) * SPACING;
    const center = anchor.clone().addScaledVector(across, offset);
    const ground = anchors.groundAt(center.x, center.z) ?? anchor.y - 8;
    m.compose(new Vector3(center.x, ground + 1.05, center.z), rotation, new Vector3(ROW_LENGTH, 1.1, 0.75));
    canopy.setMatrixAt(r, m);
    for (let p = 0; p < postsPerRow; p++) {
      const at = center.clone().addScaledVector(along, -ROW_LENGTH / 2 + p * POST_EVERY);
      const g = anchors.groundAt(at.x, at.z) ?? ground;
      m.compose(new Vector3(at.x, g + 0.95, at.z), new Quaternion(), new Vector3(1, 1, 1));
      posts.setMatrixAt(postIndex++, m);
    }
  }
  canopy.castShadow = posts.castShadow = stage.tier === 'high';
  group.add(canopy, posts);
  stage.scene.add(group);
  return group;
}
