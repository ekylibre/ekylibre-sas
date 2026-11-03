---
page: Développeurs
routeKey: developers
title: "Développeurs — API, MCP, plugins et licences | Ekylibre"
description: "API REST v2 d’Ekylibre, API JSON/CSV et serveur MCP du Lexicon, plugins Rails, licences AGPL et MIT : tout pour connecter votre outil à Ekylibre."
---

## hero — En-tête de la page

- **Eyebrow** : Développeurs
- **H1** : Ouvert par conception
- **Lead** : Code public, API documentées, référentiels ouverts et serveur MCP : tout ce qu’il faut pour connecter votre outil à Ekylibre, au Lexicon et à Aiffel.
- **CTA principal** : Voir les dépôts GitHub → https://github.com/ekylibre
- **CTA secondaire** : Rejoindre le Discord → https://discord.gg/BSpD6hq7qR

## api-ekylibre — API REST v2 d’Ekylibre

- **H2** : L’API d’Ekylibre
- **Texte** : Ekylibre expose une API REST en JSON (version 2), décrite au format OpenAPI. Chaque exploitation est un espace de données séparé (un *tenant*), désigné par le sous-domaine ou par l’en-tête `X-Tenant`. On s’authentifie avec un jeton lié à l’utilisateur, obtenu par `POST /tokens`.
- **Ressources disponibles** (extrait) : parcelles (`cultivable_zones`), produits (animaux, matériel, végétaux), variantes du catalogue, interventions, productions, totaux d’intrants, profil et comptabilité de l’exploitation par campagne, produits phytosanitaires homologués.
- **Exemple** :

```bash
curl https://votre-exploitation.ekylibre.com/api/v2/cultivable_zones \
  -H "Authorization: simple-token vous@exemple.fr VOTRE_JETON"
```

> [À CONFIRMER : URL de base de production à montrer (la spec indique `https://{tenant}.ekylibre.com/api/v2`) ; exemple à tester avant publication, ou à remplacer par l’URL de la démo.]

- **Lien** : Documentation de l’API → https://ekylibre.org/api

## api-lexicon — API du Lexicon

- **H2** : Le Lexicon en JSON, en CSV ou en SQL
- **Texte** : Chaque page du Lexicon existe aussi en JSON et en CSV : ajoutez `.json` ou `.csv` à son adresse. L’essentiel des données est ouvert, sans clé. Les jeux réservés aux adhérents d’OSFarm demandent une clé d’API, transmise dans l’en-tête `Authorization: Bearer` ou `X-API-Key`. Les données sont lisibles depuis d’autres sites (CORS ouvert).
- **Exemple** :

```bash
curl https://lexicon.osfarm.org/phytosanitary/products.json
```

- **Paquets PostgreSQL** : chaque jeu de données est un paquet versionné, à charger dans votre propre base. Versions, licences et dates de source sont listées dans le catalogue.
- **Liens** : Documentation de l’API → https://lexicon.osfarm.org/documentation · Catalogue → https://lexicon.osfarm.org/catalog.json

## mcp — Serveur MCP du Lexicon

- **H2** : Branchez un assistant d’IA sur {totalRows} (623 M) de données
- **Texte** : Le Lexicon expose un serveur MCP (Model Context Protocol). Un assistant d’IA compatible peut y chercher et croiser les jeux de données, avec leurs sources. Ajoutez cette configuration à votre client MCP :

```json
{"type":"http","url":"https://lexicon.osfarm.org/mcp"}
```

- **Note** : déclarez ce serveur sous le nom de votre choix (par exemple `lexicon`) dans la configuration de votre client MCP ; l’emplacement du fichier dépend du client utilisé.

## plugins — Architecture des plugins

- **H2** : Un connecteur, c’est un plugin
- **Lead** : Les connecteurs d’Ekylibre sont des extensions indépendantes : des moteurs Rails (*Rails engines*) packagés en gem Ruby, chacun dans son dépôt `ekylibre-<nom>`.
- **Points** :
  - **Un dépôt, une gem** : le plugin déclare un `Rails::Engine` et s’ajoute au `Gemfile` d’Ekylibre.
  - **Une intégration** : il décrit la connexion au service tiers (identifiants, vérification) et les synchronisations à lancer, par exemple chaque jour.
  - **Des tâches de fond** : les données sont récupérées par des jobs, puis transformées en objets Ekylibre (interventions, relevés, écritures).
  - **Des points d’extension dans l’interface** : le plugin ajoute ses vues, ses traductions et ses boutons aux écrans existants.
  - **Une version publiée** : dès qu’un tag est publié sur GitHub, le connecteur apparaît sur ce site.

## construire — Construire un connecteur, étape par étape

- **H2** : Construire votre connecteur
- **Étapes** :
  1. Partez d’un plugin existant proche de votre cas (Samsys pour des machines, Weenat pour des capteurs, Baqio pour un logiciel de vente).
  2. Décrivez l’intégration : authentification auprès de votre service et test de connexion.
  3. Écrivez la récupération des données dans un job, et leur correspondance avec les modèles d’Ekylibre, en vous appuyant sur les nomenclatures Onoma et Lexicon.
  4. Ajoutez des tests, la documentation et les traductions (au moins français et anglais).
  5. Publiez une première version (tag), puis annoncez-la sur le Discord.
- **Encadré** : Vous préférez qu’on le fasse pour vous ? → Développement de connecteurs (page Services)
- **Lien** : Documentation technique → https://ekylibre.org/techdoc/

## licences — Licences

- **H2** : Les licences
- **Tableau** :

| Élément | Licence |
|---|---|
| Ekylibre (cœur) | GNU AGPL v3 |
| Plugins et connecteurs | Indiquée dans chaque dépôt |
| Lexicon (code) | MIT |
| Données du Lexicon | Licence de la source, précisée pour chaque jeu (par ex. Licence Ouverte 2.0) |
| Documentation d’Ekylibre | CC BY 4.0 |

- **Texte** : L’AGPL garantit que le code d’Ekylibre reste libre, y compris quand il est proposé en service en ligne : toute version modifiée mise à disposition des utilisateurs doit publier son code.

## contribuer — Contribuer

- **H2** : Contribuer
- **Texte** : Ekylibre est développé en public depuis septembre 2008 : {commits} (23 192) commits et {contributors} (39) contributeurs à ce jour. Signalez un bogue, proposez une amélioration ou une nouvelle donnée : toutes les contributions sont bienvenues.
- **Liens** :
  - Ekylibre et ses plugins → https://github.com/ekylibre
  - Lexicon → https://github.com/osfarm/lexicon
  - Proposer un jeu de données au Lexicon → https://lexicon.osfarm.org/contribute
  - Discuter avec la communauté (Discord) → https://discord.gg/BSpD6hq7qR
  - Démo en ligne → https://demo.ekylibre-dev.com
