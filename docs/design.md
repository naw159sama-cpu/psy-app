# Système visuel — « Serene Mind »

Chaleur tactile plutôt que froideur clinique. Fond crème, cartes blanches, encre noire
comme unique accent fort, vert sauge et terre cuite pour les états. Formes très
arrondies, ombres discrètes, jamais de noir pur en aplat de texte ni de blanc glacé.

Tout est défini dans `src/styles.css`, en variables CSS. **Ne jamais écrire une couleur
en dur dans un composant** : passer par une variable ou par une classe existante.

## Couleurs

| Rôle | Variable | Valeur |
|---|---|---|
| Fond de page | `--fond` | `#fff8f3` |
| Cartes | `--blanc` | `#ffffff` |
| Cartes secondaires | `--carte-basse` | `#faf2eb` |
| Conteneurs, blocs d'heure | `--conteneur` | `#f4ece6` |
| Pastilles neutres | `--conteneur-max` | `#e9e1da` |
| Carte de décompression | `--lin` | `#f0e8e0` |
| **Accent fort** | `--encre` / `--encre-douce` | `#040505` / `#1e1e1e` |
| Texte | `--texte` / `--texte-doux` | `#1e1b17` / `#444748` |
| Contours | `--contour` / `--contour-doux` | `#c4c7c7` / `rgba(4,5,5,.06)` |
| Fait, réussi | `--sauge` et dérivés | `#56633a`, `#dbe4cd`, `#bdcd9a` |
| Urgent, en retard | `--terre-pale` / `--terre-texte` | `#ffdbd2` / `#723525` |
| Argent en attente | `--ardoise-pale` / `--ardoise-texte` | `#e2e7ef` / `#24354c` |

**L'encre est l'accent unique.** Elle porte le bouton flottant, l'onglet actif, la carte
de séance en cours et la carte des honoraires. Tout le reste reste crème et sourd. Ne pas
multiplier les surfaces noires sur un même écran : au plus deux.

## Typographie

Plus Jakarta Sans, chargée depuis Google Fonts avec repli système. Hors connexion,
le repli s'applique — le texte reste lisible, c'est un compromis assumé.

| Usage | Taille | Graisse |
|---|---|---|
| Salutation, titre d'écran | 1.6rem | 600, `-0.018em` |
| Titre de section, nom en carte sombre | 1.32rem | 600 |
| Nom de patient en carte | 1.05rem | 600 |
| Texte courant | .9rem | 400 |
| Métadonnées, étiquettes | .78rem | 500 |

La salutation mélange deux graisses dans une même phrase : « **Bonjour,** Sophie. » —
gras pour l'accroche, régulier pour le prénom (`.accueil-titre .leger`).

## Formes

Cartes 24 px, cartes d'accueil et sombres 28 px, tâches 20 px, champs 16 px,
tout ce qui est interactif et court est une pilule complète. Avatars et pastilles
d'icône sont des cercles parfaits (40 à 44 px).

## Élévations

| Niveau | Variable | Usage |
|---|---|---|
| Repos | `--ombre-fine` | cartes de liste, champs |
| Survol | `--ombre-carte` | carte soulevée au doigt |
| Mise en avant | `--ombre-forte` | séance en cours, carte des honoraires, feuille modale |
| Action | `--ombre-fab` | bouton flottant |

## Composants clés

- **`.carte-accueil`** — la synthèse du jour : surtitre, salutation, phrase de contexte,
  puis une rangée de bulles chiffrées défilables (`.bulle.verte`, `.rouge`, `.bleue`).
- **`.carte-seance`** — bloc d'heure à gauche, nom + pastille d'état, motif, bouton rond
  à droite. **Une seule pastille par carte.**
- **`.carte-active`** — la séance en cours, en encre : point vert pulsant, badge
  « En consultation », minutes restantes, bouton clair vers le dossier.
- **`.carte-tache`** — cercle à cocher qui exécute l'action directement (encaisser), texte
  sur deux lignes maximum, étiquette d'échéance à droite.
- **`.carte-somme`** — les honoraires du mois en encre, avec jauge d'encaissement.
- **`.carte-souffle`** — le sas de décompression, ouvre trois minutes de respiration guidée.

## Animations

Écrites à la main, sans librairie. Entrée en cascade des sections (`.contenu > *`),
des listes (`.pile`, `.pile-taches`) ; ressort sur les appuis ; onde qui pulse sur la
séance en cours ; compteur qui défile sur les montants (`useCompteur`) ; jauges et barres
qui se déplient à l'affichage.

Tout est neutralisé sous `prefers-reduced-motion: reduce`.

## Règles à tenir

- Les noms de classes sont en français, comme le reste du code.
- Cibles tactiles d'au moins 44 px de haut.
- Le mode discrétion (`.flou`) floute les noms de patients, jamais les montants ni les
  horaires : c'est l'identité qu'on protège d'un regard, pas la comptabilité.
- Les états d'une séance ont un vocabulaire visuel fixe : `faite` (sauge), `avenir`
  (neutre), `attente` (terre), `alerte` (rouge pâle), `gris` (annulée à temps).
