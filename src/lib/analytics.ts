// E3 — Mesure d'audience (GA4), uniquement après consentement.
// `track` ne fait rien tant que gtag n'est pas chargé : aucun événement avant l'accord.
import type {} from '~/islands/farm-scene/types';

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  window.gtag?.('event', event, params);
}

let loaded = false;

/** Charge gtag.js et configure GA4 (appelé par le bandeau quand la catégorie « analytics » est acceptée). */
export function loadGa4(id: string): void {
  if (loaded) {
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  loaded = true;
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js attend l'objet `arguments`, pas un tableau.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  window.gtag('js', new Date());
  window.gtag('config', id);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
  listenToSiteEvents();
}

/** Retrait du consentement : on cesse de déposer des cookies de mesure. */
export function revokeGa4(): void {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
}

function listenToSiteEvents(): void {
  // Liens sortants (démo, GitHub, aiffel.org, lexicon.osfarm.org…).
  document.addEventListener('click', (e) => {
    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="http"]');
    if (link && link.host !== location.host) track('outbound_click', { link_url: link.href });
  });
  // Interactions avec la scène 3D.
  document.addEventListener('eky:select', (e) => track('scene_interaction', { kind: e.detail.kind, id: e.detail.id }));
}
