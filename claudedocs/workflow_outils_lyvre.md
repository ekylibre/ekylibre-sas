# Plan de mise en œuvre — Illustration des outils et ajout de Lyvre

Entrées : `docs/brainstorm/03-outils-oskale-lyvre.md` (F1–F6, D19–D25) et
`docs/design/03-outils-lyvre.md` (conception, D26–D29). Site en production : chaque lot se termine par
un build et des tests verts, et peut être commité seul (sur accord). Exécution : `/sc:implement L1`, …

## Ordre et dépendances

```
L1 Données, logos, route ──┬─► L2 Schéma isométrique ──► L3 Maquettes + récit (accueil) ──► L4 Heros produit ──► L5 Page Lyvre
                           ├─► L6 Réécriture D25 (parallélisable avec L2–L4)
                           └─► L7 Lyvre dans la 3D (parallélisable)
                                                                  tous ──► L8 Recette, mise en ligne
```

Chemin critique : L1 → L2 → L3 → L4 → L5 → L8. Séances proposées : **S1** = L1 + L6, **S2** = L2 + L3,
**S3** = L4 + L5, **S4** = L7 + L8.

---

## L1 — Données, logos, route `lyvre`

| # | Tâche | Fichiers |
|---|---|---|
| 1.1 | Rechercher le logo Ekylibre officiel en couleur dans `../ekylibre-old` (D29) ; sinon garder le monochrome et le noter | `src/assets/brand/products/ekylibre.svg` |
| 1.2 | Copier les logos Lexicon, Aiffel (`aiffel.org/favicon.svg`), Lyvre (`lyvre-symbole.svg`) ; svgo sans toucher tracés ni couleurs ; vérifier l'absence d'attribut `style` | `src/assets/brand/products/*.svg` |
| 1.3 | Inventaire des logos (source, date, ayant droit) | `docs/illustrations-inventaire.md` |
| 1.4 | Créer `products.yaml` (4 produits, statuts : Ekylibre/Lexicon/Lyvre `service`, Aiffel `beta`, `subStatus` Lyvre « Partie agricole en cours », liens, flux §2.1) ; textes FR + EN | `src/data/products.yaml` |
| 1.5 | `products.ts` : schéma Zod, `getProducts`, `getFlows`, `STATUS_LABEL`, import des logos via `import.meta.glob` | `src/lib/products.ts` |
| 1.6 | Liens externes Lyvre (site, code) dans `LINKS` | `src/lib/links.ts` |
| 1.7 | Route `lyvre: { fr: '/lyvre/', en: '/en/lyvre/' }`, `ROUTE_TITLES`, pages minimales provisoires (hero + texte) pour que les tests de route passent | `src/i18n/routes.ts`, `src/i18n/ui.ts`, `src/pages/lyvre.astro`, `src/pages/en/lyvre.astro`, `src/components/products/LyvrePage.astro` |
| 1.8 | Menu et pied de page lus depuis `getProducts` (4 produits) ; vérifier l'en-tête au point de rupture `xl` et le menu mobile | `Header.astro`, `Footer.astro` |
| 1.9 | `check-content.mjs` : chaque logo existe, chaque produit a une route | `scripts/check-content.mjs` |
| 1.10 | `ProductLogo.astro` et `StatusBadge.astro` | `src/components/products/` |

**Contrôle L1** : `npm run build` ; `npm run test:smoke` et `tests/i18n.spec.ts` (incluent `lyvre` via
`ROUTES`) ; les 4 logos s'affichent dans `/design-system/` (ajout d'une rangée « logos produits »).

## L2 — Schéma isométrique `SystemDiagram` (F2)

| # | Tâche | Fichiers |
|---|---|---|
| 2.1 | Géométrie iso : `project`, `box`, `slab`, `cylinder`, `path` + test `node:test` | `src/lib/iso.ts`, `tests/unit/iso.test.mjs` |
| 2.2 | Dessins des 5 éléments (Aiffel socle + bulle, Ekylibre hangar/tracteur/capteur, Lexicon disques, Lyvre registre, agriculteur) | `src/components/system/SystemDiagram.astro` (+ sous-fichier `shapes.ts` si besoin) |
| 2.3 | Arêtes depuis `getFlows`, classes `flow from-* to-* is-*`, styles service / en cours, défilement CSS | idem + `src/styles/system.css` |
| 2.4 | Boutons HTML superposés (positions par classes, sans attribut `style`), grille 2 × 2 sous 640 px | idem |
| 2.5 | Panneau `aria-live` ; état initial Aiffel rendu côté serveur | idem |
| 2.6 | Script commun : `data-active`, avance auto 5 s si visible, arrêt à la 1re interaction, mouvement réduit, `document.hidden` | `src/scripts/tools.ts` |
| 2.7 | Variantes `tone` (clair/sombre) et `focus` | idem |

**Contrôle L2** : rendu dans `/design-system/` (clair, sombre, focus Lyvre) ; navigation au clavier et
au toucher (émulation mobile) ; aucune violation axe ; build sans avertissement CSP.

## L3 — Maquettes, `ToolStory`, section de l'accueil (F3, F4)

| # | Tâche | Fichiers |
|---|---|---|
| 3.1 | `MockFrame` (cadre, titre mono, « données de démonstration »), tailles `story`/`hero` | `src/components/mockups/MockFrame.astro` |
| 3.2 | Maquette Ekylibre (intervention → trace GPS → stock → capteur) | `EkylibreMockup.astro` |
| 3.3 | Maquette Lexicon (requête → 4 familles → compteur) | `LexiconMockup.astro` |
| 3.4 | Maquette Aiffel (dictée → reformulation + source → validation → Ekylibre ✓ / Lyvre en cours) | `AiffelMockup.astro` |
| 3.5 | Maquette Lyvre (facture → rapprochement → résultat → comptes agricoles « en cours ») | `LyvreMockup.astro` |
| 3.6 | Animations CSS déclenchées par `[data-play]`, état final en mouvement réduit | `src/styles/mockups.css` |
| 3.7 | `ToolStory` : `tablist` ARIA, flèches/Début/Fin, barre de progression, avance 9 s, pause survol/focus, arrêt au clic, repli sans JS (panneaux empilés) | `src/components/system/ToolStory.astro`, `src/scripts/tools.ts` |
| 3.8 | Accueil : section « Quatre logiciels libres, un seul système » (chapeau D19/F6) = `SystemDiagram` + `ToolStory` ; suppression des cartes à médaillons | `src/components/home/HomePage.astro` |

**Contrôle L3** : accueil FR/EN relu à 1440, 1024, 390 px ; Lighthouse accueil ≥ 90 (mesure avec le
binaire Chromium de Playwright) ; poids ajouté ≤ 60 ko compressés (comparaison `dist/` avant/après).

## L4 — `ProductHero` sur les pages existantes (D22)

| # | Tâche | Fichiers |
|---|---|---|
| 4.1 | `ProductHero` (eyebrow, logo, h1, paragraphe, boutons en slot, maquette `hero` jouée à l'entrée dans l'écran) | `src/components/products/ProductHero.astro` |
| 4.2 | Ekylibre, Lexicon, Aiffel : remplacer le hero ; déplacer l'illustration isométrique dans une section inférieure | `EkylibrePage.astro`, `LexiconPage.astro`, `AiffelPage.astro` |
| 4.3 | Vérifier que le LCP reste du texte (maquette non bloquante) | — |

**Contrôle L4** : Lighthouse des 3 pages ≥ 90 ; tests a11y existants verts.

## L5 — Page Lyvre complète (D20, D21, D24, D27)

| # | Tâche | Fichiers |
|---|---|---|
| 5.1 | Rédaction FR puis EN des 9 sections (design §6) à partir du README et de la page /about de Lyvre ; « Qui fait quoi » : Ekylibre SAS éditeur, Seconde Nature et SCI des Chênes Verts premières structures utilisatrices | `LyvrePage.astro` (ou `docs/contenus/fr/lyvre.md` puis page) |
| 5.2 | Section « brique comptable » : `SystemDiagram focus="lyvre"` + 3 cartes de flux « en cours » | idem |
| 5.3 | Section « Comptabilité agricole · en cours » sans date (D24) | idem |
| 5.4 | JSON-LD `SoftwareApplication` (`FinanceApplication`, AGPL-3.0) | `src/components/products/jsonld.ts` |
| 5.5 | Image OG `lyvre-{fr,en}` ; régénérer avec `node scripts/og-images.mjs` | `scripts/og-images.mjs`, `public/og/` |

**Contrôle L5** : `/lyvre/` et `/en/lyvre/` 200, hreflang, sélecteur de langue ; JSON-LD validé
(schema.org) ; axe ; Lighthouse ≥ 90.

## L6 — Réécriture D25 / D26 (Ekylibre recentré)

| # | Tâche | Fichiers |
|---|---|---|
| 6.1 | Page Ekylibre : titre, description, hero (matériels, stocks, GPS, capteurs, agronomie) | `EkylibrePage.astro` |
| 6.2 | Fonctionnalités : retirer Comptabilité et Ventes/achats ; ajouter Matériels et suivi GPS, Capteurs ; carte « Comptabilité, ventes et achats → avec Lyvre » | idem |
| 6.3 | Accueil : carte/accroche Ekylibre depuis `products.yaml` ; chapitre « bureau » du récit 3D | `HomePage.astro` |
| 6.4 | Interopérabilité l. 48 (formulation neutre) ; fiches connecteurs inchangées | `InteropPage.astro` |
| 6.5 | Frise 2026 « Lexicon, Aiffel et Lyvre » ; tagline OG Ekylibre | `src/data/timeline.yaml`, `scripts/og-images.mjs` |
| 6.6 | JSON-LD Ekylibre (description) ; recherche finale `grep -ri "comptab\|accounting"` et relecture de chaque occurrence restante | `jsonld.ts`, `src/` |

**Contrôle L6** : build ; relecture FR/EN des pages modifiées ; aucune mention de comptabilité dans
Ekylibre sans renvoi vers Lyvre.

## L7 — Lyvre dans la scène 3D

| # | Tâche | Fichiers |
|---|---|---|
| 7.1 | Type `Connector` : champs `status?`, `logo?` ; médaillons avec le vrai logo pour Aiffel et Lyvre | `src/islands/farm-scene/types.ts`, `connectors.ts`, `FarmScene.astro` |
| 7.2 | Pseudo-connecteur Lyvre dans la zone `bureau`, `InfoCard` « En service · agricole en cours » | `FarmScene.astro`, `InfoCard.astro` |
| 7.3 | Arcs `wheat-400` statiques Lyvre ↔ Aiffel et Lyvre ↔ hub | `flows.ts` |
| 7.4 | Repli 2D `ConnectorDiagram` : Lyvre présent | `ConnectorDiagram.astro` |

**Contrôle L7** : tests 3D locaux (`?force3d`, hors CI) ; repli 2D vérifié ; contrôle visuel sur une
vraie machine par l'utilisateur.

## L8 — Recette et mise en ligne

| # | Tâche |
|---|---|
| 8.1 | `tests/products.spec.ts` : 4 logos (src, alt), schéma au clavier (Lyvre → 3 flux « en cours »), onglets (flèches, `aria-selected`), mouvement réduit (`getAnimations().length === 0`), `/lyvre/` JSON-LD |
| 8.2 | `tests/a11y.spec.ts` : ajouter `/lyvre/`, `/en/lyvre/` |
| 8.3 | `verify-production.mjs` : ajouter `/lyvre/`, `/en/lyvre/` |
| 8.4 | `npm run build`, `npm test`, Lighthouse (accueil, Ekylibre, Lyvre, mobile et bureau) |
| 8.5 | Relecture de l'anglais (rédigé par Claude) et des points ouverts |
| 8.6 | Commit et push sur accord → déploiement GitHub Actions → `node scripts/verify-production.mjs https://ekylibre.com` |
| 8.7 | Mémoire projet et `docs/design/03-outils-lyvre.md` mis à jour (écarts éventuels) |

## Critères de fin (repris du brainstorm)

- CA1 logos réels identiques aux sources ; CA2 schéma utilisable souris / clavier / toucher, axe propre ;
  CA3 une maquette animée par outil, statique en mouvement réduit ; CA4 Lyvre FR/EN avec « agricole en
  cours » ; CA5 build, tests et Lighthouse ≥ 90.

## Risques

| Risque | Parade |
|---|---|
| Logo Ekylibre couleur introuvable | Logo monochrome sur pastille, signalé (D29) |
| Logo Lexicon lourd (52 ko) | svgo sûr ; sinon export WebP haute définition, à faire valider |
| Schéma illisible sur mobile | Boutons sous le SVG, panneau texte suffisant à lui seul |
| Animations trop nombreuses à l'écran | Une seule maquette jouée à la fois ; pause hors écran et onglet caché |
| Attribut `style` généré (CSP) | Positions par classes ou attributs SVG ; contrôle `check-content` |
| Textes D25 en avance sur le logiciel | Formulations au présent pour ce qui existe, « en cours » pour le reste ; fiches connecteurs factuelles |

## Avancement

- **S1 (L1 + L6)** — fait le 2026-11-04. Logo Ekylibre : la version officielle est monochrome (D29).
- **S2 (L2 + L3)** — fait le 2026-11-04. `tests/products.spec.ts` (4 tests) et `tests/unit/iso.test.ts`
  ajoutés en avance sur L8. Poids ajouté à l'accueil ≈ 29,5 ko compressés. Lighthouse mobile local 87
  (version en production, mesurée dans les mêmes conditions : 86) ; bureau 99.
- **S3 (L4 + L5)** — fait le 2026-11-04. `ProductHero` sur les 4 pages produit (maquette jouée à l'écran) ;
  illustrations isométriques déplacées dans « Qui fait quoi » ; chiffres du Lexicon sous l'en-tête ;
  page Lyvre : schéma centré sur Lyvre (remplace les 3 cartes de flux). Test axe : attente de la fin des
  animations `mk-*`. Lighthouse mobile local : Ekylibre 95, Lyvre 93, Aiffel 96 ; accessibilité 100.
- **S4 (L7 + L8)** — fait le 2026-11-04, hors mise en ligne. Lyvre au bureau de la scène 3D (pseudo-connecteur,
  logo, état, lien), arcs ocre immobiles Lyvre ↔ cœur et Lyvre ↔ cour, logos réels d'Aiffel et Lyvre dans
  la fiche ; Lyvre dans le repli 2D. Tests : 184 (CI) + 13 scène 3D locale, 4 unitaires. Reste : commit,
  push, `verify-production.mjs` après déploiement (sur accord).
