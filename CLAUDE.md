# Consignes pour ce projet

Application mobile de gestion d'un cabinet de psychologie, à Alger. Lire le
[README](README.md) pour l'architecture et [GUIDE.md](GUIDE.md) pour l'usage réel.

## Contexte métier

Une praticienne seule. Séance 6 000 DA partagée 50/50 avec le cabinet. Samedi, dimanche,
lundi, mardi ; quatre créneaux fixes par jour. Montants en dinars algériens (DA).

L'utilisatrice n'est pas technique. Elle utilise l'application entre deux séances, debout,
sur un téléphone. Chaque écran doit se comprendre sans explication.

## Commandes

```bash
npm run dev      # serveur de développement, port 5183
npm test         # tests des règles d'argent et de dates
npm run build    # vérifie les types puis construit dist/
npx tsc --noEmit # vérification des types seule
```

Les tests utilisent le lanceur intégré de Node (aucune dépendance). Toute modification de
`src/lib/argent.ts` ou `src/lib/dates.ts` doit être couverte par un test **avant** le code.

## Conventions de code

- **Tout est en français** : noms de variables, de fonctions, de fichiers, commentaires,
  textes affichés. Pas de mélange franglais.
- React + TypeScript strict, pas de `any`.
- **Aucune nouvelle dépendance** sans raison forte. Pas de routeur, pas de librairie de
  composants, de dates ou de graphiques : ils sont écrits à la main et doivent le rester.
- Les styles vivent dans `src/styles.css`, avec des classes en français. Les variables CSS
  portent la palette ; ne pas écrire de couleur en dur dans un composant.
- L'état passe par `src/lib/store.ts` (`useDonnees()` en lecture, fonctions dédiées en
  écriture). Pas de state global parallèle.
- Cibles tactiles d'au moins 44 px de haut.

## Règles non négociables

- Une séance fige `tarif` et `partPsyPct` à sa création. Changer les réglages ne doit
  jamais modifier une séance déjà enregistrée.
- `partCabinet = tarif − partPsy`, par soustraction, jamais par un second arrondi.
- Une séance non due (`annule_delai`, `prevu`) ne peut pas être marquée payée.
- Dates au format `YYYY-MM-DD` en heure locale via `src/lib/dates.ts`. Ne jamais utiliser
  `toISOString()` pour produire une date affichée ou stockée.
- Aucune donnée patient dans `console.log`, aucun appel réseau, aucune télémétrie,
  aucun service tiers.
- Toute suppression demande une confirmation explicite dans l'interface.
- Les données de démonstration portent le nom « Démo » et ne doivent jamais ressembler
  à de vrais dossiers.

## Écueils connus

- `localStorage` peut être vidé par le navigateur. La sauvegarde manuelle est le seul
  filet : ne pas dégrader ce parcours.
- La semaine de travail commence le **samedi** (`debutSemaine()`), pas le lundi.
- `getDay()` : 0 = dimanche, 6 = samedi. `joursTravail` est stocké dans ce format.
