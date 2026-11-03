// Détermine le niveau de qualité de la scène 3D (docs/design/02-architecture.md §8.5).
// Volontairement sans dépendance à three.js : ce module est chargé avant la décision de charger la 3D.
export type Tier = 'high' | 'medium' | 'low' | 'none';

export interface TierReport {
  tier: Tier;
  reason: string;
  reducedMotion: boolean;
}

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export function detectTier(): TierReport {
  const nav = navigator as NavigatorHints;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = /(^|-)2g|3g/.test(nav.connection?.effectiveType ?? '');

  if (reducedMotion && saveData) return { tier: 'none', reason: 'reduced-motion+save-data', reducedMotion };

  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  } catch {
    gl = null;
  }
  if (!gl) return { tier: 'none', reason: 'no-webgl2', reducedMotion };

  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  // Rendu logiciel (pas de GPU : machines virtuelles, outils de mesure comme Lighthouse/PageSpeed)
  // ou navigateur piloté par un robot : la 3D monopoliserait le processeur, on sert la version 2D.
  // `?force3d` dans l'URL lève cette exclusion (tests automatisés de la scène).
  const force3d = new URLSearchParams(location.search).has('force3d');
  if (!force3d && software) return { tier: 'none', reason: 'software-renderer', reducedMotion };
  if (!force3d && navigator.webdriver) return { tier: 'none', reason: 'automation', reducedMotion };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = matchMedia('(pointer: coarse)').matches;

  if (software || saveData || slowNetwork || memory <= 4 || cores <= 4) {
    return { tier: 'low', reason: software ? 'software-renderer' : 'constrained-device', reducedMotion };
  }
  if (coarse || memory < 8) return { tier: 'medium', reason: 'mobile', reducedMotion };
  return { tier: 'high', reason: 'desktop', reducedMotion };
}
