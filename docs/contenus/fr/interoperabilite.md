---
page: Interopérabilité
routeKey: interop
title: "Interopérabilité — la ferme connectée à son écosystème | Ekylibre"
description: "Connecteurs, données publiques ouvertes, API et formats libres : comment Ekylibre relie les outils de la ferme et garde vos données réversibles."
---

## intro — Bandeau d’ouverture (au-dessus de la scène 3D explorable)

- **Eyebrow** : Interopérabilité
- **H1** : La ferme connectée à tout son écosystème
- **Lead** : Une exploitation utilise des dizaines d’outils : machines, capteurs, banque, déclarations, logiciels de filière. Ekylibre les fait parler entre eux, pour que la même information ne soit jamais saisie deux fois.
- **Consigne de la scène** : Faites tourner la ferme, survolez un médaillon, cliquez pour ouvrir la fiche du connecteur. Tout ce que montre la scène figure aussi dans les tableaux plus bas.
- **Filtres** : Tout · Connecteurs · Données publiques · Dialogue
- **Lien d’évitement** : Passer la scène 3D et aller aux tableaux

## comment — Comment ça marche : trois couches

- **H2** : Trois couches, une seule donnée
- **Lead** : L’interopérabilité d’Ekylibre repose sur trois mécanismes complémentaires.

### 1. Les connecteurs
- **Titre** : Les connecteurs relient vos outils
- **Texte** : Chaque connecteur est une extension d’Ekylibre, publiée en logiciel libre. Il récupère les données d’un outil (boîtier de tracteur, station météo, banque, logiciel de vente) et les transforme en interventions, relevés ou écritures dans Ekylibre. Certains fonctionnent dans les deux sens.

### 2. Les données ouvertes
- **Titre** : Les données publiques servent de référence
- **Texte** : Le Lexicon rassemble les grands référentiels agricoles français : cadastre, parcelles PAC, produits phytosanitaires, météo, entreprises. Ils sont reliés par des clés communes, si bien qu’un numéro de parcelle mène à la commune, au sol et aux cultures déclarées.

### 3. Le dialogue
- **Titre** : Le dialogue remplace la saisie
- **Texte** : Avec Aiffel, l’agriculteur dit ce qu’il a fait, à la voix ou par écrit. L’assistant prépare l’enregistrement, le vérifie dans le Lexicon et l’écrit dans Ekylibre après validation.

## concretement — Ce que « interopérable » veut dire, concrètement

- **H2** : Interopérable, concrètement
- **Lead** : Le mot est souvent employé. Voici ce qu’il recouvre chez nous, point par point.
- **Points** :
  - **Des API documentées.** Ekylibre expose une API REST (version 2) décrite au format OpenAPI. Le Lexicon répond en JSON et en CSV, et par un serveur MCP pour les assistants d’IA.
  - **Des formats ouverts.** Les données entrent et sortent en JSON, CSV ou GeoJSON [À CONFIRMER : liste exacte des formats d’export d’Ekylibre (CSV, ODS, GeoJSON, FEC…)], jamais dans un format fermé.
  - **Des référentiels partagés.** Ekylibre s’appuie sur les nomenclatures Onoma et Lexicon : un produit, une variété ou une unité porte le même identifiant partout.
  - **La réversibilité.** Le code d’Ekylibre est libre (licence AGPL) et sa base de données est PostgreSQL. Vous pouvez récupérer vos données, ou faire tourner le logiciel ailleurs, à tout moment.
  - **Vos données vous appartiennent.** Chaque exploitation dispose de son propre espace de données, séparé des autres (architecture multi-tenant). Nous n’utilisons pas vos données à d’autres fins que le service rendu [À CONFIRMER : formulation alignée sur les CGU].
  - **Un engagement contrôlé.** Ekylibre a été la première entreprise labellisée Data-Agri par la FNSEA et Jeunes Agriculteurs, en mars 2019 : un audit de nos contrats au regard de la charte de protection des données agricoles. [À CONFIRMER : label toujours en cours de validité ?]

## connecteurs — Introduction du tableau des connecteurs (ConnectorGrid)

- **Eyebrow** : Connecteurs
- **H2** : Des connecteurs en logiciel libre, stables ou en cours
- **Lead** : Les connecteurs de Fourmy et de Lyvre. Un connecteur stable est publié dans le dépôt de son logiciel ; les autres sont en cours de développement.
- **Source** : `src/data/connectors.yaml` (état éditorial `stable` / `en-cours`, docs/design/04 §4)
- **En-têtes du tableau** : Intégration · Fonction · Logiciel · Partenaire · Sens des données · État · Code
- **Libellés du sens des données** : Vers le logiciel · Depuis le logiciel · Dans les deux sens
- **Note sous le tableau** : Il manque l’outil que vous utilisez ? Un connecteur se développe en quelques étapes, et nous pouvons le faire avec vous. → Développement de connecteurs

## jeux-de-donnees — Introduction du tableau des jeux Lexicon (DatasetTable)

- **Eyebrow** : Données publiques
- **H2** : {datasets} (54) jeux de données, {totalRows} (623 M) de lignes
- **Lead** : Le Lexicon reprend les données publiques de {providers} (33) producteurs (INSEE, IGN, ANSES, Météo-France, Agence Bio, ASP…) et les relie entre elles. Chaque jeu garde la licence de sa source.
- **Filtres de famille** : Territoire et foncier · Climat · Intrants et réglementation · Entreprises et aides · Marchés et économie · Savoirs agronomiques · Filières et alimentation
- **En-têtes du tableau** : Jeu de données · Famille · Producteur · Lignes · Licence · Accès · Date de la source
- **Libellés d’accès** : Ouvert · Adhérents OSFarm
- **Note sous le tableau** : {open} (46) jeux sont ouverts à tous ; {members} (8) sont réservés aux adhérents de l’association OSFarm, qui obtiennent une clé d’accès. Ekylibre SAS produit {byEkylibre} (16) de ces jeux, notamment les itinéraires techniques, les modèles d’interventions et le plan comptable agricole.
- **Lien** : Explorer le Lexicon

## cta — Pour les éditeurs de logiciels et les coopératives

- **H2** : Éditeur, coopérative, organisme agricole : branchez-vous
- **Texte** : Vous développez un outil agricole ou vous consolidez les données de vos adhérents ? Nous construisons les connecteurs, les flux et les reprises de données dont vous avez besoin, en logiciel libre.
- **Points** :
  - Connecter votre logiciel ou votre matériel à Ekylibre
  - Alimenter vos outils avec les référentiels du Lexicon
  - Rendre vos données accessibles à Aiffel par API ou MCP
- **CTA principal** : Parler de votre projet
- **CTA secondaire** : Documentation développeurs
