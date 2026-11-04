// Données structurées schema.org (SoftwareApplication) des pages produit.
interface Org {
  name: string;
  url: string;
}

export const EKYLIBRE_SAS: Org = { name: 'Ekylibre SAS', url: 'https://ekylibre.com/' };
export const OSFARM: Org = { name: 'OSFarm', url: 'https://www.osfarm.org/' };

interface SoftwareInput {
  name: string;
  description: string;
  url: string;
  license?: string;
  /** Catégorie schema.org (BusinessApplication par défaut). */
  category?: string;
  publisher?: Org;
  contributor?: Org;
}

const org = (o: Org) => ({ '@type': 'Organization', name: o.name, url: o.url });

/** Objet JSON-LD sérialisé, prêt pour <script type="application/ld+json" set:html>. */
export function softwareJsonLd(input: SoftwareInput): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.category ?? 'BusinessApplication',
    operatingSystem: 'Web',
    ...(input.license ? { license: input.license } : {}),
    publisher: org(input.publisher ?? EKYLIBRE_SAS),
    ...(input.contributor ? { contributor: org(input.contributor) } : {}),
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
