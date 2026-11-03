// Outils de développement : repères visibles sur chaque zone (?zones dans l'URL, mode dev uniquement).
import { CylinderGeometry, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { AnchorRegistry } from './anchors';
import type { Stage } from './stage';

export function addZoneDebug(stage: Stage, anchors: AnchorRegistry): void {
  const labels = new CSS2DRenderer();
  labels.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  stage.renderer.domElement.parentElement?.append(labels.domElement);
  for (const [id, p] of anchors.entries()) {
    const ball = new Mesh(new SphereGeometry(3, 16, 12), new MeshBasicMaterial({ color: '#ff2d55' }));
    ball.position.copy(p);
    const ground = anchors.groundAt(p.x, p.z) ?? p.y - 10;
    const stick = new Mesh(
      new CylinderGeometry(0.4, 0.4, p.y - ground, 6),
      new MeshBasicMaterial({ color: '#ff2d55' }),
    );
    stick.position.set(p.x, (p.y + ground) / 2, p.z);
    const el = document.createElement('div');
    el.textContent = id;
    el.style.cssText =
      'font:600 12px monospace;color:#fff;background:#ff2d55;padding:1px 4px;border-radius:3px;transform:translateY(-14px)';
    const label = new CSS2DObject(el);
    label.position.copy(p);
    stage.scene.add(ball, stick, label);
  }
  stage.onFrame(() => {
    const { clientWidth: w, clientHeight: h } = stage.renderer.domElement;
    labels.setSize(w, h);
    labels.render(stage.scene, stage.camera);
  });
  stage.invalidate();
}
