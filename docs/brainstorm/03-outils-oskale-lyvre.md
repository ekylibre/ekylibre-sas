# Brainstorm 03 — Illustrer nos outils (inspiration oskale.com) et ajouter Lyvre

Date : 2026-11-04. Statut : exigences validées le 2026-11-04 (décisions D19 à D25, §7). Prêt pour `/sc:design`.

## 1. Demande

1. S'inspirer de https://oskale.com/ pour illustrer les outils développés par Ekylibre SAS, en conservant
   le **vrai logo** de chaque outil.
2. Ajouter **Lyvre** à la liste des outils édités : comptabilité libre des associations et des SCI, dont la
   partie agricole est en cours de développement, et qui sera interconnectée aux autres outils via **Aiffel**.

## 2. Constat

### 2.1 Ce que fait oskale.com (captures du 2026-11-04)

| Dispositif | Description | Intérêt pour nous |
|---|---|---|
| **Schéma isométrique en traits fins** (hero) | Un socle central (logo) relié par des lignes pointillées à 5 modules isométriques (bâtiments, écran, capteur). Au survol d'un module, il passe en bleu et une étiquette apparaît (« Déclaration de douane, prête à signer »). Légende « fig. 01 · Agent IA · survolez un module ». | Fort : Aiffel au centre, Ekylibre / Lexicon / Lyvre autour. |
| **Grille de modules numérotés** | Cartes 01 à 05 : petite icône isométrique au trait, titre, accroche, 3 puces, ligne « stack » (logos mono + nom : Claude, n8n, three.js…). | Moyen : remplace nos médaillons génériques. |
| **Récit sombre « produits en service »** | Section sombre, onglets 01/05 à 05/05 en bas avec barre de progression ; à gauche titre en capitales, accroche, puces, badge d'état (« En service », « En essais », « En cours ») et lien ; à droite une **maquette d'interface schématique animée** (facture → banque rapprochée avec coches, courbe de trésorerie ; registre de fûts). | Fort : une maquette par outil, sans capture d'écran réelle. |
| **Badges d'état honnêtes** | En service / En essais / En cours / Bêta. | Fort : Lyvre agricole = « en développement ». |
| **Mur de logos** | Bandeau sombre défilant, logo réel + nom + secteur. | Faible (nous n'avons que 4 outils). |
| **Chaîne en isométrique** | Plateau « Capter → Structurer → Visualiser → Exploiter ». | Déjà couvert par notre ferme 3D. |

À éviter (constaté) : gabarit répété à l'identique (3 puces partout), multiplication des CTA, indication
« survolez » sans équivalent tactile ni clavier.

### 2.2 Notre site aujourd'hui

- Accueil, section « Trois communs, une même donnée » (`src/components/home/HomePage.astro`) : 3 cartes
  identiques avec une **icône générique** dans un médaillon (`owl`, `database`, `microphone`), pas les vrais logos.
- Pages produit Ekylibre, Lexicon, Aiffel ; pas de Lyvre. La scène 3D place Aiffel dans la cour.

### 2.3 Logos réels disponibles

| Outil | Source | Couleurs |
|---|---|---|
| Ekylibre | `src/assets/brand/ekylibre-logo.svg`, `ekylibre-owl.svg` | vert Ekylibre |
| Lexicon | `../lexicon-rest-api/public/images/lexicon-logo.svg` | bleu `#5b99c7` |
| Aiffel | `https://aiffel.org/favicon.svg` (A tracé, barre verte `#58AD45`) | `#16211C`, `#58AD45` |
| Lyvre | `../compta-asso/frontend/src/assets/lyvre-symbole.svg` (+ `-inverse` pour fond sombre) | `#1E2421`, `#3A4440`, `#DDE8DF` |

### 2.4 Lyvre (dépôt `compta-asso`, page /about)

- « La comptabilité des associations et des SCI, libre, sobre et souveraine. » AGPL-3.0, auto-hébergé
  (Docker), Flask + React. Version 2026.11.5.
- De la saisie au bilan : banque (Qonto, OFX), achats (Factur-X, OCR), ventes, adhésions et reçus fiscaux,
  baux (carte IGN, Documenso, fermages), budget, clôture, FEC ; **reprise d'une comptabilité Ekylibre**.
- Partie agricole en cours (`claudedocs/compta_agricole/` : audit réglementaire, PCGA 2023, calendrier
  fiscal/MSA/PAC, audit Ekylibre et Lexicon) ; services `agri_chart.py`, `agri_reports.py` déjà présents.
- Dépôt GitHub `asso-seconde-nature/seconde-compta`, instance publique `lyvre.seconde-nature.net`.

## 3. Objectifs

- O1. Présenter **quatre** outils avec leur identité propre (logo réel) tout en montrant qu'ils forment
  un seul système relié par Aiffel et le Lexicon.
- O2. Rendre chaque outil concret par une **maquette d'interface schématique animée**, à la manière
  d'oskale, sans dépendre de captures d'écran qui vieillissent.
- O3. Afficher l'**état** de chaque outil sans survendre (Lyvre agricole en développement).

## 4. Exigences fonctionnelles (proposées)

- **F1 — Logos réels.** Chaque outil est représenté par son logo officiel en SVG (copie locale dans
  `src/assets/brand/`), jamais redessiné ni recoloré, avec une variante pour fond sombre. Les médaillons
  génériques des cartes produit disparaissent.
- **F2 — Schéma « système » isométrique.** Un schéma au trait fin (style oskale, palette du site) : Aiffel
  au centre, Ekylibre, Lexicon et Lyvre autour, liaisons pointillées animées décrivant les flux réels
  (dicter → Aiffel → écrire dans Ekylibre ou Lyvre ; vérifier dans le Lexicon ; Ekylibre → Lyvre pour la
  comptabilité). Chaque outil est un bouton : survol, focus clavier et toucher affichent une étiquette
  (rôle + flux). Légende « fig. 0X ».
- **F3 — Récit des outils.** Section à onglets 01/04 à 04/04 (progression au défilement, navigable au
  clavier) : logo, accroche, 3 à 4 points **non gabarisés**, badge d'état, liens (page produit, site
  officiel, code). À droite, une maquette schématique animée propre à chaque outil :
  - Ekylibre : intervention saisie → stock décrémenté → parcelle mise à jour ;
  - Lexicon : requête → jeux de données reliés (cadastre, PAC, phyto, météo) ;
  - Aiffel : bulle de dictée → reformulation → validation → écriture citée ;
  - Lyvre : facture → banque rapprochée → bilan / FEC, avec l'étiquette « agricole : en développement ».
- **F4 — Badges d'état** : En service, En développement, Bêta, avec date de vérification.
- **F5 — Lyvre dans le site** : carte et récit sur l'accueil, mention dans le schéma, dans le menu
  « Logiciels », dans le pied de page et dans les données structurées ; contenu FR et EN.
- **F6 — Cohérence des textes** : « Trois communs » devient « Quatre logiciels libres » (ou formule à
  valider) ; la phrase « portés avec l'association OSFarm » est ajustée (Lyvre relève de Seconde Nature).

## 5. Exigences non fonctionnelles

- N1. Pas de nouvelle dépendance lourde : SVG + CSS + GSAP déjà présents ; poids ajouté < 60 ko compressés.
- N2. `prefers-reduced-motion` : maquettes statiques, état final affiché.
- N3. Accessibilité : interactions au clavier et au toucher, textes alternatifs, contraste AA ; tests axe.
- N4. CSP inchangée : SVG inline sans attribut `style`, pas de script externe.
- N5. Lighthouse ≥ 90 maintenu ; aucune régression des tests existants.
- N6. Les logos tiers sont utilisés avec l'accord de leurs titulaires (Seconde Nature pour Lyvre, OSFarm
  pour Lexicon).

## 6. Critères d'acceptation

- CA1. Les quatre logos réels apparaissent sur l'accueil et sont identiques aux fichiers sources.
- CA2. Le schéma est utilisable à la souris, au clavier (Tab / Entrée) et au toucher ; axe sans erreur.
- CA3. Chaque outil a sa maquette animée ; en mouvement réduit, elle est statique et lisible.
- CA4. Lyvre est présent en FR et EN, avec son badge « agricole : en développement ».
- CA5. `npm run build` et `npm test` passent ; Lighthouse accueil ≥ 90.

## 7. Décisions (2026-11-04)

- **D19 — Lyvre est édité par Ekylibre SAS**, au même titre qu'Ekylibre : « Ekylibre SAS édite, opère
  et contribue en premier lieu à quatre logiciels libres ». F6 : la mention OSFarm reste attachée au
  Lexicon ; Lyvre n'est plus présenté comme un outil de Seconde Nature (Seconde Nature peut figurer comme
  première structure utilisatrice, à confirmer).
- **D20 — Page dédiée `/lyvre/` (FR) et `/en/lyvre/` (EN)**, construite comme les pages Ekylibre, Lexicon
  et Aiffel : hero avec maquette animée, fonctions, intégrations, état, liens site et code, image OG.
- **D21 — Lyvre est la brique comptable de l'écosystème** : il reçoit les données d'Ekylibre (reprise et
  flux), d'Aiffel (pièces et écritures dictées, après validation) et s'appuie sur le Lexicon (plan
  comptable PCGA, indices, fermages). Le schéma F2 et les textes montrent ce flux ; la partie agricole
  est badgée « en développement ».
- **D22 — Inspiration oskale retenue en entier** : schéma isométrique (F2) et récit à maquettes (F3)
  sur l'accueil, **et** maquette animée en tête de chaque page produit (Ekylibre, Lexicon, Aiffel, Lyvre).

- **D23 — Dépôt de code** : le développement reste actif dans `asso-seconde-nature/seconde-compta` ;
  transfert prévu vers `ekylibre/lyvre`. Le lien « code » de la page Lyvre est centralisé dans les données
  (une seule valeur à changer au transfert). Site public : `lyvre.seconde-nature.net` d'ici là.
- **D24 — État affiché « En cours »** pour la partie agricole de Lyvre et pour sa connexion à Aiffel,
  sans date.
- **D25 — Nouveau périmètre d'Ekylibre** : Ekylibre est refait dans cette logique et se concentre sur la
  gestion de l'exploitation : matériels, stocks, suivi GPS, capteurs et agronomie. La comptabilité générale
  et les obligations fiscales relèvent de Lyvre ; la page Ekylibre et ses textes (accueil, OG, JSON-LD,
  récit 3D) sont réécrits en conséquence et renvoient vers Lyvre pour la comptabilité.
