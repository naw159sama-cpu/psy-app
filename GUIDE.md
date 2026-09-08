# Guide de prise en main

Application de gestion du cabinet. Tout est en français, tout tient dans le téléphone.

## 1. L'installer sur le téléphone

1. Ouvrir l'adresse de l'application dans **Chrome** (Android) ou **Safari** (iPhone).
2. Android : menu `⋮` → **Ajouter à l'écran d'accueil**.
   iPhone : bouton Partager → **Sur l'écran d'accueil**.
3. Une icône verte apparaît. Elle s'ouvre comme une vraie application, même sans connexion.

## 2. Les cinq écrans

| Onglet | À quoi il sert |
|---|---|
| **Ma journée** | Ce qu'il y a à faire aujourd'hui : les 4 créneaux, ce qui reste à encaisser, les notes en retard. |
| **Agenda** | La semaine entière, du samedi au mardi. Flèches pour changer de semaine. |
| **Patients** | Tous les dossiers, avec recherche et filtres. |
| **Argent** | Mois par mois : ma part, la part du cabinet, ce qui reste à encaisser. |
| **Bilan** | Les chiffres : remplissage, absences, évolution sur six mois. |

## 3. Les gestes du quotidien

**Noter une séance** — Onglet *Ma journée* → toucher le créneau → *Effectuée* → écrire dans le cadre.
La note s'enregistre toute seule, il n'y a rien à valider.

**Encaisser** — Dans la même fiche, *Marquer comme payée*, puis le moyen de paiement.
Depuis l'onglet *Argent*, le bouton **Encaissé** fait la même chose en un seul geste.

**Ajouter un rendez-vous** — Toucher un créneau libre → choisir le patient, ou *Nouveau patient*.

**Absence ou annulation** — Ouvrir la séance et choisir :

- *Annulée à temps* → rien à payer ;
- *Annulée tard* et *Absence* → la séance reste due.

**Déplacer un rendez-vous** — Dans la fiche de la séance, section *Déplacer* : changer le jour ou l'heure.
L'application refuse si le créneau est déjà pris.

## 4. Masquer les noms

Le bouton **œil** en haut à droite floute tous les noms de patients. À utiliser quand
quelqu'un regarde l'écran. Sur ordinateur : `Ctrl + M`. Rappuyer pour réafficher.

## 5. Sauvegarder — important

Les données sont **uniquement** dans ce téléphone. Téléphone perdu ou cassé sans sauvegarde
= dossiers perdus.

Une fois par semaine : *Réglages* (roue dentée) → **Sauvegarder**. Un fichier
`sauvegarde-cabinet-AAAA-MM-JJ.json` est téléchargé — l'envoyer sur une adresse mail
personnelle ou le copier sur un ordinateur.

Pour restaurer sur un nouveau téléphone : installer l'application, puis
*Réglages* → **Restaurer** → choisir le fichier.

## 6. Changer les réglages

Dans *Réglages* : le prix de la séance (6 000 DA), le partage avec le cabinet (50/50),
les jours travaillés, les horaires des créneaux, la taille du texte.

Un patient peut avoir un tarif à lui : ouvrir son dossier → *Prix de la séance pour ce patient*.

> Modifier le tarif ou le partage ne change **que les séances à venir**. Les séances
> déjà enregistrées gardent le prix qui s'appliquait ce jour-là — l'historique reste juste.

## 7. Essayer sans risque

*Réglages* → **Charger des données de démonstration** remplit l'application avec six dossiers
fictifs nommés « Démo ». Pour repartir de zéro : *Réglages* → **Effacer toutes les données**.

---

# Publier l'application sur GitHub Pages

À faire une seule fois. Ensuite, chaque modification envoyée sur GitHub met le
site à jour toute seule.

1. Créer un dépôt **public** sur GitHub, nommé par exemple `psy-app`.
   (Pages est gratuit sur les dépôts publics ; sur un dépôt privé il faut un
   abonnement payant. Le code est public, **pas les données** : celles-ci ne
   quittent jamais le téléphone.)

2. Depuis le dossier du projet :

   ```bash
   git remote add origin https://github.com/VOTRE-NOM/psy-app.git
   git branch -M main
   git push -u origin main
   ```

3. Sur GitHub : onglet **Settings** → **Pages** → dans « Source », choisir
   **GitHub Actions**. Rien d'autre à configurer.

4. Onglet **Actions** : la publication démarre toute seule et prend une à deux
   minutes. À la fin, l'adresse s'affiche :

   ```
   https://VOTRE-NOM.github.io/psy-app/
   ```

C'est ce lien à envoyer à la psychologue. Il est en `https`, donc elle peut
l'ajouter à son écran d'accueil et l'application fonctionnera ensuite sans
connexion.

## Mettre à jour plus tard

```bash
git add -A
git commit -m "ce qui a changé"
git push
```

Le site se reconstruit tout seul. Les données déjà saisies sur son téléphone
sont conservées : elles vivent dans le téléphone, pas dans le site.
