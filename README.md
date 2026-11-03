# ekylibre.com

Site de la société **Ekylibre SAS** : éditeur, contributeur principal et opérateur d'[Ekylibre](https://ekylibre.org), [Lexicon](https://lexicon.osfarm.org) et [Aiffel](https://aiffel.org).

Site statique [Astro](https://astro.build) publié sur GitHub Pages, en français (racine) et en anglais (`/en/`).

## Démarrer

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
| `scripts/fetch-plugins.mjs` | API GitHub, organisation `ekylibre` | `src/data/generated/plugins.json`, `stats.json` |
| `scripts/fetch-lexicon.mjs` | `https://lexicon.osfarm.org/catalog.json` | `src/data/generated/datasets.json` |

`npm run fetch:data` les relance en local (jeton GitHub lu dans `GITHUB_TOKEN` ou `gh auth token`).
En cas d'échec, l'instantané commité est conservé et le build continue.

**Plugin « stable »** : dépôt `ekylibre-*`, non archivé, actif depuis 2023 et avec au moins un tag publié.
Publier un tag sur un plugin suffit à le faire apparaître sur le site au build suivant.

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
