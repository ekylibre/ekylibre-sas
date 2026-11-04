# Inventaire des illustrations isométriques

Fichiers dans `src/assets/illustrations/`, extraits de la documentation utilisateur Ekylibre (`github.com/ekylibre/ekylibre.github.io`, dossier `content/fr/user-doc/images/`). Droits : illustrations réalisées par Ekylibre (voir `docs/design/02-architecture.md` §7.5).

Pour régénérer les fichiers :

```sh
git clone --depth 1 https://github.com/ekylibre/ekylibre.github.io .cache/ekylibre.github.io
node scripts/export-illustrations.mjs .cache/ekylibre.github.io
```

## À savoir avant d'utiliser ces fichiers

- **Aucune source vectorielle pour l'isométrie.** Le fichier `illustrations/EKY QS - Chapters - Illustration FINALE.ai` (PDF compatible, 1 plan de travail de 747 × 3470 pt) contient seulement les illustrations **à plat** (non isométriques) du guide de démarrage : bureau, équipe, tracteur, entrepôt, sponsors, chèques. Les scènes isométriques n'existent qu'en PNG. Le §7.5, qui prévoit d'extraire les scènes à partir du `.ai`, est donc à corriger.
- **Résolution faible.** Les bandeaux de la doc mesurent 1000 × 340 px et sont découpés en 3 panneaux d'environ 332 × 340 px. Les versions « carré » font 500 × 500 px. Les fichiers sont exportés **sans agrandissement**. Largeur d'affichage conseillée : au plus 330 px CSS pour un panneau, 500 px pour un carré (moitié de ces valeurs pour rester net sur un écran Retina). Ils ne conviennent pas à un bandeau pleine largeur.
- **Bandeaux de support très petits** (332 × 170 px). Ils conviennent comme vignettes de cartes, pas comme visuels principaux.
- Les scènes sont **opaques** (fond plein dans le cadre). Les médaillons sont **détourés** (fond transparent) et existent en deux versions : `.webp` (avec perte, q85, alpha intact) et `-lossless.webp`.
- Format : WebP qualité 85. Astro (`<Image>`/`<Picture>`) peut les réencoder en AVIF.
- **Style.** Le style des scènes ressemble à celui des banques d'images isométriques du commerce. Avant une mise en ligne commerciale, faire confirmer au propriétaire que l'accord sur les droits couvre bien ces PNG, et pas seulement le `.ai`.

## Scènes : registre agricole, sections claires

| Nom | Source (doc Ekylibre) | Format | Dimensions | Poids | Usage suggéré | Remarques |
|---|---|---|---|---|---|---|
| `bureau` | `accueil/introduction.png`, panneau 1/3 | WebP | 332×340 | 16 Ko | Services, Produits (gestion), Entreprise | Fond crème/ocre. Le hibou Duke est affiché à l'écran de l'ordinateur |
| `elevage` | `accueil/introduction.png`, panneau 2/3 | WebP | 331×340 | 19 Ko | Produits, Entreprise, carte « élevage » | Fond vert herbe. Pas de texte |
| `marche` | `accueil/introduction.png`, panneau 3/3 | WebP | 332×340 | 26 Ko | Vente directe, Services | Fond ocre (pavés). Bulle « € » (symbole seul) |
| `support-probleme` | `accueil/formation.png`, panneau 1/3 | WebP | 332×170 | 6 Ko | Services : diagnostic | Fond vert d'eau. Format paysage bas. Bulle « ? » ; le bras du personnage est coupé à gauche dans l'original |
| `support-accompagnement` | `accueil/formation.png`, panneau 2/3 | WebP | 331×170 | 7 Ko | Services : accompagnement | Fond turquoise. Duke sur le t-shirt, bulle en forme d'engrenage |
| `support-reussite` | `accueil/formation.png`, panneau 3/3 | WebP | 332×170 | 6 Ko | Services : autonomie | Fond ocre. Bulle smiley |
| `vendange` | `ekyviti/ekyviti-carre.png` | WebP | 500×500 | 50 Ko | Ekyviti / vigne | Fond vert et pavés. Pas de texte. Meilleure qualité du lot |
| `vinification` | `ekyviti/ekyviti.png`, panneau 2/3 | WebP | 331×340 | 17 Ko | Ekyviti (cuverie, laboratoire) | Fond beige |
| `chai` | `ekyviti/ekyviti.png`, panneau 3/3 | WebP | 332×340 | 20 Ko | Ekyviti (chai, alambic, embouteillage) | Fond brique, scène sombre |
| `marche-producteurs` | `chapitre7/ventes-carre.png` | WebP | 500×500 | 44 Ko | Vente directe, circuits courts | Fond vert et pavés |
| `hangar-stockage` | `chapitre8/stocks-carre.png` | WebP | 500×500 | 28 Ko | Stocks, traçabilité | Fond vert |
| `metiers-agricoles` | `chapitre1/contacts.png` | WebP | 500×500 | 33 Ko | Entreprise, « pour qui » | Fond gris uni : groupe de personnages (éleveur, vigneron, vétérinaire, apiculteur…) |
| `materiel-agricole` | `chapitre8/stocks.png`, panneau 3/3 | WebP | 332×340 | 24 Ko | Équipements, connecteurs machines | Fond terre |
| `moisson` | `chapitre9/production-carre.png` | WebP | 500×500 | 47 Ko | Interventions, production | Fond blé/terre. Chronomètre et drone |
| `fenaison` | `chapitre9/production.png`, panneau 3/3 | WebP | 332×340 | 13 Ko | Interventions, météo | Bandeau bleu (ciel) en haut avec une station météo, puis champ de paille |
| `plan-exploitation` | `chapitre3/exploitation-carre.png` | WebP | 500×500 | 33 Ko | Parcellaire, mise en route | Fond vert. Mains qui dessinent une parcelle |
| `chantier-batiment` | `chapitre3/exploitation.png`, panneau 2/3 | WebP | 331×340 | 27 Ko | Mise en place, déploiement | Scène chargée (ouvriers, silos) |
| `tracabilite-registres` | `chapitre1/tracabilite.png` | WebP | 500×500 | 42 Ko | Traçabilité, registres | **Texte incrusté** : étiquettes « PDF » (lisibles en FR et en EN) |
| `bureau-comptable` | `chapitre5/comptabilite-carre.png` | WebP | 500×500 | 40 Ko | Comptabilité, partenaires experts-comptables | Fond brun et parquet |
| `cabinet-comptable` | `chapitre5/comptabilite.png`, panneau 2/3 | WebP | 331×340 | 21 Ko | Comptabilité, réseau de partenaires | Symboles « % », « € », « ¥ » en motif de fond |
| `pilotage-performance` | `performance/performance-carre.png` | WebP | 500×500 | 25 Ko | Pilotage, rentabilité | Fond vert. Billets de 500 € (chiffres incrustés) et boussole |
| `poste-developpeur` | `chapitre10/outils-carre.png` | WebP | 500×500 | 26 Ko | Développeurs, API, interopérabilité | **Texte incrusté** : étiquettes « XML », « PDF », « ODS » ; Duke en vol |
| `cloud-securite` | `chapitre4/interface.png`, panneau 3/3 | WebP | 332×340 | 17 Ko | Hébergement, sécurité, données | Fond vert d'eau. Nuage, bouclier, cadenas |
| `salle-serveurs` | `chapitre1/introduction.png`, panneau 3/3 | WebP | 332×340 | 14 Ko | Hébergement, infogérance | Fond gris et carrelage bleu. Badge « 1 » sur une enveloppe |

## Médaillons : schéma de flux et Ekyviti

Les médaillons sont détourés en cercle. L'anneau vert est redessiné et les zones qui chevauchent un médaillon voisin sont repeintes dans la couleur du fond : il ne reste ni bout de flèche ni morceau d'anneau voisin. Aucun libellé n'est inclus : le site pose ses propres textes en HTML. Fond du médaillon `#F2F2F1` à `#F4F4F3`, anneau vert. Chaque médaillon existe en `.webp` (avec perte, environ 3 à 8 Ko) et en `-lossless.webp` (environ 7 à 21 Ko).

| Nom | Source | Dimensions | Poids `.webp` | Libellé d'origine / usage |
|---|---|---|---|---|
| `medaillon-agriculteur` | `accueil/schema-flux.png` | 104×104 | 3 Ko | Gestion des tiers, RH, équipiers |
| `medaillon-hangar` | idem | 104×104 | 3 Ko | Zones de stockage |
| `medaillon-tracteur` | idem | 104×104 | 4 Ko | Équipements |
| `medaillon-recolte-echantillon` | idem | 104×104 | 4 Ko | Cultures (épis et ciseaux) |
| `medaillon-cultures` | idem | 104×104 | 4 Ko | Activités |
| `medaillon-paiement` | idem | 104×104 | 4 Ko | Facturation et décaissements |
| `medaillon-achats` | idem | 104×104 | 4 Ko | Achats |
| `medaillon-chariot-elevateur` | idem | 104×104 | 4 Ko | Réceptions |
| `medaillon-intrants` | idem | 104×104 | 3 Ko | Stocks d'intrants |
| `medaillon-intervention` | idem | 104×104 | 4 Ko | Interventions |
| `medaillon-silo` | idem | 104×104 | 4 Ko | Stocks des productions |
| `medaillon-comptabilite` | idem | 104×104 | 4 Ko | Comptabilité et trésorerie |
| `medaillon-registre` | idem | 104×104 | 4 Ko | Édition des registres |
| `medaillon-encaissement` | idem | 104×104 | 4 Ko | Facturation et encaissements |
| `medaillon-livraison` | idem | 104×104 | 4 Ko | Livraisons |
| `medaillon-expedition` | idem | 104×104 | 4 Ko | Expéditions |
| `medaillon-vente` | idem | 104×104 | 3 Ko | Ventes (la main dépasse de l'anneau dans l'original et est coupée ici) |
| `medaillon-raisin` | `ekyviti/illus-vendange.png` | 178×178 | 7 Ko | Vigne, raisin |
| `medaillon-machine-vendanger` | idem | 178×178 | 8 Ko | Machine à vendanger |
| `medaillon-benne-vendange` | idem | 178×178 | 7 Ko | Benne à vendange |
| `medaillon-pressoir` | idem | 178×178 | 7 Ko | Pressoir |
| `medaillon-cuve-vin` | idem | 178×178 | 5 Ko | Cuve inox |
| `medaillon-calendrier-chrono` | idem | 178×178 | 8 Ko | Planification (mot « January » à peine lisible sur le calendrier) |

Les médaillons de `accueil/schema-flux.png` ne font que 104 px : à afficher en 52 px CSS (Retina) à 104 px au plus. Le doublon « Gestion des équipiers » (même agriculteur) n'est pas exporté.

## Non exporté (disponible dans la doc si besoin)

- Les 12 bandes `*/illus-*.png` (1000×175 px, 6 médaillons chacune, environ 170 px) : météo, fromages, phytosanitaires, salariés, matériel, élevage, logos eky (ces derniers à ne pas reprendre). Le script s'étend facilement : ajouter une entrée dans `MEDALLIONS`.
- Variantes du bureau avec surimpression (`commun/ekylibre.png`, `chapitre7/ventes.png` panneau 1, `chapitre5/comptabilite.png` panneau 1), scènes avec texte (`chapitre2/parcellaire` « telepac », `notes-version` « 2023/2024 ») et scènes « interface numérique » sur fond violet ou nuit (`chapitre4`, `chapitre10`, `videos`, `achats-carre`), qui ne relèvent pas du registre agricole.
- Les illustrations à plat du `.ai` (style différent, non isométrique).

## Logos des logiciels (`src/assets/brand/products/`, copiés le 2026-11-04)

Fichiers officiels, non recolorés ni redessinés ; affichés en `<img>` sur une pastille claire
(`ProductLogo.astro`). Référencés par `src/data/products.yaml`.

| Fichier | Source | Ayant droit | Traitement |
|---|---|---|---|
| `ekylibre.svg` | `src/assets/brand/ekylibre-logo.svg` (identique aux logos des anciens sites : monochrome, aucune version couleur officielle trouvée dans `ekylibre-old`) | Ekylibre SAS | aucun |
| `lexicon.svg` | `lexicon-rest-api/public/images/lexicon-logo.svg` | OSFarm | svgo (tracés et couleurs inchangés, 50 → 41 ko) |
| `aiffel.svg` | `https://aiffel.org/favicon.svg` | Ekylibre SAS | aucun |
| `lyvre.svg` | `compta-asso/frontend/src/assets/lyvre-symbole.svg` (symbole ; le nom est écrit en texte) | Ekylibre SAS | aucun |
