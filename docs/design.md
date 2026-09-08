# Cabinet Serein — système visuel

Le contraire d'un logiciel médical froid. Surfaces tactiles et rassurantes, menthe et crème,
teals minéraux, corail employé avec parcimonie. Tout est implémenté dans
[`src/styles.css`](../src/styles.css) sous forme de variables CSS et de classes en français.

## Principes

1. **Apaisement cognitif** — beaucoup de blanc, padding généreux, densité d'information
   faible. L'application est utilisée entre deux séances par quelqu'un de fatigué.
2. **Un seul corail par écran** — le corail est le point focal. Il est réservé au bouton
   flottant (« Nouveau rendez-vous », « Nouveau patient ») ou, sur l'écran Argent, à la
   ligne « Reste dû ». Jamais deux à la fois.
3. **Dignité discrète** — les données cliniques et financières se signalent par des pastilles
   douces, jamais par des alertes agressives.
4. **Chaleur humaniste** — contours arrondis, ombres diffuses teintées, pastilles en gélule,
   100 % de vocabulaire français.

## Couleurs

| Rôle | Variable | Valeur |
|---|---|---|
| Fond de page | `--menthe` | `#DCEAE8` |
| Cartes et surfaces | `--creme` | `#FDFAF6` |
| Teal principal | `--teal` | `#4F8C8A` |
| Teal profond | `--teal-profond` | `#3D7573` |
| Teal clair | `--teal-clair` | `#A8CFCB` |
| Teal du dégradé hero | `--primaire` / `--primaire-conteneur` | `#256564` / `#417E7C` |
| Corail (point focal) | `--corail` | `#EF7A5D` |
| Corail pâle | `--corail-pale` | `#FBE4DC` |
| Texte principal | `--texte` | `#2E4A4C` |
| Texte secondaire | `--texte-doux` | `#8AA3A4` |

Ni noir pur ni blanc pur, nulle part.

## Typographie

**Plus Jakarta Sans**, chargée depuis Google Fonts, avec repli sur la police système —
hors connexion l'application reste lisible. Titres en `600`, texte courant en `400`,
interlignage généreux (1,55).

Typographie française appliquée dans le code : `da()` et `pourcent()`
([`src/lib/format.ts`](../src/lib/format.ts)) insèrent une espace fine insécable entre les
milliers et une espace insécable avant l'unité, pour qu'un montant ne se coupe jamais en
fin de ligne.

## Formes et profondeur

- Cartes : rayon `20px` (`--r-carte`), carte hero `24px`, champs `16px`.
- Boutons, pastilles, filtres : gélules complètes (`9999px`).
- Trois niveaux d'élévation (`--niv1`, `--niv2`, `--niv3`) plus une ombre corail dédiée au
  bouton flottant. Ombres teintées de vert-gris, jamais noires.
- Icônes : SVG écrits à la main, trait `1.5px`, extrémités arrondies, sur `viewBox` 24.

## Animations

Toutes écrites à la main, sans librairie. Deux courbes seulement : `--sortie` pour les
entrées et déplacements, `--ressort` pour les retours tactiles.

| Endroit | Effet |
|---|---|
| Entrée d'écran | Montée + fondu, en cascade sur les blocs (`.contenu > *`) |
| Créneaux et listes | Même cascade, décalée de 40 ms par élément |
| Montants (hero, cartes) | Défilement chiffré depuis la valeur précédente (`useCompteur`) |
| Jauges et barres | Croissance depuis la gauche / le bas |
| Feuille modale | Glissement depuis le bas, voile en fondu avec flou |
| Appui sur un bouton | Léger enfoncement (`scale`) |
| Encaissement validé | Pulsation + halo teal autour du bouton |
| Onglet actif | Gélule teal, icône qui rebondit |
| Bulles du hero | Respiration lente et continue |

`prefers-reduced-motion: reduce` neutralise l'ensemble : une règle globale ramène toutes
les durées à zéro. C'est un réglage d'accessibilité, pas une option — ne pas le retirer.

## Composants et classes

| Classe | Usage |
|---|---|
| `.barre-haut` | Barre d'identité fixe : monogramme, nom du cabinet, œil, cloche, réglages |
| `.titre-page` + `.surtitre` | Surtitre en capitales + titre d'écran |
| `.carte-hero` | Le grand bloc teal avec dégradé, bulles et jauge |
| `.duo-cartes` / `.carte-stat` | Deux cartes chiffrées côte à côte |
| `.carte` + `.rang` | Liste de détail, une ligne par information |
| `.creneau` | Créneau d'agenda ; variantes `.en-cours`, `.passee`, `.libre` |
| `.carte-ligne` | Ligne cliquable : monogramme, texte, action à droite |
| `.puce` | Pastille d'état (`ok`, `attente`, `alerte`, `neutre`, `gris`) |
| `.fab` | Le bouton corail flottant — un seul par écran |
| `.note-confidentielle` | Panneau corail pâle pour le sensible et les avertissements |
| `.feuille` | Panneau modal qui monte du bas |
