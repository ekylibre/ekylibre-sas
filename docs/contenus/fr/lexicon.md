---
page: Lexicon
routeKey: lexicon
title: "Lexicon — 623 M de données agricoles françaises reliées | Ekylibre"
description: "Lexicon, le référentiel ouvert des données agricoles françaises : 54 jeux, 623 M de données reliées, API JSON/CSV, paquets PostgreSQL et serveur MCP."
---

## hero — En-tête de la page produit

- **Eyebrow** : Lexicon · les données de référence
- **H1** : Les données agricoles françaises, reliées entre elles
- **Lead** : Cadastre, parcelles PAC, produits phytosanitaires, météo, entreprises, savoirs agronomiques : le Lexicon rassemble {totalRows} (623 M) de données publiques et les relie par des clés communes. Un commun d’OSFarm, ouvert à tous.
- **CTA principal** : Explorer le Lexicon → https://lexicon.osfarm.org
- **CTA secondaire** : Accéder à l’API

## role — Le rôle d’Ekylibre SAS

- **H2** : Qui fait quoi
- **Texte** : Le Lexicon est un commun de l’association OSFarm. Ekylibre SAS en est le contributeur principal : nous participons à son développement et à son exploitation, et nous produisons {byEkylibre} (16) de ses jeux de données, comme les itinéraires techniques, les modèles d’interventions, les unités ou le plan comptable agricole. [À CONFIRMER : formulation du rôle d’Ekylibre SAS validée avec OSFarm, le site du Lexicon indiquant qu’il est « construit et maintenu par l’association OSFarm »]

## chiffres — Le Lexicon en chiffres

| Valeur | Libellé |
|---|---|
| {totalRows} (623 M) | données reliées |
| {datasets} (54) | jeux de données |
| {providers} (33) | producteurs de données |
| {open} (46) | jeux ouverts à tous |

## fonctionnalites — Ce que vous y trouvez

- **H2** : Sept familles de données
- **Points** :
  - **Territoire et foncier** : cadastre, parcelles déclarées à la PAC, sols, hydrographie, zones protégées.
  - **Climat** : observations de Météo-France.
  - **Intrants et réglementation** : produits phytosanitaires autorisés, substances actives, semences, variétés.
  - **Entreprises et aides** : entreprises (SIREN), bénéficiaires des aides PAC, agriculture biologique, signes de qualité.
  - **Marchés et économie** : prix des marchés européens, prix des carburants, budgets types.
  - **Savoirs agronomiques** : productions, itinéraires techniques, stades phénologiques, unités.
  - **Filières et alimentation** : projets alimentaires territoriaux, restauration collective, enseignement agricole.

## acces — Comment y accéder

- **H2** : Quatre façons de s’en servir
- **Points** :
  - **Dans le navigateur** : chaque jeu se consulte et se filtre sur lexicon.osfarm.org ; l’outil « Identifier une parcelle » donne tout ce que le Lexicon sait d’un point de la carte.
  - **Par API** : chaque page existe aussi en JSON et en CSV ; il suffit d’ajouter `.json` ou `.csv` à son adresse.
  - **En base de données** : chaque jeu est un paquet versionné à charger dans votre propre base PostgreSQL.
  - **Par un assistant d’IA** : le serveur MCP du Lexicon permet à un assistant de chercher et de croiser les jeux de données.
- **Exemple** :

```bash
curl https://lexicon.osfarm.org/phytosanitary/products.json
```

## licences — Ouvert, avec des règles claires

- **H2** : Libre, sourcé, traçable
- **Texte** : Le code du Lexicon est sous licence MIT. Chaque jeu de données garde la licence de sa source, indiquée dans le catalogue avec sa date et sa version. {members} (8) jeux sont réservés aux adhérents d’OSFarm, qui obtiennent une clé d’accès et des quotas plus élevés.

## pour-qui — À qui s’adresse le Lexicon

- **H2** : Pour qui
- **Points** :
  - **Éditeurs de logiciels et startups agricoles** : des référentiels à jour sans avoir à les collecter vous-même.
  - **Coopératives et organisations agricoles** : des données publiques prêtes à croiser avec celles de vos adhérents.
  - **Chercheurs, enseignants, collectivités** : une base unique pour étudier un territoire ou une filière.
  - **Agriculteurs** : indirectement, à travers Ekylibre et Aiffel, qui s’y réfèrent pour vérifier une dose ou identifier une parcelle.

## cta — Appel à l’action

- **H2** : Besoin d’intégrer le Lexicon dans vos outils ?
- **Texte** : Nous vous aidons à brancher l’API, à charger les paquets PostgreSQL ou à proposer un nouveau jeu de données.
- **CTA principal** : Parler de votre projet
- **CTA secondaire** : Explorer le Lexicon → https://lexicon.osfarm.org
- **Lien tertiaire** : Adhérer à OSFarm → https://www.osfarm.org
