# ekylibre.com

Site de la société **Ekylibre SAS** : éditeur, contributeur principal et opérateur de [Fourmy](https://fourmy.org) (nouvelle génération d'[Ekylibre](https://ekylibre.org)), [Lexicon](https://lexicon.osfarm.org), [Aiffel](https://aiffel.org) et Lyvre.

Site statique [Astro](https://astro.build) publié sur GitHub Pages, en français (racine) et en anglais (`/en/`).

## Démarrer

Node **22.23.4 ou plus** (exigé par Astro 7) et npm.

```bash
npm ci
npm run dev          # http://localhost:4321
npm run build        # vérification des types + build dans dist/
npm run preview
```

## Données générées

Les chiffres et listes du site viennent de sources vivantes, interrogées à chaque build en CI
(et chaque lundi par le cron du workflow) :

| Script | Source | Sortie |
| --- | --- | --- |
| `scripts/fetch-github.mjs` | API GitHub, dépôt `ekylibre/ekylibre` | `src/data/generated/stats.json` |
| `scripts/fetch-lexicon.mjs` | `https://lexicon.osfarm.org/catalog.json` | `src/data/generated/datasets.json` |

`npm run fetch:data` les relance en local (jeton GitHub lu dans `GITHUB_TOKEN` ou `gh auth token`).
En cas d'échec, l'instantané commité est conservé et le build continue.

## Connecteurs

`src/data/connectors.yaml` est la seule source des connecteurs affichés (scène 3D, tableau de la page
Interopérabilité, repli 2D, page Développeurs) : intégrations de **Fourmy** et de **Lyvre**, avec un état
éditorial `stable` ou `en-cours`. `check-content` vérifie qu'un connecteur stable indique sa `source` (chemin
dans le dépôt du logiciel), qu'une intégration Fourmy vise une zone de `public/3d/scene.json` et que les
textes ont exactement `fr` et `en` (`scripts/lib/connectors.mjs`, tests dans `tests/unit/`). L'ordre du
fichier fixe l'ordre des partenaires sur les médaillons. Plus aucun compteur de connecteurs sur le site.

## Kit isométrique

Illustrations maison (archive Graphisme d'Ekylibre SAS) découpées pour le schéma « Quatre logiciels libres,
un seul système » ; planche de relecture sur `/design-system/#kit`. Deux étapes, hors build (Inkscape snap,
chemins absolus, sorties hors dépôt dans `~/Documents/archive_ekylibre/kit-isometrique/`) :

```bash
node scripts/kit/convert.mjs              # .ai/.svg → SVG, aperçus, boîtes ; reprise possible
node scripts/kit/convert.mjs --inventory  # docs/kit-isometrique/inventaire.md
python3 -I scripts/kit/extract.py [id…]   # découpe selon docs/kit-isometrique/elements.yaml
```

`extract.py` écrit `src/assets/kit/<catégorie>/<id>.svg`, une WebP dérivée (960 px) et `kit.json`.
Au-delà de 40 Ko gzip, le schéma sert la WebP (Astro ne rastérise pas les SVG sans option dangereuse).

## Pictogrammes

Glyphes de la police [agric](https://github.com/ekylibre/agric) (MIT), copiés dans `vendor/agric/glyphs/`.
`npm run icons` reconstruit le sprite `public/icons/agric.svg`. Composant : `<Icon name="tractor" />`.

## Design system

Jetons dans `src/styles/global.css` (`@theme`), page de référence non indexée : `/design-system/`.
`node scripts/check-contrast.mjs` vérifie les contrastes WCAG (exécuté en CI).

## Déploiement

`.github/workflows/deploy.yml` : build et publication sur GitHub Pages à chaque push sur `main`.
L'URL et la base de déploiement viennent de `actions/configure-pages` : le même build sert la recette
(`ekylibre.github.io/ekylibre-sas/`, non indexée) puis la production (`ekylibre.com`) après la bascule DNS.

## Documentation du projet

- Exigences : `docs/brainstorm/01-exigences-site-ekylibre.md`
- Conception : `docs/design/02-architecture.md`
- Plan d'exécution : `claudedocs/workflow_site_ekylibre.md`
- Logiciels, schéma du système, Lyvre : `docs/brainstorm/03-outils-oskale-lyvre.md`, `docs/design/03-outils-lyvre.md`,
  `claudedocs/workflow_outils_lyvre.md`
- Accueil Fourmy, kit isométrique, connecteurs Fourmy et Lyvre (novembre 2026) :
  `docs/brainstorm/04-accueil-kit-isometrique-connecteurs.md`, `docs/design/04-accueil-kit-connecteurs.md`,
  `claudedocs/workflow_accueil_kit_connecteurs.md`
