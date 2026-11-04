// Comportements communs au schéma du système, au récit à onglets et aux maquettes animées
// (docs/design/03-outils-lyvre.md §4.7). Sans dépendance ; respecte le mouvement réduit,
// s'arrête hors de l'écran et quand l'onglet du navigateur est caché.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Observe la visibilité d'un élément (au moins 35 % à l'écran). */
function onVisible(el: Element, cb: (visible: boolean) => void): void {
  new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { threshold: 0.35 }).observe(el);
}

/** Rejoue l'animation d'une maquette (retire puis remet data-play). */
export function playMockup(root: Element | null | undefined): void {
  if (!(root instanceof HTMLElement)) return;
  root.removeAttribute('data-play');
  void root.offsetWidth; // force le recalcul : l'animation repart du début
  root.setAttribute('data-play', '');
}

/** Maquettes autonomes (en tête des pages produit) : jouées à leur entrée dans l'écran. */
export function initMockups(): void {
  document.querySelectorAll<HTMLElement>('[data-mockup][data-autoplay-visible]').forEach((m) => {
    if (m.dataset.bound) return;
    m.dataset.bound = 'true';
    let played = false;
    onVisible(m, (v) => {
      if (v && !played) {
        played = true;
        playMockup(m);
      }
    });
  });
}

/** F2 — schéma du système : survol, focus ou toucher d'un logiciel ; avance automatique. */
export function initSystems(): void {
  document.querySelectorAll<HTMLElement>('[data-system]').forEach((root) => {
    if (root.dataset.bound) return;
    root.dataset.bound = 'true';
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('.system-button')];
    const panels = [...root.querySelectorAll<HTMLElement>('.system-panel')];
    const keys = buttons.map((b) => b.dataset.key!);

    const activate = (key: string) => {
      root.dataset.active = key;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
      panels.forEach((p) => (p.hidden = p.dataset.key !== key));
    };

    let timer: number | undefined;
    let stopped = root.dataset.autoplay === 'off' || reduced();
    let visible = false;
    const stop = () => {
      stopped = true;
      window.clearInterval(timer);
    };
    const schedule = () => {
      window.clearInterval(timer);
      if (stopped || !visible || document.hidden) return;
      timer = window.setInterval(() => {
        const i = keys.indexOf(root.dataset.active ?? keys[0]!);
        activate(keys[(i + 1) % keys.length]!);
      }, 5000);
    };

    for (const b of buttons) {
      const take = () => {
        stop();
        activate(b.dataset.key!);
      };
      b.addEventListener('click', take);
      b.addEventListener('focus', take);
      b.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') take();
      });
    }
    onVisible(root, (v) => {
      visible = v;
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
  });
}

/** F3 — récit à onglets : ARIA tabs, flèches, avance automatique pilotée par la barre de progression. */
export function initToolStories(): void {
  document.querySelectorAll<HTMLElement>('[data-tool-story]').forEach((root) => {
    if (root.dataset.bound) return;
    root.dataset.bound = 'true';
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);
    root.classList.add('is-enhanced');

    let seen = false; // la première maquette ne joue qu'à l'arrivée du récit à l'écran
    let current = Math.max(
      0,
      tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
    );
    const select = (i: number, focus = false) => {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, j) => {
        const on = j === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j]!.hidden = !on;
      });
      if (focus) tabs[current]!.focus();
      if (seen) playMockup(panels[current]!.querySelector('[data-mockup]'));
      restartProgress();
    };

    // Avance automatique : la barre de progression de l'onglet actif est une animation CSS ;
    // sa fin fait passer à l'onglet suivant. Pause au survol et au focus, arrêt au premier clic.
    let auto = !reduced();
    const restartProgress = () => {
      root.dataset.autoplay = 'off';
      void root.offsetWidth;
      if (auto) root.dataset.autoplay = 'on';
    };
    const stop = () => {
      auto = false;
      root.dataset.autoplay = 'off';
    };
    root.addEventListener('animationend', (e) => {
      if (auto && (e.target as Element).matches('[role="tab"][aria-selected="true"] .tab-progress')) select(current + 1);
    });
    root.addEventListener('pointerenter', () => (root.dataset.paused = 'true'));
    root.addEventListener('pointerleave', () => delete root.dataset.paused);
    root.addEventListener('focusin', () => (root.dataset.paused = 'true'));
    root.addEventListener('focusout', () => delete root.dataset.paused);

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => {
        stop();
        select(i);
      });
      t.addEventListener('keydown', (e) => {
        const next = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        stop();
        select(next, true);
      });
    });

    select(current);
    onVisible(root, (v) => {
      if (v) root.dataset.visible = 'true';
      else delete root.dataset.visible;
      if (v && !seen) {
        seen = true;
        playMockup(panels[current]!.querySelector('[data-mockup]'));
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) root.dataset.paused = 'true';
      else delete root.dataset.paused;
    });
  });
}
