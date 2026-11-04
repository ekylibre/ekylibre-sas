# Conception 03 — Illustration des outils (inspiration oskale) et ajout de Lyvre

Date : 2026-11-04. Entrée : `docs/brainstorm/03-outils-oskale-lyvre.md` (F1–F6, N1–N6, D19–D25).
Complète `docs/design/02-architecture.md` sans en changer les principes (Astro statique, îlots
paresseux, CSP par empreintes, FR/EN par table de routes).

## 1. Vue d'ensemble

```
src/data/products.yaml ──► src/lib/products.ts (Zod, getProducts(lang))
        │                         │
        │      ┌──────────────────┼───────────────────────────┬──────────────────────┐
        ▼      ▼                  ▼                           ▼                      ▼
 src/assets/brand/products/  SystemDiagram.astro (F2)   ToolStory.astro (F3)   ProductHero.astro
 (logos officiels, copies)   schéma isométrique,        onglets 01/04→04/04,   en tête des 4 pages
                             SVG généré au build         maquette par outil     produit (D22)
                                    │                           │                      │
                                    └──── src/lib/iso.ts        └──── mockups/*Mockup.astro ◄┘
                                          (géométrie iso,             (+ MockFrame, StatusBadge)
                                           build uniquement)
Accueil : « Nos logiciels » = SystemDiagram + ToolStory      Page /lyvre/ et /en/lyvre/ (D20)
Scène 3D : Lyvre ajouté dans la zone « bureau »              Réécriture D25 (Ekylibre recentré)
```

Principes :
- **Une seule source** pour les quatre outils (`products.yaml`) : nom, logo, rôle, accroches, état, liens,
  flux. Le menu, le pied de page, le schéma, le récit, les pages, le JSON-LD et les images OG la lisent.
- **Zéro dépendance nouvelle.** Le schéma est du SVG calculé au build ; les maquettes sont du HTML/SVG
  animé en CSS ; un petit script commun (< 3 ko) pilote les états (onglets, survol, lecture à l'écran).
  GSAP n'est pas nécessaire ici.
- **Logos jamais modifiés** : copiés tels quels, affichés en `<img>` (pas d'injection inline → aucun
  attribut `style` à craindre pour la CSP, fichier identique à la source).

## 2. Données

### 2.1 `src/data/products.yaml`

```yaml
- key: ekylibre            # = clé de route
  name: Ekylibre
  logo: ekylibre.svg       # src/assets/brand/products/
  logoSource: ekylibre-old/… (couleurs officielles à reprendre, cf. §9)
  status: service          # service | en-cours | beta
  role: { fr: Gérer l'exploitation, en: Run the farm }
  tagline: { fr: Matériels, stocks, GPS, capteurs et agronomie, au même endroit., en: … }
  points: { fr: [...], en: [...] }       # 3 à 4, longueurs et formes variées (F3, pas de gabarit)
  links: { site: https://ekylibre.org/, code: https://github.com/ekylibre/ekylibre }
- key: lexicon   … status: service, links.site lexicon.osfarm.org, steward: OSFarm
- key: aiffel    … status: beta (D28), links.site aiffel.org
- key: lyvre
  name: Lyvre
  logo: lyvre.svg          # copie de compta-asso/frontend/src/assets/lyvre-symbole.svg
  status: service
  subStatus: { fr: Partie agricole en cours, en: Farm accounting in progress }   # D24
  links:
    site: https://lyvre.seconde-nature.net/about
    code: https://github.com/asso-seconde-nature/seconde-compta   # D23 : seule valeur à changer
                                                                  #  au transfert vers ekylibre/lyvre
flows:                     # arêtes du schéma (F2) et des récits
  - { from: farmer,   to: aiffel,   label: {fr: dicte, en: dictates},              status: service }
  - { from: aiffel,   to: ekylibre, label: {fr: interventions, stocks},           status: service }
  - { from: lexicon,  to: aiffel,   label: {fr: vérifie},                           status: service }
  - { from: lexicon,  to: ekylibre, label: {fr: phyto, parcelles, météo},           status: service }
  - { from: ekylibre, to: lyvre,    label: {fr: achats, ventes, stocks valorisés},  status: en-cours }
  - { from: aiffel,   to: lyvre,    label: {fr: pièces, écritures},                 status: en-cours }
  - { from: lexicon,  to: lyvre,    label: {fr: plan comptable agricole, indices},  status: en-cours }
```

Les textes définitifs sont rédigés au moment de l'implémentation (FR puis EN).

### 2.2 `src/lib/products.ts`

```ts
export type ProductKey = 'ekylibre' | 'lexicon' | 'aiffel' | 'lyvre';
export type Status = 'service' | 'en-cours' | 'beta';
export interface Product { key: ProductKey; name: string; logo: ImageMetadata; status: Status;
  subStatus?: string; role: string; tagline: string; points: string[];
  links: { site: string; code?: string }; steward?: string }
export interface Flow { from: ProductKey | 'farmer'; to: ProductKey; label: string; status: Status }
export function getProducts(lang: Locale): Product[];   // ordre : ekylibre, lexicon, aiffel, lyvre
export function getFlows(lang: Locale, focus?: ProductKey): Flow[];
export const STATUS_LABEL: Record<Status, Record<Locale, string>>; // En service / En cours / Bêta
```

Validation Zod au build (comme `connectors.yaml`) ; `check-content.mjs` vérifie que chaque `logo` existe
et que chaque `key` de produit a une route.

### 2.3 Logos (`src/assets/brand/products/`)

| Fichier | Source | Remarque |
|---|---|---|
| `ekylibre.svg` | logo officiel (dépôts `ekylibre-old`) | version couleur ; l'actuel `ekylibre-logo.svg` est monochrome (`fill` hérité) et reste pour l'en-tête |
| `lexicon.svg` | `../lexicon-rest-api/public/images/lexicon-logo.svg` (52 ko → svgo sans toucher aux tracés ni couleurs) | |
| `aiffel.svg` | `https://aiffel.org/favicon.svg` | |
| `lyvre.svg` | `../compta-asso/frontend/src/assets/lyvre-symbole.svg` | symbole seul ; le nom « Lyvre » est écrit à côté en texte |

`docs/illustrations-inventaire.md` reçoit une section « logos produits » (source, date de copie, ayant
droit). **Présentation** : chaque logo est posé sur une **pastille claire** (`straw-50`, coins 1rem,
ombre légère) y compris sur fond sombre ; on n'a donc pas besoin de variantes inversées ni de recolorer.

## 3. Langage visuel (inspiré d'oskale, palette du site)

- Dessin au trait, projection isométrique 30°, épaisseur 1,25 px (`vector-effect: non-scaling-stroke`).
- Sur fond sombre (`night-900`) : traits `straw-50/35` ; sur fond clair : `ink-500/60`.
- Élément actif : faces supérieures remplies `eky-green/20`, contour `eky-green-light`.
- Flux **en service** : tirets `4 6` en `eky-green-light`, défilement continu (`stroke-dashoffset`).
- Flux **en cours** : tirets `2 6` en `wheat-400`, sans défilement, étiquette « en cours ».
- Légendes en `font-mono` capitales espacées : « FIG. 01 · SYSTÈME · TOUCHEZ UN LOGICIEL ».
- Maquettes : cadre fin, en-tête de fenêtre (3 points + titre mono), lignes de données grisées en
  « squelette », valeurs clés en clair, mention « données de démonstration ». Pas de captures réelles.
- Badges d'état : pastille + texte mono (`● EN SERVICE` vert, `◐ EN COURS` blé, `◇ BÊTA` ciel).

## 4. Composants

### 4.1 `src/lib/iso.ts` (build uniquement)

Fonctions pures qui renvoient des chaînes `d` de chemins SVG à partir de coordonnées (x, y, z) :
`project(x,y,z)`, `box(x,y,z,w,d,h) → {top,left,right}`, `slab(...)` (plateau), `cylinder(...)`
(approximation par ellipses), `path(points)`. Utilisées dans le frontmatter Astro : le navigateur ne
reçoit que du SVG statique. Testées par un test unitaire simple (Vitest non requis : test Node `node:test`).

### 4.2 `SystemDiagram.astro` (F2)

Props : `lang`, `tone: 'dark' | 'light'`, `focus?: ProductKey` (pages produit : un outil mis en avant,
les autres atténués), `caption?: boolean`.

Composition (viewBox 1200 × 720) :
- Centre : **Aiffel**, plateau isométrique bas (comme le socle oskale) portant une bulle de parole.
- Gauche : **Ekylibre**, hangar + tracteur + capteur sur mât (gestion, matériels, capteurs — D25).
- Haut : **Lexicon**, pile de disques de données (référentiels).
- Droite : **Lyvre**, registre ouvert + pile de pièces (comptabilité).
- Bas : petite silhouette **agriculteur** (point d'entrée de la voix).
- Arêtes : `getFlows()`, tracées en chemins orthogonaux isométriques ; chaque arête porte les classes
  `flow from-<a> to-<b> is-<status>`.

Interaction et accessibilité :
- Les logos ne sont pas dans le SVG : quatre **boutons HTML** positionnés en `%` au-dessus du SVG
  (pastille logo + nom). Le SVG est `aria-hidden`. Ordre de tabulation : Aiffel, Ekylibre, Lexicon, Lyvre.
- Survol, focus ou toucher d'un bouton → `data-active="<key>"` sur la racine. Le CSS met en avant le
  bâtiment et les arêtes `from-<key>`/`to-<key>`, atténue le reste.
- Un panneau texte sous le schéma (`aria-live="polite"`) affiche : rôle, flux entrants/sortants avec
  leur état, lien vers la page de l'outil. État initial : Aiffel actif (texte présent dans le HTML, sans JS).
- Défilement automatique d'un outil à l'autre toutes les 5 s quand le schéma est visible, arrêté
  définitivement à la première interaction ; jamais en mouvement réduit.
- Mobile (< 640 px) : même schéma, boutons sous le SVG en grille 2 × 2 pour des cibles de 44 px.

### 4.3 `ToolStory.astro` (F3)

Section sombre. En haut : titre ; en bas : **liste d'onglets** `01 EKYLIBRE · 02 LEXICON · 03 AIFFEL ·
04 LYVRE` avec barre de progression sous l'onglet actif (motif oskale).

- ARIA `tablist` / `tab` / `tabpanel`, flèches gauche/droite, Début/Fin ; tous les panneaux sont dans le
  HTML (le contenu reste indexable ; sans JS, ils s'affichent les uns sous les autres).
- Panneau : à gauche, `04/04 · LOGICIEL COMPTABLE` (mono), logo sur pastille + nom en grand, accroche,
  3–4 points, `StatusBadge` (+ `subStatus` pour Lyvre), liens « Découvrir » (page), « Site ↗ », « Code ↗ ».
  À droite, la maquette de l'outil.
- Avance automatique toutes les 9 s quand la section est visible (la barre de progression représente
  le temps), pause au survol/focus, arrêt après un clic ; pas d'avance en mouvement réduit.
- La maquette du panneau actif reçoit `data-play` → son animation CSS repart du début.

### 4.4 Maquettes (`src/components/mockups/`)

`MockFrame.astro` (cadre, titre, mention démo) et une maquette par outil, utilisables en deux tailles
(`size: 'story' | 'hero'`). Animations en CSS (`@keyframes`, délais en cascade de 0,3 à 4 s), démarrées
par `[data-play]`, état final figé avec `prefers-reduced-motion`. Contenus (données fictives,
FarmLab La Vauzelle) :

| Maquette | Séquence |
|---|---|
| **Ekylibre** (D25) | Carte « Intervention · pulvérisation » (parcelle Les Quarante, matériel, dose avec ✓ « vérifiée dans le Lexicon ») → trace GPS qui se dessine sur une mini-parcelle → stock « cuivre 25 kg → 21,5 kg » qui décompte → jauge capteur (humidité du sol) qui se met à jour. |
| **Lexicon** | Champ de requête qui s'écrit (`parcelle 17250 · Saint-Porchaire`) → 4 lignes résultat aux couleurs des familles (cadastre, PAC, phyto, météo) reliées par un trait → compteur de lignes. |
| **Aiffel** | Bulle agriculteur « J'ai traité les Quarante ce matin, 3 kg de cuivre » → carte de reformulation (champs + source « Lexicon · AMM ») → bouton « Valider » coché → deux sorties : « écrit dans Ekylibre ✓ » et « pièce pour Lyvre · en cours ». |
| **Lyvre** | Facture fournisseur (champs lus) → relevé bancaire, coches de rapprochement une à une → compte de résultat qui se remplit → puces `60111 Engrais · 31151 Avances aux cultures` avec badge « agricole · en cours ». |

### 4.5 `StatusBadge.astro`, `ProductLogo.astro`

- `StatusBadge` : `status`, `lang`, `detail?` → pastille + libellé mono.
- `ProductLogo` : `product`, `size: 'sm'|'md'|'lg'` → pastille claire + `<Image>` (alt = nom du produit,
  ou alt vide quand le nom est écrit juste à côté).

### 4.6 `ProductHero.astro` (D22)

Remplace le hero des pages Ekylibre, Lexicon, Aiffel et équipe Lyvre : à gauche eyebrow + logo + h1 +
paragraphe + boutons (props/slots, textes inchangés hors D25) ; à droite la maquette de l'outil en taille
`hero`, jouée à l'entrée dans l'écran (IntersectionObserver). Les illustrations isométriques actuelles
(bureau, plan…) descendent dans les sections inférieures.

### 4.7 Script commun `src/scripts/tools.ts`

Chargé par `SystemDiagram`, `ToolStory` et `ProductHero` (bundle Astro, < 3 ko) : IntersectionObserver
(play/pause), gestion des onglets ARIA, `data-active` du schéma, minuteries d'avance automatique, respect
de `prefers-reduced-motion` et de `document.hidden`.

## 5. Accueil

Section « Trois communs, une même donnée » → **« Quatre logiciels libres, un seul système »** :
1. Titre + chapeau : « Ekylibre SAS édite, opère et contribue en premier lieu à quatre logiciels libres.
   Le Lexicon est un commun de l'association OSFarm. » (F6, D19)
2. `SystemDiagram` (fond clair, `section-light`).
3. `ToolStory` (fond sombre, à la suite).

Les cartes à médaillons génériques sont supprimées. Le récit 3D (chapitre « bureau ») est réécrit (D25).

## 6. Page Lyvre (`/lyvre/`, `/en/lyvre/`, D20)

Clé de route `lyvre` (même slug FR/EN). `src/components/products/LyvrePage.astro`, sur le modèle des
autres pages :

1. **Hero** (`ProductHero` + maquette Lyvre) : « La comptabilité libre, sobre et souveraine — et bientôt
   celle de la ferme. » Boutons : Demander une démo, Voir Lyvre ↗, Code ↗.
2. **Qui fait quoi** : Ekylibre SAS édite et développe Lyvre ; premières structures utilisatrices :
   l'association Seconde Nature et la SCI des Chênes Verts (D27).
3. **Ce que fait Lyvre** (grille) : comptabilité (partie double ou simplifiée, plans associatif, SCI,
   PCG), banque et caisse, achats (Factur-X, OCR), ventes et baux, adhérents et dons, clôture et FEC,
   budget et projets, expert-comptable en lecture seule.
4. **La brique comptable de l'écosystème** (D21) : `SystemDiagram focus="lyvre"` + trois cartes de flux
   (Ekylibre, Aiffel, Lexicon → Lyvre) avec leur état « en cours ».
5. **Comptabilité agricole · en cours** (D24) : PCGA 2023 et régime BA, avances aux cultures et stocks
   agricoles, fermages et indices, calendrier TVA / MSA / PAC, reprise d'une comptabilité Ekylibre.
   Formulation au futur proche, aucune date.
6. **Intégrations** : Qonto, Sirene, Factur-X, Documenso, HelloAsso, Brevo, Stancer, Odoo, SMTP.
7. **Libre et chez vous** : AGPL-3.0, Docker, une base par structure, sauvegardes avec pièces.
8. **Pour qui** : associations, SCI, exploitations agricoles (en cours), experts-comptables.
9. `ProductCta`.

SEO : `softwareJsonLd` (SoftwareApplication, `applicationCategory: FinanceApplication`, licence AGPL),
image OG `lyvre-{fr,en}.jpg` (entrée ajoutée dans `scripts/og-images.mjs`), titre dans `ROUTE_TITLES`.

## 7. Réécriture D25 (Ekylibre recentré sur la gestion)

| Emplacement | Aujourd'hui | Cible |
|---|---|---|
| `EkylibrePage` titre, description, hero | « …ventes et comptabilité… une intervention se retrouve dans les stocks et dans les comptes » | Gestion de l'exploitation : matériels, stocks, suivi GPS, capteurs, agronomie ; « …se retrouve dans les stocks, sur la carte et, avec Lyvre, dans les comptes » |
| `EkylibrePage` fonctionnalités (D26) | 8 cartes dont Comptabilité, Ventes et achats | Parcelles et agronomie, Élevage, Vigne et chai, Matériels et suivi GPS, Capteurs, Stocks, Tableaux de bord, Réglementation ; carte « Comptabilité → avec Lyvre » qui renvoie vers `/lyvre/` |
| `HomePage` carte et `jsonld` Ekylibre | « cultures, élevage, stocks, ventes et comptabilité » | repris de `products.yaml` |
| `HomePage` chapitre « bureau » (3D) | « La comptabilité se nourrit de ce qui s'est passé au champ. » | « …et Lyvre en tire la comptabilité, sans ressaisie. » |
| `HomePage` chapeau du hero | liste « banque, comptabilité » | inchangé (niveau système) |
| `InteropPage` l. 48 | « …écritures comptables dans Ekylibre » | « …interventions, relevés ou données comptables » : les connecteurs existants (banque, Qonto, Baqio) écrivent aujourd'hui dans Ekylibre ; leurs fiches restent factuelles |
| `connectors.yaml` | fiches banque, Qonto, Baqio | inchangées (décrivent le code publié) |
| `timeline.yaml` 2026 | « Lexicon et Aiffel » | « Lexicon, Aiffel et Lyvre » |
| `og-images.mjs` | tagline Ekylibre | « Gérer l'exploitation : matériels, stocks, GPS, capteurs » + entrée Lyvre |
| `Header`, `Footer` | 3 produits | 4 produits (lus depuis `products.yaml`) |
| `LexiconPage`, `DevelopersPage` | « plan comptable agricole » | inchangé ; lien vers Lyvre pour l'usage comptable |

## 8. Scène 3D

Pseudo-connecteur **Lyvre** dans la zone `bureau` (comme Aiffel dans la cour) : médaillon avec le logo,
`InfoCard` avec état « En service · agricole en cours », arcs pointillés `wheat-400` vers Aiffel et vers
le hub (flux « en cours », sans défilement). Le type `Connector` reçoit un champ `status?` et un champ
`logo?` (URL d'image) pour afficher les vrais logos d'Aiffel et de Lyvre dans les médaillons. Le repli 2D
(`ConnectorDiagram`) suit automatiquement.

## 9. Décisions complémentaires (2026-11-04) et vérifications

- **D26 — Ventes et achats** quittent la page Ekylibre ; une carte renvoie vers Lyvre, qui les couvre.
- **D27 — Premières structures utilisatrices de Lyvre** : l'association Seconde Nature et la SCI des
  Chênes Verts (section « Qui fait quoi » de la page Lyvre, §6.2).
- **D28 — Aiffel est affiché « Bêta »** (`status: beta`).
- **D29 — Logo Ekylibre en couleur** : reprendre la version officielle trouvée dans `ekylibre-old` ;
  à défaut, garder le logo actuel sur la pastille claire et le signaler.
- À vérifier : le lien « site » de Lyvre (`lyvre.seconde-nature.net/about`) est une application rendue
  en JS ; suffisant tant qu'il n'y a pas de domaine propre.

## 10. Exigences non fonctionnelles et tests

- Poids ajouté sur l'accueil ≤ 60 ko compressés (SVG du schéma ≈ 15 ko, maquettes ≈ 20 ko, logos ≈ 20 ko
  après svgo, script ≈ 3 ko). Lighthouse accueil et `/lyvre/` ≥ 90.
- CSP inchangée : pas d'attribut `style` dans le HTML généré (positions des boutons du schéma par classes
  utilitaires générées ou attributs `x/y` SVG ; contrôle existant de `check-content`).
- Tests Playwright (`tests/products.spec.ts`) :
  - les 4 logos sont présents sur l'accueil, `src` résolu, `alt` correct ;
  - schéma : Tab jusqu'à « Lyvre » → le panneau annonce Lyvre et ses 3 flux « en cours » ;
  - récit : flèche droite change d'onglet, `aria-selected` et panneau visible cohérents ;
  - mouvement réduit émulé : aucune animation active (`getAnimations().length === 0`) et état final visible ;
  - `/lyvre/` et `/en/lyvre/` : 200, hreflang, JSON-LD valide ; axe sans violation.
- Les tests de routes (`i18n.spec.ts`, smoke) incluent `lyvre` automatiquement via `ROUTES` ;
  `verify-production.mjs` ajoute `/lyvre/` et `/en/lyvre/`.

## 11. Découpage proposé (pour `/sc:workflow`)

| Lot | Contenu | Dépend de |
|---|---|---|
| L1 | `products.yaml`, `products.ts`, logos, route `lyvre`, menu et pied de page | — |
| L2 | `iso.ts`, `SystemDiagram`, script commun | L1 |
| L3 | `MockFrame`, 4 maquettes, `StatusBadge`, `ToolStory` ; section accueil | L1, L2 |
| L4 | `ProductHero` sur Ekylibre, Lexicon, Aiffel | L3 |
| L5 | Page Lyvre FR/EN, JSON-LD, OG | L3, L4 |
| L6 | Réécriture D25 (tableau §7) | L1 |
| L7 | Lyvre dans la scène 3D | L1 |
| L8 | Tests, Lighthouse, `verify-production`, relecture EN | tous |
