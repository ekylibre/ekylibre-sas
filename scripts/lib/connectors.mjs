// Règles de cohérence de src/data/connectors.yaml (docs/design/04-accueil-kit-connecteurs.md, D33).
// Fonction pure : utilisée par check-content.mjs et par tests/unit/connectors.test.ts.

const PRODUCTS = new Set(['fourmy', 'lyvre']);
const STATUSES = new Set(['stable', 'en-cours']);

/**
 * @param {Array<Record<string, unknown>>} connectors entrées du YAML
 * @param {Set<string>} zones clés de public/3d/scene.json → zones
 * @returns {string[]} messages d'erreur (vide si tout est cohérent)
 */
export function connectorErrors(connectors, zones) {
  const errors = [];
  const seen = new Set();
  for (const c of connectors) {
    const id = `connectors.yaml : « ${c.slug} »`;
    if (seen.has(c.slug)) errors.push(`${id} : slug en double`);
    seen.add(c.slug);
    if (!PRODUCTS.has(c.product)) errors.push(`${id} : logiciel inconnu « ${c.product} »`);
    if (!STATUSES.has(c.status)) errors.push(`${id} : état inconnu « ${c.status} »`);
    if (c.status === 'stable' && !c.source) errors.push(`${id} : stable sans source (code publié)`);
    if (c.status !== 'stable' && c.source) errors.push(`${id} : source indiquée pour un connecteur en cours`);
    if (c.product === 'fourmy') {
      if (!c.zone) errors.push(`${id} : zone obligatoire pour Fourmy`);
      else if (!zones.has(c.zone)) errors.push(`${id} : zone inconnue « ${c.zone} »`);
    } else if (c.zone) {
      errors.push(`${id} : pas de zone pour ${c.product} (tableau seulement)`);
    }
  }
  return errors;
}
