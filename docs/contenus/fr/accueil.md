---
page: Accueil
routeKey: home
title: "Ekylibre — le système d’information agricole interopérable"
description: "Ekylibre relie machines, capteurs, comptabilité, filières et données publiques : chaque donnée de la ferme saisie une seule fois. Logiciel libre."
---

<!--
Contenus FR, première passe (B10). Chiffres entre {accolades} = valeurs calculées au build
(src/data/generated/*.json) ; la valeur indiquée entre parenthèses est celle du 2026-11-03.
-->

## hero — Promesse et premier CTA (au-dessus de la ligne de flottaison)

- **Eyebrow** : Ekylibre SAS · éditeur et opérateur de communs numériques agricoles
- **H1** : Le système d’information agricole interopérable
- **Lead** : Machines, capteurs, banque, comptabilité, filières, données publiques : Ekylibre relie les outils de la ferme pour que chaque information ne soit saisie qu’une seule fois.
- **CTA principal** : Demander une démo
- **CTA secondaire** : Voir la ferme connectée
- **Texte alternatif du visuel** : Vue aérienne du FarmLab La Vauzelle au coucher du soleil : corps de ferme, hangars, parcelles maraîchères et grandes cultures.
- **Indication de défilement** (sous le hero, discrète) : Descendez pour suivre la donnée, du champ au bureau.

## stats — Bandeau de chiffres (StatBand, valeurs calculées au build)

| Valeur | Libellé (remplace le libellé actuel) |
|---|---|
| {totalRows} (623 M) | données agricoles françaises reliées dans le Lexicon |
| {datasets} (54) | jeux de données, issus de {providers} (33) producteurs |
| {stablePlugins} (10) | connecteurs stables vers les outils de la ferme |
| {firstCommit année} (2008) | première ligne de code d’Ekylibre · {commits} (23 192) commits depuis |

Variante courte du 4ᵉ libellé, si la place manque : « premier commit · {commits} commits depuis ».
Libellé optionnel (5ᵉ chiffre, page Entreprise surtout) : {contributors} (39) — contributeurs au code d’Ekylibre.

> Pourquoi le changement : « open source depuis, 23 192 contributions » mélange une date et un compte, et « contributions » n’est pas la mesure réelle (ce sont des commits). La date de passage en open source public n’est pas certaine (2008, 2011 ou 2014 selon les sources, voir `_notes.md`) : on s’en tient au premier commit, qui est vérifiable.

## chapitre-0 — Ouverture (vue `site`, ferme seule, lumière dorée)

- **Eyebrow** : FarmLab La Vauzelle
- **Titre** : Une vraie ferme, toutes ses données reliées
- **Texte** : Voici le FarmLab La Vauzelle, vu du ciel. Chaque outil de la ferme y dépose ses données au même endroit : Ekylibre, le système d’information de l’exploitation.

## chapitre-1 — Les champs parlent (vue `parcelles` : Samsys, CapTrap, Weenat, Previmeteo)

- **Eyebrow** : 1 · Les champs parlent
- **Titre** : Machines, météo et pièges, une seule saisie
- **Texte** : Les boîtiers Samsys enregistrent le travail des tracteurs, les stations Weenat et les objets Previmeteo relèvent la météo, les pièges CapTrap comptent les ravageurs. Tout arrive dans Ekylibre sous forme d’interventions et de relevés rattachés aux parcelles, sans ressaisie.

## chapitre-2 — Élevage et vigne (vue `elevage-vigne` : EDNotif, Ekyviti, Baqio)

- **Eyebrow** : 2 · Élevage et vigne
- **Titre** : Chaque filière, ses règles et ses référentiels
- **Texte** : Les données animales s’échangent avec l’EDE grâce à EDNotif. Pour la vigne, l’extension Ekyviti suit la parcelle, la vendange et le chai jusqu’à la bouteille, et Baqio y fait remonter les ventes et les expéditions de vin.

## chapitre-3 — Le bureau (vue `hub` : Banking, Planning, Hajimari ; tous les flux convergent)

- **Eyebrow** : 3 · Le bureau
- **Titre** : Saisi une fois, retrouvé partout
- **Texte** : Au bureau, tout converge : les relevés bancaires arrivent seuls pour le rapprochement (Nordigen, GoCardless), le planning compare le prévu et le réalisé, et l’assistant Hajimari reprend vos données existantes au démarrage. La comptabilité se nourrit de ce qui s’est passé au champ.

## chapitre-4 — Le ciel de données (vue `ciel` : constellation Lexicon)

- **Eyebrow** : 4 · Le ciel de données
- **Titre** : {totalRows} données publiques, reliées entre elles
- **Titre (valeur du 2026-11-03)** : 623 millions de données publiques, reliées
- **Texte** : Au-dessus de la ferme, le Lexicon : {datasets} (54) jeux de données de {providers} (33) producteurs, dont le cadastre, les parcelles PAC, les produits phytosanitaires autorisés et la météo. Ekylibre s’y réfère pour vérifier une dose, identifier une parcelle ou valoriser une récolte.
- **Libellé au survol d’une famille** (modèle) : {famille} · {n} jeux · {lignes} lignes

## chapitre-5 — La voix (vue `cour` : smartphone, Aiffel)

- **Eyebrow** : 5 · La voix
- **Titre** : Dites-le une fois. Aiffel le range au bon endroit.
- **Texte** : Depuis la cour, l’agriculteur dicte son traitement ou sa récolte. Aiffel reformule, vérifie dans le Lexicon et n’écrit dans Ekylibre qu’après votre validation, en citant ses sources.
- **Clin d’œil Duke** (infobulle facultative sur le hibou) : Duke, l’ancien assistant d’Ekylibre, a passé le relais à Aiffel.

## chapitre-6 — Synthèse (vue `site` dézoomée, tout allumé, compteurs)

- **Eyebrow** : 6 · Synthèse
- **Titre** : Une ferme ouverte sur tout son écosystème
- **Texte** : Des connecteurs vers les outils de la ferme, des données publiques reliées, un assistant qui écrit à votre place : tout est ouvert, documenté et réversible.
- **CTA 1** : Demander une démo
- **CTA 2** : Parler de votre projet
- **CTA 3** : Explorer l’interopérabilité

## produits — Bloc « 3 communs »

- **Eyebrow** : Nos logiciels
- **H2** : Trois communs, une même donnée
- **Lead** : Ekylibre SAS édite, opère et contribue en premier lieu à trois logiciels libres, portés avec l’association OSFarm.

### Carte Ekylibre
- **Titre** : Ekylibre
- **Sous-titre** : Gérer l’exploitation
- **Texte** : Le logiciel de gestion de l’exploitation : cultures, élevage, stocks, ventes et comptabilité, dans une même base. Développé depuis 2008, sous licence AGPL.
- **Lien** : Découvrir Ekylibre

### Carte Lexicon
- **Titre** : Lexicon
- **Sous-titre** : Les données de référence
- **Texte** : Le référentiel ouvert des données agricoles françaises : {totalRows} (623 M) de données reliées entre elles, accessibles par API, en CSV et par serveur MCP.
- **Lien** : Découvrir Lexicon

### Carte Aiffel
- **Titre** : Aiffel
- **Sous-titre** : Parler à ses logiciels
- **Texte** : L’assistant qui écoute l’agriculteur, à la voix ou par écrit, et range chaque information dans le bon logiciel, après validation.
- **Lien** : Découvrir Aiffel

## services — Teaser services

- **Eyebrow** : Services
- **H2** : Nos logiciels sont libres. Notre métier, c’est de vous accompagner.
- **Lead** : Ekylibre ne se vend pas par abonnement en ligne. Ekylibre SAS vend des services pour le mettre en place et le faire vivre chez vous.
- **Liste** :
  - Intégration
  - Formation
  - Transformation du système d’information
  - Développement de connecteurs
  - Support
- **CTA** : Voir nos services

## preuves — Bandeau de confiance (optionnel, sous le teaser services)

- **H2** : Des preuves plutôt que des promesses
- **Points** :
  - **Open source** : premier commit en septembre 2008, code sous licence AGPL sur GitHub.
  - **Données ouvertes** : {totalRows} (623 M) de données publiques reliées dans le Lexicon.
  - **Connecteurs** : {stablePlugins} (10) connecteurs publiés en version stable.
  - **Charte Data-Agri** : 1ʳᵉ entreprise labellisée par la FNSEA et Jeunes Agriculteurs, en mars 2019.

## cta-final — Appel à l’action de fin de page

- **H2** : Voyons ce que vos données peuvent faire ensemble
- **Texte** : Agriculteur, coopérative ou éditeur de logiciel : montrez-nous vos outils, nous vous montrons comment les relier.
- **CTA principal** : Demander une démo
- **CTA secondaire** : Parler de votre projet
