# Site ekylibre.com — Exigences & recommandations (brainstorm)

> Statut : **v3, cadrage validé**, 2026-11-03. **Mise en ligne visée : 2026-11-10 (J+7).**
> Prochaine étape : `/sc:design` (architecture et design system), puis `/sc:workflow` (planning sur 7 jours).

---

## 0. Décisions prises (2026-11-03)

| # | Sujet | Décision |
|---|---|---|
| D1 | Offre présentée | **Ekylibre** (FMIS, ekylibre.org), **Aiffel** (assistant, aiffel.org), **Lexicon** (référentiel, lexicon.osfarm.org) |
| D2 | Vente en ligne | **Pas d'abonnement en ligne** pour Ekylibre → aucun tunnel de paiement, CTA = contact / démo |
| D3 | Preuves d'interopérabilité | **Tous les plugins** de github.com/ekylibre et **toutes les sources de données** du Lexicon (§2) |
| D4 | Charte | Logo et vert Ekylibre conservés |
| D5 | Visuel phare | **La ferme vue d'en haut (FarmLab La Vauzelle / SCI Les Chênes Verts) modélisée en 3D**, support du schéma d'interopérabilité global |
| D6 | Modèle 3D | **Réutiliser la maquette existante** (chaîne FreeCAD → Blender → glTF Draco, `~/Documents/SCI Chenes verts/maquette`, déjà publiée sur osfarm.github.io) |
| D7 | DNS & dépôt | DNS géré par David Joulin ; **dépôt public** → GitHub Pages gratuit |
| D8 | Rôle d'Ekylibre SAS | **Éditeur, contributeur principal et opérateur** d'Ekylibre, de Lexicon et d'Aiffel (en cohérence avec leur statut de communs OSFarm) |
| D9 | Plugins affichés | **Uniquement les plugins stables** = au moins une version publiée (tag) ; critère validé — voir §2.1 |
| D10 | Ce que vend Ekylibre SAS | **Services** : intégration, formation, transformation du système d'information, développement de connecteurs, support |
| D11 | Formulaires | **Brevo** |
| D12 | Langues | **FR + EN dès le lancement** |
| D13 | Ferme | Le lieu est nommé : **FarmLab La Vauzelle** |
| D14 | Ancien site | Hors ligne, mais indexé récemment → redirections nécessaires ; **129 URL** recensées via la Wayback Machine (`anciennes-urls-ekylibre-com.txt`) |
| D15 | Anciennes actualités | **Reprises** dans une page Actualités (environ 30 articles, extraits de la Wayback Machine), chaque ancienne URL redirigée vers son article |
| D16 | Statistiques | **Brevo** (conversions des formulaires) + **Google Analytics 4** |
| D17 | Traductions EN | Rédigées et relues par Claude |
| D18 | Contenus Entreprise publiables | **Dates clés**, **nombre d'exploitations**, **nombre d'hectares** (pas de trombinoscope) |

---

## 1. Audit de l'existant

### 1.1 Anciens sites (`~/projects/ekylibre-old`)
| Dépôt | Période | Techno | À garder | À abandonner |
|---|---|---|---|---|
| `ekylibre-github-io` | 2016 | Jekyll | ADN open source (AGPL v3), mention FEDER Aquitaine | Contenu et design |
| `ekylibre-com` | → 2023 | WordPress + Elementor (82 Mo de plugins), Stripe PHP | Types de contenu : équipe, témoignages, partenaires, jobs, actus ; FR/EN ; logo SVG ; vert `#00c15d` / `#4ed164` ; Montserrat + Lato | Tout le code, le tunnel Stripe (D2) |
| `documentation-clicnfarm` | 2019 | HTML statique | **1ʳᵉ entreprise labellisée Data-Agri (mars 2019)** ; URL `/terms-of-use` citée publiquement | La doc Clic&Farm (produit non repris) |

### 1.2 Écosystème actuel
- **ekylibre.org** : « Manage all your farm data in one place with *the leading open-source farming information system* ». Plus de 300 modèles PostgreSQL/PostGIS, multi-tenant, plus de 20 M de références (Onoma + Lexicon), plugins, intégrations ; démo, documentation utilisateur, technique et API, Discord.
- **aiffel.org** : « *Dites-le une fois. Aiffel le range au bon endroit.* » Assistant vocal ou écrit qui écrit dans les logiciels existants après validation. Branché : Ekylibre, Lexicon ; prévus : Lyvre, Geofolia, Smag Farmer, MesParcelles, Isacompta, Excel. Offres Libre, en ligne (1,99 € HT/mois) et Pro.
- **lexicon.osfarm.org** : « *623 M de données agricoles françaises, reliées entre elles.* » 54 jeux de données, accès par API JSON/CSV, paquets PostgreSQL et **serveur MCP**. Code sous MIT. **Un commun d'OSFarm.**

> ⚠️ Lexicon est présenté comme « un commun d'OSFarm » : le site doit décrire précisément le rôle d'Ekylibre SAS (contributeur principal, producteur de 17 jeux de données, intégrateur…) — voir question Q1.

### 1.3 Maquette 3D existante (atout majeur)
- 8 calques GLB compressés en Draco, **environ 4,2 Mo au total**, et un `scene.json` qui décrit les calques, les vues caméra prédéfinies (`site`, `rebus`, `reseaux`…) et le repère Lambert 93.
- Chaque objet glTF porte ses métadonnées (`extras` → `userData`), ce qui permet le survol et l'affichage de fiches.
- Visionneuse three.js 0.170 en JavaScript natif (431 lignes, `osfarm.github.io/assets/js/maquette-chenes-verts.js`) : bonne base de départ.
- Rendus Blender (`claudedocs/img/rendu_aerienne_site.jpg`…) et **photo drone** (`osfarm.github.io/assets/img/images-1777110131446.jpg`) utilisables comme image d'attente et comme repli.
- Poids par calque : terrain 2,4 Mo, arbres 0,74 Mo (2 622 instances), réseaux 0,77 Mo, le reste moins de 150 Ko.

**À exclure du site Ekylibre** : réseaux enterrés, intérieur et mobilier REBUS, états EDL/ESQ. Ces informations sur le bâtiment ne servent pas le message et n'ont pas à être publiques.

---

## 2. Matière du schéma d'interopérabilité

**Concept** : « **La ferme connectée au monde** ». La ferme 3D est au centre ; chaque élément physique porte les connecteurs qui le concernent, et des flux de données animés relient ces éléments au siège (Ekylibre). Au-dessus de la scène, une couche « données publiques » (Lexicon) ; à côté, une couche « dialogue » (Aiffel).

### 2.1 Plugins Ekylibre (github.com/ekylibre), placés sur la ferme
| Zone de la ferme 3D | Plugin | Fonction |
|---|---|---|
| Parcelles | **Agromonitoring** | Indices satellites (NDVI), données de sol |
| Parcelles / matériel | **Samsys** | Boîtiers connectés sur les machines |
| Tracteur | **Traccar** (+ AOG édition OSFarm) | Positions GPS, guidage |
| Robot de désherbage | **Natuition** | Données du robot |
| Station météo | **Sencrop**, **Weenat**, (Previmeteo) | Météo et capteurs |
| Piège | **CapTrap (cap2020)** | Piégeage connecté des ravageurs |
| Élevage / bâtiments | **EDNotif** | Données animales depuis l'EDE |
| Vigne / chai | **Ekyviti**, **Baqio** | Vigne ; commerce et gestion du vin |
| Bureau / maison | **Qonto**, **Banking (Nordigen)** | Banque, paiements, facture électronique |
| Bureau / maison | **Pasteque** | Caisse de vente directe |
| Bureau / maison | **Planning**, **Economic**, **Hajimari** | Planification, économie, assistant de démarrage |
| Exploitation entière | **HVE** (référentiel V4.4), **IDEA4** (53 indicateurs) | Certification, diagnostic de durabilité |
| Projets | **IMEPE**, **EPICEM** | Projets de R&D |
| Smartphone de l'agriculteur | **Zero mobile** (React Native, hors ligne, API REST v2), **Duke** / **Aiffel** | Saisie terrain, assistant conversationnel |

**Stabilité (D9), relevée le 2026-11-03 sur GitHub** :
- **Stables (version publiée)** : Ekyviti (v3.18.0-63.0, 251 commits), Hajimari (0.11.0, 386), Samsys (0.7.0, 221), EDNotif (1.0.0, 112), Baqio (0.5.1, 194), Planning (1.0.0, 65), Banking/Nordigen (0.1.0, 64), Weenat (0.1.1, 36), CapTrap (1.0.0, 26), Previmeteo (0.2.1, 15).
- **Sans version publiée (masqués au lancement)** : Qonto, Traccar, Sencrop, HVE, Agromonitoring, Natuition, IDEA4, Economic, Pasteque ; IMEPE (propriétaire).
- ⚠️ Conséquence : le satellite (Agromonitoring), le tracteur GPS (Traccar) et le robot (Natuition) disparaissent de la scène. Le tracteur reste porté par **Samsys**, la météo par **Weenat** et **Previmeteo**. Publier un tag sur les plugins prêts suffit à les faire apparaître au build suivant (règle EF9).

### 2.2 Sources Lexicon (54 jeux de données), regroupées pour la scène
| Famille (une constellation dans le ciel de la scène) | Jeux de données | Fournisseurs |
|---|---|---|
| **Territoire & foncier** | cadastre, cadastral_prices, cadastre_owners*, graphic_parcels (RPG), administrative_areas, postal_codes, commune_links, hydrography, soil, protected_natural_zones, protected_water_zones | Etalab, DGFiP, IGN, ASP, INSEE, La Poste, INRAE, MNHN |
| **Climat** | weather | Météo-France |
| **Intrants & réglementation** | phytosanitary, phytosanitary_substances, phytosanitary_purchases, phytosanitary_prices*, fertilizers*, seeds*, seed_varieties, vine_varieties* | ANSES, SDES, Cereapro, Germineo, SEMAE, FranceAgriMer |
| **Entreprises & aides** | enterprises (SIREN), enterprise_classifications, enterprise_links*, cap_beneficiaries, msa_populations, rica, hve_farms*, organic_farming, quality_and_origin_signs | INSEE, ASP, CCMSA, Agreste, Agence Bio, INAO |
| **Marchés & économie** | eu_market_prices, fuel_prices, prices, budgets, chart_of_accounts | Union européenne, DGEC, Ekylibre SAS |
| **Savoirs agronomiques** | productions, technical_workflows, technical_workflow_sequences, intervention_models, phenological_stages, taxonomy, variants, units, open_nomenclature, production_documentations, rd_agri, agricultural_pictures | Ekylibre SAS, ACTA, Triple Performance |
| **Filière & territoire alimentaire** | pat, canteens, alim_confiance, agricultural_schools, agroedi* | France PAT, DGAL, DGER, AgroEDI |
| Divers | industry_sector, legal_positions, user_roles | Ekylibre SAS |

`*` = réservé aux adhérents OSFarm. **Chiffres affichables** : 623 M de données, 54 jeux, environ 30 producteurs publics, 17 jeux produits par Ekylibre SAS.

**Source unique de vérité** : le site récupère au **build** `https://lexicon.osfarm.org/catalog.json` et la liste des dépôts GitHub `ekylibre/*`. Les chiffres restent ainsi à jour sans saisie manuelle (exigence EF9).

---

## 3. Objectifs

- **O1 — Positionnement** : la référence des **systèmes d'information agricoles interopérables**, dans la continuité du slogan d'ekylibre.org (« the leading open-source farming information system »). Le leadership est **démontré par les preuves** : nombre de connecteurs, 623 M de données reliées, open source depuis 2014, label Data-Agri, API et serveur MCP.
- **O2 — Image** : très professionnelle, technologique et agricole.
- **O3 — Conversion** : demande de démo, contact intégrateur ou éditeur partenaire, accès à l'API, à Lexicon et à Aiffel.
- **O4 — Autonomie** : site statique sur GitHub Pages, sans serveur.

## 4. Cibles

| Persona | Attente | Contenu clé |
|---|---|---|
| Agriculteur / viticulteur | Simplicité, conformité, rien à ressaisir | Ferme 3D, Ekylibre, Aiffel, démo |
| Coopérative / OPA / chambre / centre de gestion | Données consolidées, intégration | Interopérabilité, Lexicon, sécurité |
| Éditeur / startup agtech / DSI | API, standards, connecteurs | Page Développeurs, API, MCP, GitHub |
| Institutions / financeurs / presse | Souveraineté, communs, open source | Vision, entreprise, actualités |
| Candidats / contributeurs | Culture, projets | Équipe, Discord, GitHub |

## 5. Exigences fonctionnelles

### Arborescence
**Version de lancement (J+7)** — en gras ; le reste vient ensuite.
1. **Accueil** : hero 3D de la ferme connectée, preuves chiffrées, 3 produits, CTA.
2. **Interopérabilité** : scène 3D complète et explorable, filtres (plugins / Lexicon / Aiffel), fiches connecteurs, **équivalent en tableau accessible**.
3. **Produits** : **Ekylibre**, **Aiffel**, **Lexicon**, avec renvoi vers les sites de chaque produit.
3 bis. **Services** (D10) : intégration, formation, transformation du SI, développement de connecteurs, support ; CTA projet via Brevo.
4. **Développeurs** : API REST, MCP Lexicon, plugins, GitHub, licences.
5. **Entreprise** : histoire (2014→), valeurs (communs, open source, souveraineté), label Data-Agri, **contact / démo**.
6. **Mentions légales, CGU (`/terms-of-use`), confidentialité**.
7. Après le lancement : actualités, témoignages, partenaires, carrières, pages par profil, version EN complète.

### Exigences
- **EF1** **FR + EN dès le lancement** (D12) : `/` et `/en/`, sélecteur de langue, `hreflang`, infobulles 3D traduites.
- **EF2** Contenus en Markdown/MDX dans le dépôt (collections typées : produits, connecteurs, actus).
- **EF3** Scène 3D interactive : orbite limitée, survol → infobulle, clic → fiche, vues caméra guidées.
- **EF4** Narration au défilement sur l'accueil : vue d'ensemble, puis les machines, la météo, le bureau, les données publiques, et enfin l'agriculteur qui parle à Aiffel.
- **EF5** **Repli** : photo drone et pastilles SVG si WebGL est indisponible, sur un appareil peu puissant ou avec `prefers-reduced-motion`.
- **EF6** Formulaire de contact et de demande de démo via un service tiers, avec consentement RGPD et anti-spam.
- **EF7** Redirections des anciennes URL (au minimum `/terms-of-use`, `/en/`).
- **EF8** Liens vers la démo (demo.ekylibre-dev.com), la documentation, Discord, GitHub, aiffel.org et lexicon.osfarm.org.
- **EF9** Chiffres et listes de connecteurs générés au build depuis `catalog.json` du Lexicon et l'API GitHub, avec une valeur de secours figée si la récupération échoue.

## 6. Exigences non fonctionnelles

| ID | Exigence | Cible |
|---|---|---|
| ENF1 | Performance | Lighthouse ≥ 90 mobile ; LCP < 2,5 s (le LCP est l'**image d'attente**, pas la 3D) ; JS initial < 150 Ko hors 3D |
| ENF2 | Poids 3D | Hero ≤ **2,5 Mo** (terrain simplifié + bâtiments + arbres) ; page Interopérabilité ≤ 5 Mo ; chargement uniquement quand visible |
| ENF3 | Accessibilité | WCAG 2.2 AA ; la 3D n'est jamais seule porteuse d'information |
| ENF4 | SEO | Pré-rendu statique, sitemap, JSON-LD (Organization, SoftwareApplication ×3), OpenGraph avec rendu 3D |
| ENF5 | RGPD | **GA4 dépose des cookies → bandeau de consentement obligatoire** (CNIL) : GA4 en *Consent Mode v2*, chargé seulement après accord, refus aussi simple que l'acceptation, choix modifiable depuis le pied de page. Polices et bibliothèques **auto-hébergées** (pas de CDN) |
| ENF6 | Hébergement | GitHub Pages + Actions ; `ekylibre.com` (A/AAAA GitHub + CNAME `www`), HTTPS forcé |
| ENF7 | Maintenabilité | Aucune licence payante ; la chaîne 3D reste dans le dépôt de la maquette, le site ne fait que **consommer** les GLB exportés |
| ENF8 | Éco-conception | Cohérence avec le discours de sobriété d'Aiffel : budget de poids affiché, pas de vidéo en lecture automatique |

## 7. Recommandations technologiques (révisées après l'audit de la maquette)

### Socle
- **Astro 5** (sortie statique) + **Tailwind CSS v4** + déploiement par `withastro/action` vers GitHub Pages.
- Données de build : `catalog.json` du Lexicon et `gh api orgs/ekylibre/repos`, transformés en collections de contenu.

### 3D — choix révisé : **three.js en JavaScript natif**, pas React Three Fiber
Raisons : la visionneuse et le format `scene.json` existent déjà en JavaScript natif (431 lignes à reprendre) ; React ajouterait environ 45 Ko et une couche d'abstraction inutile ; le délai de 7 jours impose de réutiliser le code existant.

| Besoin | Technologie |
|---|---|
| Rendu et chargement | **three.js** (version figée, empaquetée par Vite, pas de CDN), `GLTFLoader` + `DRACOLoader` (décodeur auto-hébergé), `MeshoptDecoder` |
| Préparation du hero | **gltf-transform** : simplification du terrain, texture en **KTX2**, fusion des calques, compression Meshopt → objectif ≤ 2,5 Mo |
| Connecteurs sur la scène | **CSS2DRenderer** (étiquettes HTML accessibles au clavier et nettes) ancrées sur les objets de la scène |
| Flux de données animés | Courbes `CatmullRomCurve3` + `Line2` / `TubeGeometry` avec shader de « pulsation » qui parcourt la courbe |
| Constellation Lexicon | `InstancedMesh` de points lumineux au-dessus de la scène, regroupés par famille (§2.2) |
| Ambiance « tech » | Post-traitement léger (**bloom** sélectif via `pmndrs/postprocessing`), lumière rasante de fin de journée (comme la photo drone), brouillard |
| Narration au défilement | **GSAP + ScrollTrigger** qui pilotent les caméras **entre les vues de `scene.json`**, enrichies de nouvelles vues (machines, bureau, ciel) ; **Lenis** pour un défilement fluide |
| Diagrammes 2D (repli, page Développeurs) | SVG animé par GSAP |
| Cartographie (après le lancement) | MapLibre GL + deck.gl pour illustrer graphic_parcels et cadastre du Lexicon |

**Garde-fous** : chargement de la 3D en différé (`client:visible`), image d'attente (rendu Blender ou photo drone), détection de WebGL et de la puissance (`renderer.capabilities`, `devicePixelRatio` plafonné à 1,5), pause du rendu hors écran, `prefers-reduced-motion` → vues fixes.

### Services externes
- Formulaires : **Brevo** (D11). Sur un site statique, utiliser le formulaire Brevo intégré, qui poste directement vers Brevo : aucune clé d'API n'est exposée, double opt-in et consentement RGPD sont gérés par Brevo. Un formulaire par usage (démo, projet de services, newsletter), versions FR et EN.
- Statistiques (D16) : **GA4** avec Consent Mode v2 + bandeau **vanilla-cookieconsent** (open source, auto-hébergé, environ 20 Ko, FR/EN) ; événements de conversion `generate_lead` à l'envoi des formulaires Brevo.

## 8. User stories & critères d'acceptation

- **US1 — DSI de coopérative** : je vois comment Ekylibre se connecte au reste de l'écosystème.
  - CA : la scène affiche au moins 15 connecteurs et les 7 familles du Lexicon ; chaque élément ouvre une fiche (fonction, source, licence, lien) ; un tableau équivalent est présent dans la page.
- **US2 — Agriculteur sur mobile** : je comprends en 30 s ce que fait Ekylibre et je demande une démo.
  - CA : image d'attente affichée en moins de 2,5 s en 4G ; CTA visible sans défilement ; formulaire de 5 champs au plus.
- **US3 — Éditeur partenaire** : j'accède à l'API, au MCP Lexicon et aux dépôts.
  - CA : la page Développeurs contient l'exemple `curl` du Lexicon, la configuration MCP, les liens vers la documentation API et vers GitHub.
- **US4 — Équipe Ekylibre** : je publie un contenu par simple merge.
  - CA : ajouter un fichier `.md` puis faire un merge sur `main` publie le site en moins de 5 min.
- **US5 — Données à jour** : les chiffres du site suivent le Lexicon et GitHub.
  - CA : un build réalisé après l'ajout d'un jeu de données au Lexicon affiche le nouveau total.
- **US6 — Ancien lien** : `/terms-of-use` aboutit sur les CGU.

## 9. Proposition de planning sur 7 jours (à détailler avec `/sc:workflow`)

| Jour | Livrable |
|---|---|
| J1 | Socle Astro, design system (tokens, typo, composants), déploiement Pages + domaine |
| J2 | Préparation des GLB du hero (gltf-transform), visionneuse three.js reprise et intégrée comme îlot |
| J3 | Connecteurs sur la scène, flux animés, constellation Lexicon, données de build |
| J4 | Narration au défilement de l'accueil, repli 2D, version mobile |
| J5 | Pages Interopérabilité, Produits ×3, Développeurs |
| J6 | Entreprise, contact, mentions et CGU, SEO, redirections, analytics |
| J7 | Recette : Lighthouse, accessibilité, navigateurs, relecture des contenus, bascule DNS |

**Risque principal** : la qualité de la scène 3D dans le délai. Parade : prévoir dès J2 une version « minimale publiable » (rotation lente, étiquettes, aucun défilement scénarisé), puis l'enrichir.

## 10. Conséquences des décisions D8 à D14 sur le périmètre

- **Page « Services »** (nouvelle, incluse au lancement) : intégration, formation, transformation du SI, développement de connecteurs, support. C'est la **page de conversion principale** : CTA « Parler de votre projet » via un formulaire Brevo.
- **Formulations de marque** : « Ekylibre SAS édite, opère et contribue en premier lieu à Ekylibre, Lexicon et Aiffel, des communs numériques portés avec OSFarm. »
- **Bilingue au lancement** : toutes les pages de la version de lancement existent en FR et en EN (`/` et `/en/`), les infobulles de la scène 3D aussi. Les libellés des jeux Lexicon viennent de `catalog.json` ; leur traduction EN sera à produire (54 libellés).
- **Redirections** (129 URL) : GitHub Pages ne gère pas les redirections serveur. Elles seront générées sous forme de pages statiques (`redirects` d'Astro, `meta refresh` + `rel=canonical`). Correspondances principales :
  - `/ekyagri*`, `/features`, `/nos-offres`, `/eng/our-offers*`, `/subscription-*` → Ekylibre / Services
  - `/ekyviti*`, `/clicnfarm` → Ekylibre (page produit, section filières)
  - `/developpeurs`, `/eng/developers`, `/open-source`, `/connexions-partenaires` → Développeurs / Interopérabilité
  - `/custom-services`, `/formation`, `/support*`, `/eng/training` → Services
  - `/data-agri-*` → Entreprise (section label Data-Agri)
  - `/about`, `/equipe/*`, `/jobs`, `/on-recrute`, `/press`, `/partners`, `/community` → Entreprise
  - `/terms*`, `/conditions-of-sale`, `/cookies` → pages légales ; `/paiement-*` → accueil
  - Articles d'actualité (environ 30) → accueil ou future page Actualités (à trancher : les reprendre ou non)
  - `/eng/*` → `/en/*`

## 11. Contenus Entreprise (D18)

### Dates clés — proposition, à compléter
| Date | Événement | Source |
|---|---|---|
| 2008-09 | Premier commit du logiciel Ekylibre | Dépôt `ekylibre/ekylibre` |
| 2011 | Organisation GitHub `ekylibre` ; Ekylibre devient un projet open source public (AGPL v3) | GitHub |
| **à compléter** | Création d'Ekylibre SAS | — |
| ~2016 | Projet cofinancé par le FEDER / Région Aquitaine | Ancien site |
| 2019-03 | **1ʳᵉ entreprise labellisée Data-Agri** (FNSEA & JA), Salon de l'agriculture / SIMA | Ancien site |
| ~2020 | Rapprochement avec Clic&Farm ; lancement d'Ekyviti, premier logiciel dédié à une filière | Ancien site, dépôt `motherbase` |
| 2023-2024 | OSFarm et Ekylibre : Open Source Experience 2023, Salon de l'agriculture 2024 | Ancien site |
| 2026 | Lexicon (623 M de données, 54 jeux) et Aiffel | lexicon.osfarm.org, aiffel.org |

### Chiffres
- **Calculés automatiquement au build** : 23 192 commits, 39 contributeurs, 493 étoiles, 174 forks (dépôt `ekylibre/ekylibre`) ; nombre de plugins stables ; 623 M de données et 54 jeux (Lexicon).
- **Fournis par Ekylibre SAS** (non publiés en ligne) : nombre d'exploitations, nombre d'hectares. En 2021, l'ancien site annonçait « plus de 5 000 agriculteurs ».

## 12. Données à fournir avant le jour 6 (ne bloquent pas la conception)

1. **Date de création d'Ekylibre SAS**, et corrections ou compléments à la frise ci-dessus.
2. **Nombre d'exploitations et d'hectares** actuels, avec la date de la mesure.
3. **ID de mesure GA4** (`G-XXXXXXX`).
4. **Formulaires Brevo** : listes de destination, ou accès pour créer les 3 formulaires (démo, projet de services, newsletter) en FR et EN.
5. **Mentions légales** : raison sociale, SIREN, adresse du siège, directeur de publication, CGU actuelles (texte de `/terms-of-use`).
