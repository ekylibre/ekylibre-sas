// AnchorRegistry : résout les zones de la ferme en positions 3D (docs/design/02-architecture.md §8.3).
// Une zone est ancrée sur un objet glTF nommé (centre de sa boîte englobante, au sommet)
// ou sur une position (x, z) dont la hauteur est lue sur le terrain par lancer de rayon.
import { Box3, Raycaster, Vector3, type Object3D } from 'three';
import type { ZoneDef } from './types';

export class AnchorRegistry {
  private readonly positions = new Map<string, Vector3>();
  private readonly ray = new Raycaster();
  private readonly terrain: Object3D[] = [];

  constructor(
    private readonly farm: Object3D,
    zones: Record<string, ZoneDef>,
  ) {
    farm.updateMatrixWorld(true);
    farm.traverse((o) => {
      if (o.name.startsWith('SITE_terrain')) this.terrain.push(o);
    });
    for (const [id, def] of Object.entries(zones)) {
      const p = this.resolve(def);
      if (p) this.positions.set(id, p);
      else console.warn(`[farm-scene] zone non résolue : ${id}`);
    }
  }

  get(id: string): Vector3 | undefined {
    return this.positions.get(id)?.clone();
  }

  entries(): Array<[string, Vector3]> {
    return [...this.positions].map(([id, p]) => [id, p.clone()]);
  }

  /** Hauteur du terrain à la verticale de (x, z). */
  groundAt(x: number, z: number): number | undefined {
    this.ray.set(new Vector3(x, 2000, z), new Vector3(0, -1, 0));
    const hit = this.ray.intersectObjects(this.terrain, true)[0];
    return hit?.point.y;
  }

  private resolve(def: ZoneDef): Vector3 | undefined {
    const lift = def.lift ?? 6;
    if (def.node) {
      const node = this.farm.getObjectByName(def.node);
      if (!node) return undefined;
      const box = new Box3().setFromObject(node);
      const c = box.getCenter(new Vector3());
      return new Vector3(c.x, box.max.y + lift, c.z);
    }
    if (def.xz) {
      const [x, z] = def.xz;
      const y = this.groundAt(x, z);
      return y === undefined ? undefined : new Vector3(x, y + lift, z);
    }
    return undefined;
  }
}
