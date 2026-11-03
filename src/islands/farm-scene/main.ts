// Point d'entrée de la scène 3D, chargé à la demande (import dynamique) par FarmScene.astro.
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { Stage } from './stage';
import { loadFarm } from './farm';
import { AnchorRegistry } from './anchors';
import { createConnectorLayer, type ConnectorLayer } from './connectors';
import { createFlowLayer, type FlowLayer } from './flows';
import { createConstellation, type ConstellationLayer } from './constellation';
import { createVineyard } from './vineyard';
import type { TierReport } from './quality';
import type { Chapter, FarmSceneProps, SceneManifest } from './types';

/** Champ de vision de la maquette d'origine (vues de scene.json) et champ retenu pour le site. */
const SOURCE_FOV = 40;
const FOV = 26; // focale longue : rappelle l'isométrie des illustrations de la documentation
/** Format de référence des vues ; en portrait, la caméra recule pour garder la largeur de champ. */
const REFERENCE_ASPECT = 1.6;

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

  // ── Vues caméra ───────────────────────────────────────────────────────────
  const tanHalf = (deg: number) => Math.tan((deg / 2) * (Math.PI / 180));
  const resolveView = (name: string) => {
    const view = manifest.views[name];
    if (!view) throw new Error(`Vue inconnue : ${name}`);
    const aspectFactor = Math.max(1, REFERENCE_ASPECT / stage.camera.aspect) ** 0.5;
    const distanceFactor = (tanHalf(view.fov ?? SOURCE_FOV) / tanHalf(FOV)) * aspectFactor;
    const target = new Vector3(...view.cible);
    const position = new Vector3(...view.position).sub(target).multiplyScalar(distanceFactor).add(target);
    return { position, target };
  };

  let currentView = props.view;
  let tween: gsap.core.Timeline | null = null;
  const setView = (name: string) => {
    currentView = name;
    tween?.kill();
    tween = null;
    const { position, target } = resolveView(name);
    stage.camera.position.copy(position);
    stage.target.copy(target);
    stage.invalidate();
  };

  /** Transition animée vers une vue (coupe franche si mouvement réduit). */
  const goTo = (name: string) => {
    if (name === currentView && !tween) return;
    if (!animate) return setView(name);
    currentView = name;
    const { position, target } = resolveView(name);
    tween?.kill();
    tween = gsap
      .timeline({
        defaults: { duration: 2.2, ease: 'power2.inOut' },
        onUpdate: () => stage.invalidate(),
        onComplete: () => void (tween = null),
      })
      .to(stage.camera.position, { x: position.x, y: position.y, z: position.z }, 0)
      .to(stage.target, { x: target.x, y: target.y, z: target.z }, 0);
  };

  stage.resize();
  setView(props.view);
  stage.onResize(() => setView(currentView));

  // ── Chapitres (accueil) : vue + éléments révélés ──────────────────────────
  const reveal = (chapter: Pick<Chapter, 'zones' | 'sky'>) => {
    const zones = chapter.zones === 'all' ? 'all' : new Set(chapter.zones);
    connectors.setVisible(zones);
    flows.setVisible(zones);
    constellation.setVisible(chapter.sky);
  };
  const chapters = props.chapters ?? [];
  if (chapters.length && !props.still) {
    reveal(chapters[0]!);
    document.addEventListener('eky:chapter', (e) => {
      const chapter = chapters.find((c) => c.id === e.detail.id);
      if (!chapter) return;
      reveal(chapter);
      goTo(chapter.view);
    });
  }

  // ── Mouvement ─────────────────────────────────────────────────────────────
  if (props.mode === 'hero' && animate) {
    // Orbite lente autour de la cible, suspendue pendant les transitions.
    const offset = new Vector3();
    const up = new Vector3(0, 1, 0);
    const SPEED = 0.014; // rad/s : un tour en ~7 min
    stage.onFrame((dt) => {
      if (!tween) {
        offset.copy(stage.camera.position).sub(stage.target);
        offset.applyAxisAngle(up, SPEED * dt);
        stage.camera.position.copy(stage.target).add(offset);
      }
      return true;
    });
  } else if (props.mode === 'explore') {
    // Exploration libre mais bornée (page Interopérabilité).
    const controls = new OrbitControls(stage.camera, stage.renderer.domElement);
    controls.target = stage.target;
    controls.enableDamping = animate;
    controls.dampingFactor = 0.08;
    controls.minDistance = 60;
    controls.maxDistance = 900;
    controls.maxPolarAngle = (80 * Math.PI) / 180;
    controls.screenSpacePanning = false;
    controls.zoomToCursor = true;
    controls.addEventListener('start', () => {
      tween?.kill();
      tween = null;
    });
    controls.addEventListener('change', () => stage.invalidate());
    stage.onFrame(() => (controls.enableDamping ? controls.update() : false));
    const canvas = stage.renderer.domElement;
    canvas.style.cursor = 'grab';
    document.addEventListener('eky:view', (e) => goTo(e.detail.view));
    document.addEventListener('eky:filter', (e) => reveal(e.detail));
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
