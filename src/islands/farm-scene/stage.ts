// Stage : moteur de rendu, caméra, redimensionnement, boucle de rendu économe.
// - rendu continu seulement si quelque chose bouge (rotation, transition) ;
// - pause quand la scène est hors écran ou l'onglet masqué.
import { ACESFilmicToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, Timer, Vector3, WebGLRenderer } from 'three';
import type { Tier } from './quality';

const DPR_CAP: Record<Exclude<Tier, 'none'>, number> = { high: 2, medium: 1.5, low: 1 };

export type FrameCallback = (dt: number, elapsed: number) => boolean | void;

export class Stage {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly target = new Vector3();
  /** Position horizontale souhaitée de la cible à l'écran (0,5 = centre). */
  focusX = 0.5;

  private readonly timer = new Timer();
  private readonly callbacks = new Set<FrameCallback>();
  private readonly resizeListeners = new Set<() => void>();
  private visible = true;
  private running = false;
  private dirty = true;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersection: IntersectionObserver;

  constructor(
    private readonly host: HTMLElement,
    readonly tier: Exclude<Tier, 'none'>,
    fov: number,
  ) {
    this.renderer = new WebGLRenderer({
      antialias: tier !== 'low',
      alpha: true,
      powerPreference: tier === 'high' ? 'high-performance' : 'default',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_CAP[tier]));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = tier === 'high';
    const canvas = this.renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'block h-full w-full';
    host.append(canvas);

    this.camera = new PerspectiveCamera(fov, 1, 1, 6000);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? true;
      this.kick();
    });
    this.intersection.observe(host);
    document.addEventListener('visibilitychange', this.kick);
    this.resize();
  }

  /** Enregistre une fonction appelée à chaque image ; elle renvoie true tant qu'elle anime. */
  onFrame(cb: FrameCallback): () => void {
    this.callbacks.add(cb);
    this.kick();
    return () => this.callbacks.delete(cb);
  }

  /** Demande une nouvelle image (après un changement ponctuel). */
  invalidate(): void {
    this.dirty = true;
    this.kick();
  }

  readonly kick = (): void => {
    if (this.running || !this.visible || document.hidden) return;
    this.running = true;
    this.timer.reset();
    this.renderer.setAnimationLoop(this.loop);
  };

  private readonly loop = (): void => {
    if (!this.visible || document.hidden) {
      this.stop();
      return;
    }
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const elapsed = this.timer.getElapsed();
    let animating = false;
    for (const cb of this.callbacks) if (cb(dt, elapsed)) animating = true;
    if (animating || this.dirty) {
      this.camera.lookAt(this.target);
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    if (!animating) this.stop();
  };

  private stop(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  resize(): void {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Décale le cadrage pour placer la cible à focusX (laisse la place au texte du hero).
    const wide = w >= 1024;
    const shift = wide ? (this.focusX - 0.5) * w : 0;
    if (shift) this.camera.setViewOffset(w, h, -shift, 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    for (const listener of this.resizeListeners) listener();
    this.invalidate();
  }

  /** Appelé après chaque redimensionnement (recadrage des vues selon le format d'écran). */
  onResize(listener: () => void): void {
    this.resizeListeners.add(listener);
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    document.removeEventListener('visibilitychange', this.kick);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
