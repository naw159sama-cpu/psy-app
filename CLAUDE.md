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
- Le système visuel « Serene Mind » est documenté dans [docs/design.md](docs/design.md).
  L'encre noire est l'accent fort : **au plus deux surfaces sombres par écran**.
- Les icônes sont des SVG maison dans `src/composants/Icones.tsx` (trait 1.5, bouts
  arrondis). Ne pas introduire de police d'icônes : elle casserait l'affichage hors ligne.
- Toute animation ajoutée doit être neutralisée par `prefers-reduced-motion`.
- Les montants passent par `da()` / `montantSeul()` et les pourcentages par `pourcent()` :
  ils portent les espaces insécables de la typographie française.
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

## Règles ajoutées avec le brief et la clôture

- La clôture de séance tient en trois champs : `etatObserve`, `note` (le contenu)
  et `aReprendre`. Le troisième alimente le brief de la séance suivante : ne jamais
  le vider ni le fusionner avec les deux autres.
- `src/lib/suivi.ts` est une fonction pure : elle ne lit que ce qu'on lui passe.
  Toute règle de brief ou d'alerte s'écrit là, avec son test.
- Le brief ne montre jamais plus de trois signalements, et n'en tire aucun d'un
  rythme inférieur à trois jours : en dessous, la médiane ne décrit rien.
- Seules les séances `effectue` nourrissent le brief. Une séance annulée ne
  transmet pas son compte rendu.
- Les panneaux se ferment par `useGlissement` : glissement, bouton, fond, Échap.
  Ne pas réintroduire d'écouteurs souris seuls, ni d'animation d'ouverture en
  `fill-mode: both` — elle écraserait le déplacement du doigt.
- La grille du mois commence le lundi (semaines ISO), alors que la semaine de
  travail commence le samedi. Les deux règles coexistent : `debutGrille()` pour
  le mois, `debutSemaine()` pour la semaine.

## Règles des rappels

- L'application **n'envoie rien**. Elle prépare un lien `wa.me` et l'utilisatrice
  appuie. Ne jamais laisser entendre dans l'interface que l'envoi est confirmé.
- Le lien est calculé **au rendu**, jamais dans le gestionnaire de clic, et posé
  sur un vrai `<a>`. Aucun `await`, aucun `setTimeout`, aucun `window.open`
  avant l'ouverture : le contexte d'action utilisateur serait perdu.
- Aucun modèle ne doit trahir la nature du rendez-vous. Le test
  `aucun modèle par défaut ne trahit…` garde cette règle.
- Sans `canalRappel` explicite, aucun rappel n'est proposé. Le défaut est
  `aucun`, et il le reste.
- Un dossier de moins de 18 ans écrit au représentant légal, jamais au mineur.
- Le journal des rappels ne contient **jamais** le texte du message : patient,
  séance, date, modèle, statut, rien de plus.
- Toute règle de numéro s'écrit dans `src/lib/telephone.ts`, avec son test.

## Règles des thèmes de consultation

- Le `motif` reste un texte libre : il ne doit jamais devenir une liste fermée.
  Les `themes` sont l'autre besoin, celui de compter, et vivent à côté.
- Une fiche sans thème n'en reçoit **jamais** d'office. `themesDeduits()` devine
  d'après le motif pour l'affichage du nuage, sans rien écrire dans le dossier.
- Dans le nuage, l'**aire** du disque est proportionnelle à l'effectif — donc le
  rayon suit la racine carrée. Ne jamais faire porter la valeur au diamètre :
  une bulle deux fois plus large paraîtrait quatre fois plus nombreuse.
- La longueur d'une jauge de légende ne dit que l'effectif : `.legende-nom`
  garde une largeur fixe pour que toutes partent du même bord.
- Le filtre par statut s'applique au nuage comme à la liste. Un chiffre affiché
  doit toujours pouvoir être retrouvé en touchant sa bulle.
- Les teintes viennent de `--bulle-0` à `--bulle-9`, posées par les classes
  `.tb0` à `.tb9`. Un thème garde sa teinte quand les effectifs changent.

## Règles de « Mon espace »

- Cette section est pour la praticienne, pas pour ses patients. Rien n'y est
  enregistré : aucun exercice ne laisse de trace dans le store.
- Un exercice se déduit **entièrement du temps écoulé**, relu à l'horloge
  (`Date.now()`). Ne jamais recompter au fil des battements : c'est ce qui
  faisait rester la respiration sur « Inspirez » pendant trois minutes.
- Deux formes, et deux seulement : `phases` (respiration, en boucle jusqu'à
  `minutes`) ou `etapes` (guidé, joué une fois). Jamais les deux, le test
  `chaque exercice est jouable…` le vérifie.
- La durée d'animation du cercle suit celle du temps en cours. Une valeur figée
  dans la feuille de style ferait mentir le geste dès qu'un temps change.
- Les textes ne prescrivent rien de clinique et ne promettent aucun effet.
  « Sans forcer, et sans jamais aller dans la douleur » pour tout ce qui touche
  au corps.

## Règles du coffre en ligne

- **Le téléphone écrit toujours en premier.** Une modification est enregistrée
  en local, puis envoyée. Jamais l'inverse : elle doit pouvoir travailler dans
  une pièce sans réseau sans s'en apercevoir.
- **Un document vide ne remplace jamais un document plein**, quelle que soit sa
  date (`quelGarder`). Une mémoire de navigateur effacée ou un coffre neuf ne
  doivent pas pouvoir emporter des dossiers. Deux tests gardent cette règle.
- Le perdant d'un conflit part dans `coffre_historique` **avant** d'être
  remplacé. Rien n'est jamais écrasé sans copie.
- L'écriture est conditionnée à la version connue (`version=eq.n` dans l'URL) :
  c'est PostgreSQL qui refuse une écriture périmée, pas l'application.
- La sécurité repose sur les politiques RLS de `supabase/schema.sql`, jamais sur
  le code de l'application. Une requête mal formée ne doit pas pouvoir lire la
  ligne d'un autre.
- La clé `anon` est publique et vit dans `src/lib/config.ts`. La clé
  `service_role` ne doit apparaître **nulle part** dans ce dépôt.
- `config.ts` vide = mode local, exactement comme avant le coffre. Ce repli doit
  rester : il permet de publier et de développer sans base.
- Pas de bibliothèque Supabase. GoTrue et PostgREST sont deux interfaces HTTP
  documentées ; `src/lib/nuage.ts` les appelle avec `fetch`, et cela doit le
  rester.
- Aucun message d'erreur technique à l'écran : tout passe par `messageErreur`.
- L'export manuel de `Réglages → Sauvegarder` ne disparaît jamais. C'est la
  seule sortie qui ne dépend d'aucun fournisseur.

## Écueils connus

- **Ne jamais modifier une `ref` dans une fonction de mise à jour d'état.**
  React peut rejouer la file de mises à jour — et le fait systématiquement sous
  `StrictMode`. L'effet de bord est alors appliqué deux fois, ou annulé.
  C'était la cause du minuteur de respiration bloqué.

- `localStorage` peut être vidé par le navigateur. La sauvegarde manuelle est le seul
  filet : ne pas dégrader ce parcours.
- La semaine de travail commence le **samedi** (`debutSemaine()`), pas le lundi.
- `getDay()` : 0 = dimanche, 6 = samedi. `joursTravail` est stocké dans ce format.
