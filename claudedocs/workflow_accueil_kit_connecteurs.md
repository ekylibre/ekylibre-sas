# Plan de mise en œuvre — Accueil Fourmy, kit isométrique, connecteurs Fourmy et Lyvre

Entrées : `docs/brainstorm/04-accueil-kit-isometrique-connecteurs.md` (FR-3D, FR-REC, FR-KIT, FR-SYS,
FR-CON, NFR-1 à 5) et `docs/design/04-accueil-kit-connecteurs.md` (D31–D37). Site en production : chaque
lot se termine par un build et des tests verts, et peut être commité seul (sur accord).
Exécution : `/sc:implement L1`, …

## Ordre et dépendances

```
L1 Données connecteurs ──┬─► L2 Scène 3D et récit ──► L3 Vigne : placement + captures ──┐
                         └─► L4 Compteurs, Interop, Développeurs, nettoyage ────────────┤
L5 Kit : conversion + inventaire ──► L6 Kit : curation + extraction ──► L7 Schéma ──────┤
  (indépendant de L1, lancé en tâche de fond)                                           └─► L8 Recette, mise en ligne
```

Chemin critique : L5 → L6 → L7 → L8 (la conversion de 196 fichiers prend ~1 h, la curation demande
votre œil). Séances proposées : **S1** = L5 lancé en fond + L1 + L4 ; **S2** = L2 + L3 (points de contrôle
avec captures) ; **S3** = L6 + L7 ; **S4** = L8.

Points d'arrêt où votre avis est requis : **C1** (position des vignes, L3), **C2** (choix des éléments du
schéma, L6), **C3** (rendu du schéma, L7), **C4** (mise en ligne, L8).

---

## L1 — Données des connecteurs (design §4.1–4.2, D32–D34)

| # | Tâche | Fichiers |
|---|---|---|
| 1.1 | Revérifier dans `ekylibre/fourmy` (`gh api`) que `packages/connector-traccar`, `geo-ign`, `migrator-ekylibre` existent ; noter la date | — |
| 1.2 | Réécrire `connectors.yaml` : 3 Fourmy stables, 7 Fourmy en cours, 9 Lyvre en cours ; textes FR + EN (« Fourmy » à la place d'« Ekylibre ») | `src/data/connectors.yaml` |
| 1.3 | Schéma Zod : `product`, `status`, `zone` (requis Fourmy, interdit Lyvre), `source` (requis si stable) | `src/content.config.ts` |
| 1.4 | `connectors(lang, { product? })`, `ConnectorView` (`codeUrl`), tri ; `ZONE_META` : `vigne` (« La vigne » / « The vineyard »), hub « Fourmy, le cœur » | `src/lib/interop.ts` |
| 1.5 | Renommer la zone `vigne-chai` → `vigne` dans `scene.json` (coordonnées inchangées à ce stade) et `vineyard.ts` | `public/3d/scene.json`, `src/islands/farm-scene/vineyard.ts` |
| 1.6 | `check-content.mjs` : `stable` sans `source` refusé ; zone Fourmy présente dans `scene.json` ; test unitaire | `scripts/check-content.mjs`, `tests/unit/connectors.test.ts` |
| 1.7 | Brancher `ConnectorTable` (7 colonnes, légende, `FLOW` « Vers le logiciel / Depuis le logiciel », badge d'état `StatusBadge`) et `ConnectorDiagram` sur `connectors()` | `src/components/interop/ConnectorTable.astro`, `src/components/ConnectorDiagram.astro` |

**Contrôle L1** : `npm run build` (inclut `check-content`) ; `npm run test:unit` ; la page Interopérabilité
liste 19 lignes, aucune ligne Samsys/Nordigen/HVE/IDEA.

## L2 — Scène 3D et récit (design §3.2–3.3)

| # | Tâche | Fichiers |
|---|---|---|
| 2.1 | `FarmScene.astro` : scène = connecteurs `product: fourmy` + Aiffel + Lyvre ; textes Aiffel/Lyvre « Fourmy » ; `strings['hub.title']`, `strings['hub.subtitle'] = 'Fourmy'`, `hubLogo` (URL de `fourmy.svg`) | `src/components/FarmScene.astro`, `src/islands/farm-scene/types.ts` |
| 2.2 | Médaillon du moyeu : titre et logo depuis les props (plus de « Ekylibre » en dur), `<img alt="">` dans le disque, libellé accessible | `src/islands/farm-scene/connectors.ts` |
| 2.3 | Styles `.scene-medallion.is-hub img`, titre sur deux lignes | `src/styles/global.css` |
| 2.4 | InfoCard : badge « en cours », pas de version pour un connecteur en cours ; lien « Code » vers `codeUrl` | `src/components/InfoCard.astro` |
| 2.5 | Vues `elevage` et `vigne` provisoires dans `scene.json` (dérivées de `elevage-vigne`), suppression de `elevage-vigne` | `public/3d/scene.json` |
| 2.6 | Récit en 7 chapitres, textes FR (brainstorm §3.2) et EN, zones cumulées (design §3.3), phrase l. 153 | `src/components/home/HomePage.astro` |
| 2.7 | Mettre à jour le test du récit (ids des chapitres) ; ajouter l'absence de « Ekyviti », « Nordigen », « Samsys », « La vigne et le chai » sur l'accueil FR/EN | `tests/story.spec.ts`, `tests/scene.spec.ts`, `tests/scene-no-webgl.spec.ts` |

**Contrôle L2** : build ; `npx playwright test story scene scene-no-webgl` ; vérification manuelle en dev
des 7 chapitres (médaillons attendus du design §3.2).

## L3 — Vigne : placement et cadrages (design §3.1) — point d'arrêt C1

| # | Tâche | Fichiers |
|---|---|---|
| 3.1 | Poser le candidat A `xz [-28, 0]` ; vérifier en dev avec `?zones` les 3 critères (sol libre, masquée en partie par le hangar depuis `hub`, médaillons écartés ≥ 48 px à 1280 px) ; ajuster `HEADING` si besoin | `public/3d/scene.json`, `src/islands/farm-scene/vineyard.ts` |
| 3.2 | Recadrer les vues `elevage` et `vigne` | `public/3d/scene.json` |
| 3.3 | Captures des vues `hub`, `champs`, `elevage`, `vigne`, `synthese` (Playwright, 1280 px et 390 px) dans le dossier de travail | — |
| 3.4 | **C1** : vous montrer les captures ; si A ne convient pas, un 2ᵉ candidat au nord du maraîchage | — |
| 3.5 | Vérifier que `prepare-3d.mjs` conserve vues et zones modifiées (relance à blanc, diff de `scene.json`) | `scripts/prepare-3d.mjs` |

**Contrôle L3** : C1 validé ; `npx playwright test scene`.

## L4 — Compteurs, Interopérabilité, Développeurs, nettoyage (design §4.3, D35)

| # | Tâche | Fichiers |
|---|---|---|
| 4.1 | Bandeau : 3ᵉ case « 4 logiciels libres, un seul système » (`getProducts().length`) | `src/components/StatBand.astro` |
| 4.2 | Page Entreprise : même remplacement | `src/components/pages/CompanyPage.astro` |
| 4.3 | Page Interopérabilité : titre sans chiffre, textes « Ekylibre » → « Fourmy » côté connecteurs | `src/components/interop/InteropPage.astro` |
| 4.4 | Page Développeurs : section connecteurs réécrite (plugins Fourmy hors processus, manifeste, SDK Apache-2.0, lien dépôt) ; tableau des licences | `src/components/products/DevelopersPage.astro` |
| 4.5 | Relire Services et Contact (« Ekylibre, ses connecteurs ») et corriger si le sens a changé | `ServicesPage.astro`, `ContactPage.astro` |
| 4.6 | Supprimer la liste des plugins : partie plugins de `fetch-plugins.mjs`, `plugins.json`, `stablePlugins` de `stats.json` et de `lib/data.ts` ; `stats.core` conservé | `scripts/fetch-plugins.mjs`, `src/data/generated/*`, `src/lib/data.ts` |
| 4.7 | Recherche finale dans `dist/` : aucun nombre devant « connecteur(s) », aucune mention des plugins Ekylibre hors actualités | — |

**Contrôle L4** : `npm run build` ; `npm run test:smoke` ; `npm run test:a11y`.

## L5 — Kit : conversion et inventaire (design §5.1) — en tâche de fond dès S1

| # | Tâche | Fichiers |
|---|---|---|
| 5.1 | Script de conversion : parcours récursif, chemins absolus, `/snap/bin/inkscape`, SVG + aperçu PNG 800 px + `--query-all`, reprise sur fichiers déjà convertis, échecs notés | `scripts/kit/convert.mjs` |
| 5.2 | Lancer la conversion des 196 fichiers vers `~/Documents/archive_ekylibre/kit-isometrique/` (en fond, ~1 h) | — |
| 5.3 | Générer l'inventaire (chemin, format, état, taille, nombre d'objets) | `docs/kit-isometrique/inventaire.md` |
| 5.4 | Parcourir les aperçus et marquer les fichiers contenant des éléments de ferme isométriques | `docs/kit-isometrique/inventaire.md` |

**Contrôle L5** : l'inventaire compte 196 lignes ; les échecs sont listés avec leur message.

## L6 — Kit : curation et extraction (design §5.2–5.4) — point d'arrêt C2

| # | Tâche | Fichiers |
|---|---|---|
| 6.1 | Script d'extraction (Python stdlib, `-I`) : sélection par rectangle + `exclude`, `transform` des ancêtres, `defs` référencés, Inkscape `--vacuum-defs`, `svgo`, `kit.json`, alerte > 40 Ko gzip | `scripts/kit/extract.py`, `scripts/kit/svgo.config.mjs` |
| 6.2 | Curation des éléments de ferme (bâtiments, cultures, vignes, serre, animaux, machines, capteurs, personnages, bureau) : rectangles relevés sur les aperçus | `docs/kit-isometrique/elements.yaml` |
| 6.3 | Extraction ; corrections par `exclude` jusqu'à des éléments propres | `src/assets/kit/**`, `src/assets/kit/kit.json` |
| 6.4 | Planche « Kit isométrique » sur `/design-system/` | `src/pages/design-system.astro` |
| 6.5 | **C2** : vous montrer la planche ; choisir les 5 éléments du schéma (proposition design §6.2) | — |

**Contrôle L6** : `kit.json` valide ; planche lisible ; C2 validé.

## L7 — Schéma « Quatre logiciels libres » (design §6) — point d'arrêt C3

| # | Tâche | Fichiers |
|---|---|---|
| 7.1 | Relever l'angle iso du kit ; ajuster la projection `P` si nécessaire ; tests `iso` à jour | `src/lib/iso.ts`, `tests/unit/iso.test.ts` |
| 7.2 | Plateau iso commun ; `<image>` par nœud placé par son point `foot`, tailles `SIZE` ; WebP via `getImage` pour un élément > 40 Ko gzip (D37) | `src/components/system/SystemDiagram.astro` |
| 7.3 | États actif / atténué en classes CSS, `prefers-reduced-motion`, tons clair et sombre | idem |
| 7.4 | Vérifier : tabulation, panneau `aria-live`, avance automatique, mode `focus` des 4 pages produit | `tests/products.spec.ts`, `tests/a11y.spec.ts` |
| 7.5 | Captures accueil (clair) et pages produit (sombre) à 1280 et 360 px ; poids des ressources du schéma ≤ 150 Ko | — |
| 7.6 | **C3** : vous montrer les captures | — |

**Contrôle L7** : build ; `npx playwright test products a11y` ; C3 validé.

## L8 — Recette et mise en ligne — point d'arrêt C4

| # | Tâche |
|---|---|
| 8.1 | `npm run build` puis `npm test` complet |
| 8.2 | Grille d'acceptation du brainstorm §5, case par case |
| 8.3 | Vérifier l'orthographe « Baoba » (question ouverte) avant publication |
| 8.4 | Commits par lot (messages conventionnels FR), sur accord |
| 8.5 | **C4** : mise en ligne selon la procédure habituelle, sur accord ; `scripts/verify-production.mjs` après déploiement |

## Risques suivis pendant l'exécution

| Risque | Lot | Parade |
|---|---|---|
| Conversion d'un `.ai` qui bloque Inkscape | L5 | délai de 5 min par fichier, échec noté, on continue |
| Éléments extraits trop lourds ou pollués par des voisins | L6 | `exclude`, D37 (WebP) |
| Vigne mal placée vue d'un autre angle | L3 | captures sur 5 vues avant C1 |
| `prepare-3d.mjs` écrase les vues ajoutées | L3 | relance à blanc et diff (3.5) |
| Texte EN oublié | L2, L4 | test `i18n.spec.ts` + relecture des chaînes modifiées |
