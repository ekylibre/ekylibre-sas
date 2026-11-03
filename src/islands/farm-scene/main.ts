// Point d'entrée de la scène 3D, chargé à la demande (import dynamique) par FarmScene.astro.
import { Vector3 } from 'three';
import { Stage } from './stage';
import { loadFarm } from './farm';
import { AnchorRegistry } from './anchors';
import { createConnectorLayer, type ConnectorLayer } from './connectors';
import { createFlowLayer, type FlowLayer } from './flows';
import { createConstellation, type ConstellationLayer } from './constellation';
import { createVineyard } from './vineyard';
import type { TierReport } from './quality';
import type { FarmSceneProps, SceneManifest } from './types';

/** Champ de vision de la maquette d'origine (vues de scene.json) et champ retenu pour le site. */
const SOURCE_FOV = 40;
const FOV = 26; // focale longue : rappelle l'isométrie des illustrations de la documentation

export interface FarmSceneHandle {
  stage: Stage;
  anchors: AnchorRegistry;
  connectors: ConnectorLayer;
  flows: FlowLayer;
  constellation: ConstellationLayer;
  manifest: SceneManifest;
  setView(name: string): void;
  dispose(): void;
}

export async function mountFarmScene(
  host: HTMLElement,
  props: FarmSceneProps,
  report: TierReport,
): Promise<FarmSceneHandle> {
  if (report.tier === 'none') throw new Error(report.reason);
  const manifest = (await (await fetch(props.manifestUrl)).json()) as SceneManifest;

  const stage = new Stage(host, report.tier, FOV);
  stage.focusX = props.focusX ?? 0.5;
  const farm = await loadFarm(stage, props.modelUrl);
  const anchors = new AnchorRegistry(farm, manifest.zones);
  const animate = !report.reducedMotion && !props.still;
  createVineyard(stage, anchors);
  const connectors = createConnectorLayer(stage, anchors, props);
  const flows = createFlowLayer(stage, anchors, connectors.zones, animate);
  const constellation = createConstellation(stage, anchors, props, animate);
  // Accueil : le ciel de données n'apparaît qu'au chapitre « ciel » de la narration (C9).
  if (props.mode === 'hero' && !props.still) constellation.setVisible(false);

  // Les vues de la maquette sont cadrées à 40° : on recule la caméra pour garder le même cadrage à 26°.
  // Sur un écran plus étroit que le format de référence (16:10), la caméra recule encore
  // pour conserver la largeur de champ (sinon la ferme est coupée en portrait).
  const REFERENCE_ASPECT = 1.6;
  const tanHalf = (deg: number) => Math.tan((deg / 2) * (Math.PI / 180));
  let currentView = props.view;
  const setView = (name: string) => {
    const view = manifest.views[name];
    if (!view) throw new Error(`Vue inconnue : ${name}`);
    currentView = name;
    const aspectFactor = Math.max(1, REFERENCE_ASPECT / stage.camera.aspect) ** 0.5;
    const distanceFactor = (tanHalf(view.fov ?? SOURCE_FOV) / tanHalf(FOV)) * aspectFactor;
    const target = new Vector3(...view.cible);
    const pos = new Vector3(...view.position).sub(target).multiplyScalar(distanceFactor).add(target);
    stage.camera.position.copy(pos);
    stage.target.copy(target);
    stage.invalidate();
  };
  stage.resize();
  setView(props.view);
  stage.onResize(() => setView(currentView));

  // Orbite lente autour de la cible en mode hero (désactivée si mouvement réduit).
  if (props.mode === 'hero' && !report.reducedMotion && !props.still) {
    const offset = new Vector3();
    const SPEED = 0.018; // rad/s : un tour en ~6 min
    stage.onFrame((dt) => {
      offset.copy(stage.camera.position).sub(stage.target);
      offset.applyAxisAngle(new Vector3(0, 1, 0), SPEED * dt);
      stage.camera.position.copy(stage.target).add(offset);
      return true;
    });
  }

  // En développement : ?zones affiche un repère par zone (vérification des ancrages).
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('zones')) {
    const { addZoneDebug } = await import('./debug');
    addZoneDebug(stage, anchors);
  }

  // Première image rendue → la page peut faire le fondu depuis l'image d'attente.
  await new Promise<void>((resolve) => {
    const off = stage.onFrame(() => {
      off();
      requestAnimationFrame(() => resolve());
    });
    stage.invalidate();
  });

  return { stage, anchors, connectors, flows, constellation, manifest, setView, dispose: () => stage.dispose() };
}
