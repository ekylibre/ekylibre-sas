# Exigences — accueil, kit isométrique, connecteurs (novembre 2026)

> Source : `claudedocs/amelioration_07112026.md` (note du 2026-11-07).
> Brainstorm du 2026-11-08. Étape suivante : `/sc:design` (scène 3D, schéma du système), puis `/sc:workflow`.

## 1. Objectifs

1. **Aligner l'accueil sur le passage à Fourmy** (commit `011dae8`) : la scène 3D et le récit parlent
   encore d'Ekylibre, de Samsys, de Nordigen et d'Ekyviti.
2. **Donner une identité graphique propre au schéma « Quatre logiciels libres, un seul système »**
   en réutilisant les illustrations isométriques maison de l'archive Graphisme.
3. **Présenter les connecteurs du nouveau système** : Fourmy et Lyvre, à la place des plugins Ekylibre.

## 2. Décisions prises

| Sujet | Décision |
|---|---|
| Place de la vigne dans le récit | **Nouveau chapitre** dédié « La vigne » ; le récit passe à 7 chapitres. |
| Texte du chapitre « La vigne » | Proposition du §3.2 **validée** (2026-11-08). |
| Licence des illustrations de l'archive | **Propriété d'Ekylibre SAS** : tous les éléments de l'archive Graphisme sont utilisables, y compris les dossiers qui contiennent des fichiers de licence. |
| Schéma « Quatre logiciels libres » | **Garder l'interactivité** : les volumes géométriques sont remplacés par des éléments du kit ; boutons, flux et panneau texte accessibles restent. |
| Portée du kit | Le kit sert **uniquement au schéma du système** ; la scène 3D (GLB) n'est pas redessinée. |
| Tableau des connecteurs | **Fourmy remplace Ekylibre** : le tableau ne montre plus que les intégrations Fourmy et Lyvre. |
| Weenat, CapTrap, Open Sprinkler, Baoba | **Deviennent des intégrations Fourmy** (à venir) : listées dans le tableau, état « en cours ». |
| Compteur « 10 connecteurs stables » | **Formulation sans chiffre** partout (bandeau, page Entreprise, accueil, page Interopérabilité). |
| Plugins Ekylibre (Samsys, Qonto, HVE, IDEA…) | **Retirés du site.** |
| Fichiers `.ai` | On recense ceux qui s'ouvrent, et on les **convertit en SVG avec Inkscape**. |

## 3. Exigences fonctionnelles

### 3.1 Scène 3D de l'accueil (`FarmScene`, `src/islands/farm-scene/`)

| ID | Exigence |
|---|---|
| FR-3D-1 | La zone « La vigne et le chai » est renommée **« La vigne »** (FR) / **« The vineyard »** (EN). |
| FR-3D-2 | Les vignes sont **déplacées à côté du maraîchage, derrière le hangar** (nouvelle ancre de zone). Elles ne doivent pas masquer les étiquettes du maraîchage ni des hangars. |
| FR-3D-3 | L'étiquette « Ekyviti - Baqio » devient **« Baqio »**. Ekyviti n'apparaît plus sur la scène. |
| FR-3D-4 | L'étiquette « CapTrap » du maraîchage devient **« CapTrap - Open Sprinkler »**. |
| FR-3D-5 | Le moyeu central : titre **« Le système d'information agricole »** accompagné du **logo Fourmy** (`src/assets/brand/products/fourmy.svg`) ; sous-titre **« Fourmy »**. EN : « The farm information system » / « Fourmy ». |
| FR-3D-6 | Le bureau : **Nordigen est remplacé par Lyvre**. |
| FR-3D-7 | Une vue caméra **« vigne »** existe pour le nouveau chapitre. |

### 3.2 Récit au défilement (`HomePage.astro`)

Textes donnés par la note (FR), corrigés pour l'orthographe ; la version anglaise est à rédiger dans le même esprit.

| # | Chapitre | Titre | Texte |
|---|---|---|---|
| 1 | Grande culture | Machines, météo et sonde, une seule saisie | Traccar enregistre le travail des tracteurs, les stations Weenat relèvent la météo, les pièges CapTrap comptent les ravageurs. Tout arrive dans Fourmy sous forme d'interventions et de relevés rattachés aux parcelles, sans ressaisie. |
| 2 | Élevage | Chaque filière, ses règles et ses référentiels | Les données animales s'échangent avec l'EDE, Baoba ou le logiciel que vous avez. |
| 3 | **La vigne** *(nouveau)* | De la parcelle à la bouteille | Les rangs de vigne sont suivis dans Fourmy comme toute autre parcelle ; Baqio fait remonter les ventes et les expéditions de vin. |
| 4 | Le bureau | Saisi une fois, retrouvé partout | Au bureau, tout converge : les relevés bancaires et les factures arrivent pour le rapprochement, le planning compare le prévu et le réalisé. Votre comptable, votre logiciel ou Lyvre génère la comptabilité, sans ressaisie. |
| 5 | Le ciel de données | *inchangé* | *inchangé* |
| 6 | La voix | Dites-le une fois. Aiffel le range au bon endroit. | Depuis la cour, l'agriculteur dicte son traitement ou sa récolte. Aiffel reformule, vérifie et n'écrit dans vos outils qu'après validation, en citant ses sources. |
| 7 | Synthèse | *inchangé, sauf « Ekylibre » → « Fourmy » si présent* | |

| ID | Exigence |
|---|---|
| FR-REC-1 | Les numéros d'eyebrow suivent l'ordre ci-dessus (1 à 7). |
| FR-REC-2 | Chaque nom cité dans un chapitre (Traccar, Weenat, CapTrap, EDE, Baoba, Baqio, Lyvre, Aiffel) est visible sur la scène au moment du chapitre. |
| FR-REC-3 | Le repli sans WebGL (`ConnectorDiagram`) reprend les mêmes noms. |
| FR-REC-4 | Hajimari et Previmeteo ne sont plus cités dans le récit. |

### 3.3 Kit isométrique

| ID | Exigence |
|---|---|
| FR-KIT-1 | **Recenser** tous les `.ai` et `.svg` de `~/Documents/archive_ekylibre/ewannin@ekylibre.com/Graphisme` (196 fichiers au 2026-11-08), sous-dossiers compris : chemin, format, aperçu, présence d'éléments isométriques. Les `.ai` sont **convertis en SVG avec Inkscape** ; ceux qui ne s'ouvrent pas sont listés comme tels dans l'inventaire, sans autre traitement. |
| FR-KIT-2 | **Consolider** les éléments de ferme isométriques (bâtiments, silos, hangar, chai, vignes, serre, maraîchage, animaux, tracteurs, stations météo, pièges, personnages, bureau…) en un kit : un SVG par élément, nommé, sur fond transparent, avec une fiche d'inventaire (source, catégorie, dimensions). Sources principales attendues : `Isometric-full.ai`, `Farm_isometric*.ai`, `serre.ai`, `equipements*.ai`, `moissoneuse.ai`. |
| FR-KIT-3 | Le kit et son inventaire vivent dans le dépôt (emplacement à fixer en design) ; les `.ai` d'origine n'y sont pas copiés. |
| FR-KIT-4 | Tous les éléments de l'archive sont la propriété d'Ekylibre SAS : aucun n'est exclu pour raison de licence. |

### 3.4 Schéma « Quatre logiciels libres, un seul système » (`SystemDiagram.astro`)

| ID | Exigence |
|---|---|
| FR-SYS-1 | Chaque logiciel (Aiffel, Fourmy, Lexicon, Lyvre) et l'agriculteur sont représentés par une **illustration du kit** à la place des volumes géométriques actuels. |
| FR-SYS-2 | L'interactivité actuelle est conservée : logiciels en boutons HTML, flux entre logiciels, panneau texte `aria-live`, avance automatique, mode `focus` des pages produit, tons clair/sombre. |
| FR-SYS-3 | Les illustrations restent lisibles en thème sombre et sur mobile (largeur 360 px). |

### 3.5 Tableau des connecteurs (page Interopérabilité, `ConnectorTable`)

| ID | Exigence |
|---|---|
| FR-CON-1 | Le tableau ne liste plus les plugins Ekylibre ; il liste les **intégrations de Fourmy** (dépôt `ekylibre/fourmy`) et celles de **Lyvre**. |
| FR-CON-2 | Chaque ligne indique le logiciel (Fourmy / Lyvre) et l'état : **stable** ou **en cours**. Les intégrations Lyvre sont **en cours**. |
| FR-CON-3 | Fourmy, état constaté le 2026-11-08 : `connector-traccar` (synchro par ferme en service), `geo-ign` (relief, photo et bâtiments IGN), `migrator-ekylibre` (reprise des fermes Ekylibre). **En cours** : Weenat, CapTrap, Open Sprinkler, Baoba, Sencrop. |
| FR-CON-4 | Lyvre, d'après `docs/design/03-outils-lyvre.md` : Qonto, Sirene, Factur-X, Documenso, HelloAsso, Brevo, Stancer, Odoo, SMTP. |
| FR-CON-5 | Le titre « 10 connecteurs stables, en logiciel libre » et les compteurs liés (bandeau chiffres `StatBand`, page Entreprise, accueil « N connecteurs publiés ») passent à une **formulation sans chiffre** (ex. « Des connecteurs en logiciel libre, stables ou en cours »). |
| FR-CON-7 | Les plugins Ekylibre sont **retirés du site** : tableau, scène 3D de la page Interopérabilité, fiches `connectors.yaml`, mentions dans les textes. Les intégrations Fourmy et Lyvre prennent leurs ancres de zone dans la scène. |
| FR-CON-6 | La scène 3D de la page Interopérabilité et le tableau HTML restent équivalents (US1, accessibilité). |

## 4. Exigences non fonctionnelles

- **NFR-1 Bilingue** : toute chaîne nouvelle ou modifiée existe en FR et en EN.
- **NFR-2 Performance** : le kit n'alourdit pas l'accueil de plus de ~150 Ko (SVG optimisés) ; la scène 3D garde son budget actuel.
- **NFR-3 Accessibilité** : équivalent textuel du schéma et du tableau ; contraste AA ; `prefers-reduced-motion` respecté.
- **NFR-4 Vérité du contenu** : un connecteur affiché « stable » correspond à du code publié ; une intégration non livrée est marquée « en cours ».
- **NFR-5 Tests** : les tests Playwright existants (accueil, interop, produits) passent ou sont mis à jour.

## 5. Critères d'acceptation

- [ ] Sur l'accueil FR et EN, aucune occurrence de « Ekyviti », « Nordigen », « La vigne et le chai », « Samsys » dans la scène ni dans le récit.
- [ ] Les vignes apparaissent à côté du maraîchage, derrière le hangar ; l'étiquette dit « Baqio ».
- [ ] Le moyeu affiche le logo Fourmy, « Le système d'information agricole » et « Fourmy ».
- [ ] Le récit compte 7 chapitres, dont « La vigne », dans l'ordre du §3.2.
- [ ] L'inventaire du kit liste les 196 fichiers sources et les éléments extraits.
- [ ] Le schéma du système utilise le kit ; navigation clavier et lecteur d'écran fonctionnent comme avant.
- [ ] Le tableau des connecteurs ne montre que Fourmy et Lyvre, avec l'état de chaque ligne.
- [ ] Plus aucun compteur chiffré de connecteurs sur le site ; plus aucune mention des plugins Ekylibre (Samsys, Qonto, HVE, IDEA…).

## 6. Prérequis et points restants

- **Inkscape 1.4.4** est installé en snap (`/snap/bin/inkscape`). Le confinement snap lui donne un `/tmp` privé et lui refuse les dossiers cachés : les fichiers à lire et à écrire doivent se trouver dans le dossier personnel, hors dossiers cachés (ex. `~/Documents/…` ou le dépôt).
- **Orthographe « Baoba »** : à confirmer avant publication.
- **Bandeau de chiffres** : tranché en conception (`docs/design/04-accueil-kit-connecteurs.md`, D35) — « 4 logiciels libres, un seul système ».
