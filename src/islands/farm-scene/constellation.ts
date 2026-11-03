// C6 — ConstellationLayer : le « ciel de données » du Lexicon au-dessus de la ferme.
// 7 amas (un par famille), un point lumineux par jeu de données (taille selon le nombre de lignes),
// un médaillon par famille, et des filaments qui descendent vers le cœur (Ekylibre).
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { AnchorRegistry } from './anchors';
import type { Stage } from './stage';
import type { FarmSceneProps } from './types';

export interface ConstellationLayer {
  group: Group;
  setVisible(on: boolean): void;
}

/** Générateur pseudo-aléatoire déterministe (même ciel à chaque visite). */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const VERTEX = /* glsl */ `
  attribute float size;
  attribute float phase;
  attribute vec3 color;
  uniform float time;
  uniform float pixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = color;
    vTwinkle = 0.75 + 0.25 * sin(time * 1.6 + phase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pixelRatio * (420.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.2);
    gl_FragColor = vec4(vColor * (0.6 + glow * 1.4) * vTwinkle, core);
  }
`;

const iconSvg = (sprite: string, name: string) =>
  `<svg class="icon" aria-hidden="true" focusable="false"><use href="${sprite}#i-${name}"></use></svg>`;

export function createConstellation(
  stage: Stage,
  anchors: AnchorRegistry,
  props: FarmSceneProps,
  animate: boolean,
): ConstellationLayer {
  const group = new Group();
  group.name = 'constellation';
  const sky = anchors.get('ciel');
  const hub = anchors.get('hub');
  if (!sky || !hub) return { group, setVisible: () => undefined };

  const random = seeded(2026);
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const phases: number[] = [];
  const filaments: number[] = [];
  const RADIUS = 95;
  const families = props.families;
  const maxRows = Math.max(...families.flatMap((f) => f.datasets.map((d) => d.rows)), 1);

  families.forEach((family, i) => {
    const angle = (i / families.length) * Math.PI * 2 + 0.4;
    const center = new Vector3(
      sky.x + Math.cos(angle) * RADIUS,
      sky.y + (random() - 0.5) * 24,
      sky.z + Math.sin(angle) * RADIUS,
    );
    const color = new Color(family.color);
    for (const d of family.datasets) {
      const r = 6 + random() * 16;
      const a = random() * Math.PI * 2;
      const h = (random() - 0.5) * 14;
      positions.push(center.x + Math.cos(a) * r, center.y + h, center.z + Math.sin(a) * r);
      colors.push(color.r, color.g, color.b);
      // Taille logarithmique : de 1,4 (quelques lignes) à 4,2 (centaines de millions).
      sizes.push(1.4 + (Math.log10(d.rows + 1) / Math.log10(maxRows + 1)) * 2.8);
      phases.push(random() * Math.PI * 2);
    }
    filaments.push(center.x, center.y - 6, center.z, hub.x, hub.y + 2, hub.z);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-medallion is-family';
    button.style.setProperty('--family', family.color);
    button.dataset.family = family.id;
    const count = `${family.datasets.length} ${
      family.datasets.length > 1 ? (props.strings['family.datasets'] ?? '') : (props.strings['family.dataset'] ?? '')
    }`;
    button.innerHTML =
      `<span class="scene-medallion__disc">${iconSvg(props.iconSprite, family.icon)}</span>` +
      `<span class="scene-medallion__label"><strong>${family.title}</strong><span>${count}</span></span>`;
    button.setAttribute('aria-label', `${family.title} — ${count}`);
    button.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('eky:select', { detail: { kind: 'family', id: family.id, origin: button } }));
    });
    const label = new CSS2DObject(button);
    label.position.copy(center);
    group.add(label);
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new Float32BufferAttribute(phases, 1));
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { time: { value: 0 }, pixelRatio: { value: stage.renderer.getPixelRatio() } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
  group.add(new Points(geometry, material));

  const filamentGeometry = new BufferGeometry();
  filamentGeometry.setAttribute('position', new Float32BufferAttribute(filaments, 3));
  group.add(
    new LineSegments(
      filamentGeometry,
      new LineBasicMaterial({
        color: '#4ed164',
        transparent: true,
        opacity: 0.22,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  stage.scene.add(group);

  if (animate) {
    stage.onFrame((_dt, t) => {
      if (group.visible) material.uniforms.time!.value = t;
      return true;
    });
  }

  return {
    group,
    setVisible(on) {
      group.visible = on;
      group.traverse((o) => {
        if (o instanceof CSS2DObject) o.visible = on;
      });
      stage.invalidate();
    },
  };
}
