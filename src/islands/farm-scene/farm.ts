// FarmLayer : chargement de la ferme (glTF Meshopt) et ambiance « heure dorée ».
import {
  CanvasTexture,
  Color,
  SRGBColorSpace,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { Stage } from './stage';

export const NIGHT = new Color('#07140e');

export async function loadFarm(stage: Stage, url: string): Promise<Object3D> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const farm = gltf.scene;
  farm.name = 'farm';

  const shadows = stage.tier === 'high';
  farm.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const name = o.name || o.parent?.name || '';
    const isTerrain = name.startsWith('SITE_terrain');
    o.receiveShadow = shadows && isTerrain;
    o.castShadow = shadows && !isTerrain;
    // Les arbres instanciés n'ont pas besoin d'être testés hors champ individuellement.
    if (o instanceof InstancedMesh) o.frustumCulled = false;
    const mat = o.material;
    if (mat instanceof MeshStandardMaterial) {
      // Teinte légèrement chaude, cohérente avec la lumière rasante.
      mat.envMapIntensity = 0.6;
      if (isTerrain) mat.roughness = 1;
    }
  });
  stage.scene.add(farm);
  addGoldenHour(stage);
  return farm;
}

/** Lumière de fin de journée : soleil rasant de l'ouest, ciel froid, brouillard vers le vert-nuit. */
function addGoldenHour(stage: Stage): void {
  const { scene } = stage;
  scene.background = skyGradient();
  scene.fog = new Fog(NIGHT, 650, 2600);

  scene.add(new HemisphereLight('#cfe3ff', '#3d3524', 1.25));

  const sun = new DirectionalLight('#ffd9a0', 3.2);
  // Azimut ouest-sud-ouest, environ 14° au-dessus de l'horizon.
  sun.position.set(-420, 110, 180);
  sun.target.position.set(22, 0, -8);
  if (stage.tier === 'high') {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = -170;
    cam.right = 170;
    cam.top = 170;
    cam.bottom = -170;
    cam.near = 50;
    cam.far = 900;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.6;
  }
  scene.add(sun, sun.target);
}

/** Ciel de fin de journée : vert-nuit en haut, lueur chaude à l'horizon (fond plein, en espace écran). */
function skyGradient(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#07140e');
  g.addColorStop(0.55, '#0f2a1e');
  g.addColorStop(0.82, '#3a3a22');
  g.addColorStop(1, '#6b5530');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
