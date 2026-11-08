---
page: Notes de rédaction (non publié)
routeKey: null
title: "Contenus FR — questions ouvertes et faits à confirmer"
description: "Notes internes de la première passe de rédaction (B10)."
---

## conventions — Conventions de ces fichiers

- `{clé}` = valeur calculée au build (`src/data/generated/*.json`) ; la valeur du 2026-11-03 est donnée entre parenthèses. Clés utilisées : `totalRows` (623 191 518), `datasets` (54), `providers` (33), `byEkylibre` (16), `open` (46), `members` (8), `stablePlugins` (10, supprimée en novembre 2026 : plus de compteur de connecteurs, docs/design/04 D35), `commits` (23 192), `contributors` (39), `firstCommit` (2008-09-08).
- `open` et `members` n’existent pas encore dans `datasets.json` : à calculer depuis `scope` (open / members).
- `[À CONFIRMER : …]` = fait manquant ; ne pas publier tant que le crochet est présent.
- Typographie : espaces insécables avant « : » (U+00A0), fines insécables avant « ; ! ? » (U+202F), guillemets « », apostrophe ’. Les blocs de code n’ont pas été modifiés.

## a-confirmer — Faits à confirmer (par page)

### Accueil
- Aucun crochet dans la page : tous les chiffres sont calculés.

### Interopérabilité
- Liste exacte des formats d’export d’Ekylibre (CSV, ODS, GeoJSON, FEC…).
- Phrase sur l’usage des données : à aligner sur les CGU (`/terms-of-use`).
- Label Data-Agri : toujours en vigueur ? date de renouvellement ?

### Ekylibre
- Modalités d’hébergement des instances opérées par Ekylibre SAS (prestataire, localisation France ou UE).
- Sort de Clic&Farm (utilisateurs, fonctions reprises ?) et formulation à adopter.
- Liste des fonctionnalités (élevage, stocks, ventes…) : rédigée à partir d’ekylibre.org et des anciens articles ; à relire par l’équipe produit.

### Lexicon
- Formulation du rôle d’Ekylibre SAS : lexicon.osfarm.org dit « construit et maintenu par l’association OSFarm ». Le brief dit « éditeur, contributeur principal et opérateur ». J’ai écrit « contributeur principal, participe au développement et à l’exploitation, produit 16 jeux ». À valider avec OSFarm.

### Aiffel
- Rôle exact d’Ekylibre SAS : aiffel.org ne nomme aucune entité (« Un commun numérique pour l’agriculture »).

### Services
- Formation : certification Qualiopi ? prise en charge VIVEA / OPCO ?
- Connecteurs : maintenance incluse ou contrat séparé ?
- Support : canaux et niveaux de service.
- Formulaire projet : délai de réponse annoncé.

### Développeurs
- URL de base de production de l’API Ekylibre à montrer (la spec OpenAPI indique `https://{tenant}.ekylibre.com/api/v2`) ; exemple `curl` à tester avant publication.

### Entreprise
- Date de création d’Ekylibre SAS (et source : Kbis).
- Année de publication du code sur GitHub sous AGPL (2011 selon le brief).
- Date du cofinancement FEDER / Région Aquitaine (~2016).
- Date de la nouvelle identité Ekyagri / Ekyviti (l’article importé porte la date 2020-11-03, identique à un autre article : probable date d’import, pas de publication).
- Date et nature du rapprochement avec Clic&Farm.
- Dates de lancement publiques du Lexicon et d’Aiffel.
- Label Data-Agri toujours en vigueur.
- Nombre d’exploitations, nombre d’hectares, date de la mesure (D18).

### Contact
- Durée de la démo et délai de prise de contact.
- Adresse électronique générale, adresse RGPD, adresse du siège.
- Durée de conservation des données des formulaires.

## divergences — Écarts relevés entre les sources

1. **Jeux produits par Ekylibre SAS** : le brainstorm dit 17, `datasets.json` en compte **16** (provider = « Ekylibre SAS »). J’ai utilisé la valeur calculée.
2. **Producteurs du Lexicon** : 33 selon `datasets.json`, « environ 30 » dans le brainstorm. Certains producteurs sont des variantes d’un même organisme (plusieurs libellés du ministère de l’Agriculture, « INSEE » et « INSEE / Agreste-SSP », « OSFarm », « Ekylibre SAS »). Le libellé « producteurs » reste exact, mais le chiffre réel d’organismes distincts est plus bas.
3. **« Open source depuis »** : premier commit en 2008, organisation GitHub en 2011 (brainstorm), copyright d’ekylibre.org « 2014-2026 », objectif O1 « open source depuis 2014 ». Le code était-il public dès 2008 ? Dans le doute, j’écris « développé depuis 2008 » / « premier commit en 2008 », jamais « open source depuis 2008 ». Attention : La carte produit actuelle de `HomePage.astro` dit « Open source depuis 2008 » : à corriger si 2008 n’est pas la date de publication.
4. **Licence du Lexicon** : le pied de page de lexicon.osfarm.org dit MIT ; la spec OpenAPI de l’API Lexicon déclare « Apache 2.0 ». J’ai écrit MIT (code). À harmoniser côté Lexicon.
5. **Licences des plugins** : hétérogènes dans `plugins.json` (AGPL-3.0 pour Baqio, Hajimari ; MIT pour Planning ; non déclarée pour Banking, CapTrap, EDNotif, Previmeteo, Samsys…). J’ai écrit « licence indiquée dans chaque dépôt ». Recommandation : ajouter un fichier LICENSE aux dépôts qui n’en ont pas, sinon ils ne sont pas juridiquement « libres ».
6. **Ekylibre.org** affiche « the leading open-source farming information system » / « open source de référence ». Je ne l’ai pas repris (consigne : pas de superlatif non prouvé).
7. **Aiffel** : en construction (phase 1), offre Libre « en test », offre en ligne « en préparation ». J’ai écrit « en cours de lancement » et renvoyé vers aiffel.org pour les offres.

## evites — Affirmations volontairement évitées

- « Leader », « n°1 », « de référence » : remplacés par les preuves (connecteurs, données, 2008, Data-Agri).
- Le chiffre « plus de 5 000 agriculteurs » (ancien site, 2020) et les « 16 080 heures économisées » : anciens, non vérifiés, non repris.
- « Plus de 20 millions de références » (ekylibre.org, Onoma + Lexicon) : chiffre ancien, incohérent avec les 623 M du Lexicon ; non repris.
- Prix d’Aiffel (1,99 € HT/mois…) : affichés sur aiffel.org, mais pas repris ici (pas de tarif sur ekylibre.com, D2) ; à décider.
- Logiciels « prévus » pour Aiffel (Geofolia, Smag Farmer, MesParcelles, Isacompta, Lyvre…) : marques de tiers, intégrations non faites ; remplacés par « d’autres logiciels du marché sont prévus ».
- Aucun client, témoignage, partenaire commercial, prix de service, effectif ni certification (Qualiopi, ISO, HDS) n’a été cité.
- « Hébergé en France » : non affirmé (inconnu).
- Data-Agri : présenté comme un fait daté (mars 2019), pas comme un label actuel tant que sa validité n’est pas confirmée.
- Clic&Farm : pas d’affirmation « rachat » ou « fusion ».
- Les « 2 fondateurs » (article Data-Agri) : non repris, faute de noms et de dates (pas de trombinoscope, D18).

## suggestions — Pistes pour la suite

- Exposer `open` et `members` (calculés depuis `scope`) dans les données générées, à côté de `byEkylibre`.
- Page Entreprise : un chiffre « exploitations » daté vaut mieux qu’un chiffre arrondi sans date.
- Chapitre 5 : l’exemple vocal d’Aiffel doit rester fictif et sans nom de produit commercial.
- Version EN : partir de ces fichiers une fois les crochets levés.
