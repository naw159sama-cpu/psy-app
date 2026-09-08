# Mon cabinet

Application mobile de gestion pour une psychologue exerçant en cabinet : agenda,
dossiers patients, notes de séance, suivi des honoraires et partage avec le cabinet.

Interface en français, montants en dinars algériens. Voir [GUIDE.md](GUIDE.md) pour
l'utilisation quotidienne.

## Le cadre métier

- **Une seule praticienne**, pas de compte partagé.
- **Séance à 6 000 DA**, partagée moitié-moitié : 3 000 DA pour elle, 3 000 DA pour le cabinet.
- **Quatre jours** travaillés : samedi, dimanche, lundi, mardi.
- **Quatre créneaux fixes** par jour : 09:00–10:30, 11:00–12:30, 13:30–15:00, 15:00–16:30.

Tout cela est modifiable dans l'écran Réglages — rien n'est figé dans le code.

## Lancer le projet

```bash
npm install
npm run dev
npm test
```

Les tests couvrent les règles d'argent et de dates — le partage 50/50, les arrondis, les
séances dues, la semaine commençant le samedi. Ils tournent avec le lanceur intégré de
Node, sans aucune dépendance de test.

Puis `npm run build` pour la version de production (dossier `dist/`), à déposer sur
n'importe quel hébergement de fichiers statiques. Le service worker rend l'application
utilisable hors connexion une fois installée.

## L'identité visuelle — « Serene Mind »

Le système de design est décrit dans [docs/design.md](docs/design.md) : fond crème chaud,
cartes blanches, **encre noire comme unique accent fort**, vert sauge pour ce qui est fait
et terre cuite pour ce qui presse. Typographie Plus Jakarta Sans, formes très arrondies,
ombres discrètes.

Les animations sont écrites à la main dans `src/styles.css` et respectent
`prefers-reduced-motion`.

## Comment c'est fait

React + TypeScript, construit par Vite. Aucune dépendance en dehors de React :
pas de routeur, pas de librairie de composants, pas de librairie de dates ni de
graphiques. C'est volontaire — le projet doit rester réparable dans trois ans.

La typographie Plus Jakarta Sans vient de Google Fonts ; hors connexion, l'application
retombe sur la police système sans rien casser. Les icônes sont des SVG écrits à la main,
donc toujours disponibles hors ligne.

Les données vivent dans le `localStorage` du navigateur, sérialisées en un seul objet
JSON. Pas de serveur, pas de compte, rien qui sorte du téléphone. La sauvegarde est
un export JSON manuel depuis les Réglages.

```
src/
  lib/
    types.ts      Le modèle : Patient, Seance, Reglages
    store.ts      Lecture/écriture, abonnement React, export/import
    argent.ts     Règles de facturation et de partage (le cœur sensible)
    dates.ts      Dates en heure locale, semaine commençant le samedi
    affichage.ts  Libellés français, masquage des noms
    demo.ts       Jeu de démonstration, patients nommés « Démo »
  composants/     Feuilles modales, liste de créneaux, icônes, compteur animé
  ecrans/         Un fichier par onglet
```

## Règles à ne pas casser

- **Une séance fige son tarif et son partage à la création.** Changer les réglages ne doit
  jamais réécrire l'historique financier.
- **Seules les séances dues comptent** : effectuée, annulée tard, absence. Une annulation
  dans les délais ne se facture pas et ne peut pas être marquée payée.
- **Part cabinet = tarif − part praticienne**, calculée par soustraction pour que les deux
  parts fassent toujours exactement le tarif, sans dinar perdu à l'arrondi.
- **Les dates sont manipulées en `YYYY-MM-DD` local**, jamais via `toISOString()`, qui
  décale d'un jour selon le fuseau.
- **Aucune donnée patient dans les logs**, aucun appel réseau, aucune télémétrie.

## Ce qui n'est pas fait



Génération de documents PDF (attestations, reçus), rappels automatiques par SMS,
pièces jointes dans les dossiers, chiffrement des données au repos, verrouillage
par code à l'ouverture. Le stockage local n'est pas chiffré : le verrouillage
d'écran du téléphone est aujourd'hui la seule protection.
