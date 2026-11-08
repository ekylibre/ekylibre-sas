# Conception 04 — Accueil Fourmy, kit isométrique, connecteurs Fourmy et Lyvre

Date : 2026-11-08 · **Réalisé** (commits `a4d3629`…`03b8251`, bilan : `claudedocs/workflow_accueil_kit_connecteurs.md`). Entrée : `docs/brainstorm/04-accueil-kit-isometrique-connecteurs.md` (FR-3D, FR-REC,
FR-KIT, FR-SYS, FR-CON, NFR-1 à 5). Complète `docs/design/02-architecture.md` et `03-outils-lyvre.md`
sans en changer les principes : Astro statique, îlots paresseux, CSP par empreintes, FR/EN par table de routes.

## 1. Vue d'ensemble

```
Archive Graphisme (.ai/.svg, 196 fichiers, hors dépôt)
   │  scripts/kit/convert.mjs  (Inkscape snap : .ai → SVG, aperçu PNG, boîtes --query-all)
   ▼
~/Documents/archive_ekylibre/kit-isometrique/   (SVG convertis, aperçus, CSV ; hors dépôt, ~100 Mo/fichier)
   │  docs/kit-isometrique/inventaire.md   ◄── généré (recensement FR-KIT-1)
   │  docs/kit-isometrique/elements.yaml   ◄── curation à la main : un rectangle par élément
   │  scripts/kit/extract.py   (découpe par rectangle + defs utilisés → Inkscape vacuum → svgo)
   ▼
src/assets/kit/<catégorie>/<id>.svg  +  src/assets/kit/kit.json      (dans le dépôt, optimisés)
   │
   ├──► SystemDiagram.astro   (volumes iso remplacés par <image> du kit ; flux, boutons, panneau inchangés)
   └──► /design-system/       (planche du kit, pour relecture)

src/data/connectors.yaml  (réécrit : intégrations Fourmy et Lyvre, état stable | en-cours)
   │  src/lib/interop.ts  connectors(lang)   (remplace stableConnectors ; plus de plugins.json)
   ├──► FarmScene (accueil + interop)  ├──► ConnectorTable  ├──► ConnectorDiagram (repli sans WebGL)
public/3d/scene.json  (zone « vigne » déplacée, vues « elevage » et « vigne »)
HomePage.astro         (récit en 7 chapitres)
```

## 2. Décisions de conception

| # | Décision | Raison |
|---|---|---|
| D31 | La zone `vigne-chai` est renommée **`vigne`** (clé de `scene.json`, `ZONE_META`, `connectors.yaml`, `vineyard.ts`). | Le chai disparaît du libellé ; une clé qui ment finit par tromper. |
| D32 | `connectors.yaml` devient la **seule source** des connecteurs : l'état (`stable` / `en-cours`) est éditorial, plus déduit des tags GitHub. `plugins.json` et la partie plugins de `fetch-plugins.mjs` sont supprimés. | Fourmy est un monorepo (pas de tag par connecteur) ; les plugins Ekylibre sont retirés du site. |
| D33 | Un connecteur `stable` porte un `source` (chemin dans le dépôt du logiciel) ; `check-content.mjs` refuse un `stable` sans `source`. | NFR-4 : « stable » = code publié. |
| D34 | La scène 3D montre les intégrations **Fourmy** (stables et en cours) et les **logiciels** Aiffel et Lyvre ; les intégrations Lyvre ne sont **que dans le tableau**. | Le bureau doit dire « Lyvre » (FR-3D-6), pas une liste de neuf services. |
| D35 | Plus aucun compteur de connecteurs : la case du bandeau devient **« 4 logiciels libres, un seul système »** (chiffre lu dans `products.yaml`). | Décision brainstorm ; un chiffre stable et vrai remplace un chiffre qui s'effondre. |
| D36 | Le kit est **extrait par rectangle** depuis les SVG convertis, pas par calque ni identifiant. | Constat du 2026-11-08 : Inkscape ouvre les `.ai` par leur flux PDF ; `Isometric-full.ai` donne **un seul calque de ~158 000 tracés**, sans groupes nommés. `--query-all` rend les boîtes des 166 528 objets en 9 s. |
| D37 | Les éléments du kit sont livrés en **SVG optimisé** ; si un élément dépasse **40 Ko gzip**, le schéma utilise une **WebP** dérivée au build (`getImage`), le SVG restant la source. | NFR-2 (≤ ~150 Ko pour le schéma) ; les illustrations détaillées peuvent compter des milliers de tracés. |

## 3. Scène 3D de l'accueil

### 3.1 Zones et vignoble (`public/3d/scene.json`, `vineyard.ts`)

- `zones.vigne` remplace `zones["vigne-chai"]` (`xz` actuel `[-85, 60]`).
- **Placement « à côté du maraîchage, derrière le hangar »** : repères relevés dans `farm-full.glb` :
  hangar (`SITE_batiment_bat4_hangar_0_toit`) vers `(x 9, z 9)`, maraîchage `[-54, 33]`, caméra d'accueil
  (`hub`) en `(210, 105, 190)`. Vu de l'accueil, « derrière le hangar » = côté −x/−z du hangar.
  **Candidat A : `xz [-28, 0]`**, entre le hangar et le maraîchage. Contrôle à l'implémentation avec
  `?zones` en dev, sur les vues `hub`, `champs`, `vigne` et `synthese` :
  1. emprise du vignoble (14 rangs × 34 m ≈ 34 × 34 m, `HEADING` ajustable) sur sol libre, `groundAt` défini partout ;
  2. le hangar masque partiellement les vignes depuis la vue `hub` ;
  3. les médaillons `maraichage`, `hangars` et `vigne` ne se chevauchent pas (écart ≥ 48 px à 1280 px de large).
  Si A échoue, on essaie le long du bord nord du maraîchage, puis on montre deux captures pour choisir.
- **Retenu après C1 (2026-11-08)** : le candidat A tombait sur une haie. Les vignes sont posées **hors de
  l'enceinte, dans le champ à l'ouest du long bâtiment au toit noir** (`SITE_batiment_bat1`,
  x −45…−14, z −64…−6) : `xz [-80, -30]`, 12 rangs × 28 m. Vue `vigne` : position `[-150, 150, 240]`,
  cible `[-65, -4, -25]`.
- `vineyard.ts` lit `anchors.get('vigne')` ; commentaire mis à jour (Baqio, plus Ekyviti).

### 3.2 Médaillons (`connectors.ts`, `FarmScene.astro`, `interop.ts`)

| Zone | Titre (FR / EN) | Sous-titre (2 premiers partenaires) |
|---|---|---|
| hub | **Le système d'information agricole** / The farm information system | **Fourmy** + logo Fourmy dans le disque |
| hangars | Le hangar | Traccar |
| parcelles | Les grandes cultures | IGN |
| meteo | La météo | Weenat · Sencrop |
| maraichage | Le maraîchage | CapTrap · Open Sprinkler |
| elevage | L'élevage | EDE · Baoba |
| vigne | **La vigne** / The vineyard | Baqio |
| bureau | Le bureau | Lyvre |
| cour | L'agriculteur | aiffel.org |

- Le séparateur reste ` · ` (convention de la scène ; la note écrit « - »).
- **Moyeu** : `connectors.ts` ne code plus « Ekylibre » en dur. `props.strings` reçoit `hub.title`
  (« Le système d'information agricole ») et `hub.subtitle` (« Fourmy ») ; `props.hubLogo` reçoit l'URL de
  `src/assets/brand/products/fourmy.svg`. Le disque affiche `<img alt="">` à la place du hibou ; le libellé
  accessible devient « Le système d'information agricole, Fourmy ». CSS : `.scene-medallion.is-hub img`
  (taille du disque, pas de filtre) ; le titre long passe sur deux lignes au-delà de 18 caractères.
- `ZONE_META.hub.title` : « Fourmy, le cœur » (utilisé dans InfoCard et le repli).
- Textes d'Aiffel et de Lyvre dans `FarmScene.astro` : « Ekylibre » → « Fourmy ».
- **En cours** : un connecteur `en-cours` garde son médaillon ; sa fiche (InfoCard) affiche le badge
  `StatusBadge` « en cours » et pas de version. Les arcs ocre (`wipLinks`) restent réservés à Aiffel et Lyvre.

### 3.3 Récit (`HomePage.astro`)

| Ordre | id | Vue caméra | Zones révélées (cumul) |
|---|---|---|---|
| 0 | ouverture | hero | hub |
| 1 | champs | champs | + hangars, parcelles, meteo, maraichage |
| 2 | elevage | **elevage** (nouvelle) | + elevage |
| 3 | vigne | **vigne** (nouvelle) | + vigne |
| 4 | bureau | hub | + bureau |
| 5 | ciel | ciel | idem, ciel visible |
| 6 | voix | cour | + cour |
| 7 | synthese | synthese | all |

- Vues nouvelles dans `scene.json` (`prepare-3d.mjs` conserve vues et zones existantes) :
  `elevage` cible le poulailler `(54, 0, 50)` ; `vigne` cible la zone `vigne`. Point de départ : la vue
  `elevage-vigne` (`position [-40, 160, 320]`, `fov 26`), recadrée sur chaque cible. `elevage-vigne` est supprimée.
- Textes : brainstorm §3.2, FR et EN (NFR-1). Eyebrows numérotés 1 à 7.
- Phrase sous la scène (l. 153, « N connecteurs publiés en version stable ») → « Des connecteurs en logiciel
  libre, stables ou en cours. » / « Free-software connectors, stable or in progress. »

## 4. Données des connecteurs

### 4.1 Schéma de `src/data/connectors.yaml` (Zod dans `content.config.ts`)

```yaml
- slug: traccar
  product: fourmy            # fourmy | lyvre
  status: stable             # stable | en-cours
  category: machines         # catégories existantes (CATEGORY_META)
  zone: hangars              # obligatoire si product = fourmy ; interdit pour lyvre
  dataFlow: in               # in | out | both (vers / depuis le logiciel)
  partner: { name: Traccar, url: 'https://www.traccar.org/' }
  title: { fr: Positions GPS des tracteurs, en: Tractor GPS tracking }
  summary: { fr: …, en: … }
  source: packages/connector-traccar   # requis si stable (D33)
```

`ConnectorView` : `slug, product, status, category, zone?, dataFlow, title, summary, partner?, codeUrl`.
`codeUrl` = `https://github.com/ekylibre/<product>/tree/main/<source>` si `source`, sinon la page produit
(`routePath(product, lang)`). Tri : logiciel, puis état (stable d'abord), puis ordre du fichier (il fixe l'ordre des partenaires sur les médaillons, ex. « CapTrap · Open Sprinkler »).

### 4.2 Contenu initial

| slug | Logiciel | État | Zone | Catégorie | Partenaire | source |
|---|---|---|---|---|---|---|
| traccar | Fourmy | stable | hangars | machines | Traccar | `packages/connector-traccar` |
| ign | Fourmy | stable | parcelles | terrain | IGN (relief, photo, bâtiments) | `packages/geo-ign` |
| migration-ekylibre | Fourmy | stable | hub | gestion | — (reprise des fermes Ekylibre) | `packages/migrator-ekylibre` |
| weenat | Fourmy | en cours | meteo | meteo | Weenat | — |
| sencrop | Fourmy | en cours | meteo | meteo | Sencrop | — |
| captrap | Fourmy | en cours | maraichage | terrain | CapTrap | — |
| open-sprinkler | Fourmy | en cours | maraichage | terrain | OpenSprinkler | — |
| ede | Fourmy | en cours | elevage | elevage | EDE | — |
| baoba | Fourmy | en cours | elevage | elevage | Baoba *(orthographe à confirmer)* | — |
| baqio | Fourmy | en cours | vigne | vigne | Baqio | — |
| qonto, sirene, factur-x, documenso, helloasso, brevo, stancer, odoo, smtp | Lyvre | en cours | — | finance / gestion | chacun | — |

Les sources `packages/*` existent dans `ekylibre/fourmy` au 2026-11-08 ; l'implémentation les revérifie.

### 4.3 Consommateurs

| Fichier | Changement |
|---|---|
| `src/lib/interop.ts` | `connectors(lang, { product? })` remplace `stableConnectors` ; `ZONE_META` (`vigne`, hub) |
| `FarmScene.astro` | ne garde que `product: fourmy` + écosystème (D34) ; `hub.title`, `hubLogo` |
| `ConnectorTable.astro` | colonnes : Intégration · Fonction · Logiciel · Partenaire · Sens des données · État · Code ; légende « Intégrations de Fourmy et de Lyvre » ; `FLOW` dit « Vers le logiciel / Depuis le logiciel » |
| `ConnectorDiagram.astro` | même liste que la scène, groupée par zone |
| `InteropPage.astro` | titre l. 235 → « Des connecteurs en logiciel libre, stables ou en cours » ; textes « Ekylibre » → « Fourmy » quand ils parlent des connecteurs |
| `StatBand.astro` | 3ᵉ case : `getProducts().length` + « logiciels libres, un seul système » (D35) |
| `CompanyPage.astro` | même remplacement que le bandeau |
| `HomePage.astro` | §3.3 |
| `DevelopersPage.astro` | section « connecteurs = Rails engines `ekylibre-<nom>` » remplacée par le modèle de plugins Fourmy (service hors processus, manifeste, SDK Apache-2.0 — ADR-11 de Fourmy), lien vers le dépôt ; ligne « Plugins et connecteurs » du tableau des licences mise à jour |
| `lib/data.ts`, `fetch-plugins.mjs` → **`fetch-github.mjs`**, `data/generated/plugins.json` (supprimé), `stats.json` | suppression de la liste des plugins et de `stablePlugins` ; `stats.core` conservé ; `npm run fetch:data` et README mis à jour |
| `scripts/check-content.mjs` | contrôles D33 ; zone connue de `scene.json` pour chaque connecteur Fourmy |

Les actualités (`src/content/news/`) ne sont pas modifiées : ce sont des archives datées.

## 5. Kit isométrique

### 5.1 Conversion et recensement — `scripts/kit/convert.mjs`

- Entrée : `~/Documents/archive_ekylibre/ewannin@ekylibre.com/Graphisme` (récursif, `.ai` et `.svg`).
- Sortie : `~/Documents/archive_ekylibre/kit-isometrique/` (hors dépôt : ~95 Mo pour `Isometric-full`).
  Pour chaque fichier : `svg/<chemin>.svg`, `preview/<chemin>.png` (largeur 800 px), `bbox/<chemin>.csv`.
- Inkscape 1.4.4 snap (`/snap/bin/inkscape`) : **chemins absolus obligatoires** (un chemin relatif est résolu
  depuis `~`), pas de `/tmp` ni de dossier caché. ~1 min par gros fichier : traitement séquentiel,
  reprise possible (un fichier déjà converti et plus récent que sa source est sauté).
- Commandes : `--export-type=svg --export-plain-svg`, puis `--export-type=png --export-width=800`,
  puis `--query-all`.
- Un fichier qui ne s'ouvre pas est noté `échec` avec le message d'Inkscape, sans autre traitement.
- Génère `docs/kit-isometrique/inventaire.md` : chemin source, format, état, taille, nombre d'objets,
  colonne « isométrique » reprise de `elements.yaml` (oui si au moins un élément en est extrait).

### 5.2 Curation — `docs/kit-isometrique/elements.yaml`

```yaml
- id: hangar-materiel
  source: Isometric-full.ai
  rect: [2480, 3880, 1450, 1100]     # x, y, largeur, hauteur en unités du SVG converti
  exclude: [path1]                   # objets à écarter (sol, fond) ; facultatif
  category: batiments                # batiments | cultures | animaux | machines | capteurs | personnages | objets
  title: { fr: Hangar à matériel, en: Machinery shed }
  foot: [0.5, 0.92]                  # point de contact au sol, fraction de la boîte (défaut [0.5, 1])
```

Les rectangles se relèvent sur les aperçus PNG (échelle connue). Règle de sélection : un objet est gardé si
sa boîte est **entièrement contenue** dans `rect` et absente de `exclude`.

### 5.3 Extraction — `scripts/kit/extract.py` (Python 3, bibliothèque standard, lancé avec `-I`)

1. Lit le SVG converti et son CSV de boîtes ; garde les objets retenus dans l'ordre du document (l'ordre de
   peinture fait le dessin) avec leurs `transform` d'ancêtres.
2. Recopie les `defs` référencés (`clip-path`, dégradés, masques), récursivement.
3. Écrit un SVG au `viewBox` du rectangle, puis Inkscape `--vacuum-defs --export-plain-svg`, puis
   `svgo` (dépendance déjà présente ; précision 1, `removeDimensions`, sans `removeViewBox`).
4. Écrit `src/assets/kit/<category>/<id>.svg` et met à jour `src/assets/kit/kit.json`
   (`id, category, title, source, viewBox, foot, bytes, gzipBytes`). Signale tout élément > 40 Ko gzip.

Le script n'est pas lancé au build : le kit est versionné, le build ne dépend ni d'Inkscape ni de l'archive.

### 5.4 Planche de relecture

`/design-system/` reçoit une section « Kit isométrique » : grille des éléments de `kit.json` avec id,
titre, source et poids. Elle sert à valider le kit et le choix du §6.2.

## 6. Schéma « Quatre logiciels libres, un seul système » (`SystemDiagram.astro`)

### 6.1 Ce qui ne change pas

Repère (`W 1200 × H 680`, projection `P`), ancres `anchor`, flux (`getFlows`, courbures `BEND`, étiquettes),
boutons HTML posés au-dessus du SVG, panneau `aria-live`, avance automatique, `focus`, tons clair/sombre,
ordre de tabulation. Les ancres servent toujours au départ des flux.

### 6.2 Ce qui change

- Les `<g class="node">` (socle d'Aiffel, hangar, volumes de Lexicon et Lyvre, agriculteur) sont remplacés
  par un `<image>` par nœud : `href` = élément du kit (ou sa WebP, D37), placé pour que son point `foot`
  tombe sur la projection au sol de l'ancre, largeur fixée par nœud (`SIZE`).
- Un **plateau** iso commun (losange calculé par `iso.ts`, couleur du thème) passe sous les illustrations
  pour unifier la composition ; les flux sont dessinés au-dessus du plateau, sous les illustrations.
- États : nœud actif `filter: drop-shadow(...)` aux couleurs de la marque, autres nœuds `opacity: .6`
  pendant l'avance automatique ; `prefers-reduced-motion` coupe les transitions. Classes CSS uniquement
  (pas d'attribut `style`, CSP).
- Choix des éléments, **à valider sur la planche** :

| Nœud | Élément proposé (source probable) |
|---|---|
| Fourmy | hangar + tracteur (`Isometric-full.ai`) |
| Lyvre | maison en coupe avec le bureau (`Isometric-full.ai`) |
| Lexicon | satellite (`Isometric-full.ai`) ou silos |
| Aiffel | smartphone et micro (`Isometric-full.ai`) |
| Agriculteur | personnage à la tablette (`Isometric-full.ai`) |

- **Choix validés (C2, 2026-11-08)** : Fourmy → `hangar-photovoltaique` (WebP, 98 Ko gzip en SVG),
  Lyvre → `maison-bureau` (WebP, 88 Ko gzip), Lexicon → `satellite`, Aiffel → `micro-smartphone`,
  agriculteur → `agriculteur-tablette`.
- **WebP dérivées** : Astro refuse de rastériser un SVG sans `image.dangerouslyProcessSVG` ; plutôt que
  d'activer cette option, `extract.py` produit la WebP (960 px) à côté de chaque SVG (`kit.json` → `raster`).
- Le texte de `products.yaml` et les flux ne parlent plus d'Ekylibre (déjà fait au commit `011dae8` ; à revérifier).

## 7. Vérifications

| Exigence | Contrôle |
|---|---|
| FR-3D-1…7, FR-REC | Playwright accueil FR/EN : 7 chapitres, titres attendus ; absence de « Ekyviti », « Nordigen », « Samsys », « La vigne et le chai » dans le DOM (médaillons CSS2D compris) |
| FR-3D-2 | captures des vues `hub`, `champs`, `vigne`, `synthese` jointes à la PR |
| FR-CON | Playwright interop : le tableau ne contient que Fourmy et Lyvre ; chaque ligne a un état ; aucun nombre devant « connecteurs » sur le site (recherche dans `dist/`) |
| D33 | `check-content.mjs` échoue sur un `stable` sans `source` (test unitaire) |
| FR-KIT | `inventaire.md` liste 196 fichiers ; `kit.json` valide ; planche visible |
| FR-SYS, NFR-3 | Playwright : tabulation dans le schéma, panneau mis à jour ; axe sans erreur ; capture 360 px |
| NFR-2 | poids des ressources du schéma ≤ 150 Ko (rapport de build) |

## 8. Risques

| Risque | Parade |
|---|---|
| Un élément du kit garde des tracés d'un voisin (fond, ombre portée) | `exclude` dans `elements.yaml` ; contrôle sur la planche |
| Les éléments sont trop lourds en SVG | D37 (WebP dérivée), budget vérifié au build |
| L'angle isométrique du kit diffère de celui de `iso.ts` | Le plateau et les flux s'adaptent : réglage de `P` (projection) pour coller à l'angle du kit, relevé sur `Isometric-full` |
| Le candidat A pour la vigne tombe sur un bâtiment ou un chemin | procédure §3.1, captures soumises avant fusion |

## 9. Ordre conseillé (pour `/sc:workflow`)

1. Données des connecteurs (§4) — débloque scène, tableau, compteurs.
2. Scène et récit (§3).
3. Kit : conversion et inventaire (§5.1), puis curation et extraction des cinq éléments du schéma (§5.2–5.3).
4. Schéma du système (§6).
5. Développeurs, Entreprise, nettoyage `fetch-plugins` (§4.3), vérifications (§7).
