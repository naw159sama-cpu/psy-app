# Mettre l'application en service

Ce document décrit la seule opération qui ne peut pas être automatisée : créer
la base de données en ligne et le compte de la praticienne. Compter vingt
minutes, une seule fois.

Tout le reste — construction, publication, mises à jour — se fait tout seul à
chaque `git push`.

---

## Ce que l'on met en place

Les dossiers ne vivent plus sur le téléphone. Ils vivent dans une base
PostgreSQL hébergée par **Supabase**, et le téléphone n'en garde qu'une copie
de travail. Conséquences :

- un téléphone perdu, cassé ou réinitialisé ne fait perdre aucun dossier ;
- l'application continue de fonctionner **sans réseau**, et se resynchronise
  en revenant ;
- les données restent du PostgreSQL ordinaire : exportables et transportables
  ailleurs à tout moment, sans rien demander à personne.

L'offre gratuite suffit largement à ce volume et ne demande pas de carte
bancaire. Deux limites à connaître :

- un projet gratuit **se met en veille après sept jours sans aucun usage**.
  Il se réveille en un clic depuis le tableau de bord, sans perte de données.
  Avec quatre journées de consultation par semaine, cela n'arrive qu'en
  vacances ;
- l'offre gratuite ne conserve pas de sauvegardes automatiques côté Supabase.
  C'est pourquoi l'application tient elle-même un historique daté, et pourquoi
  l'export manuel reste en place.

---

## 1. Créer le projet Supabase

1. Aller sur **supabase.com** → *Start your project* → créer un compte
   (avec GitHub, c'est le plus rapide).
2. *New project*. Renseigner :
   - **Name** : `cabinet-psy`
   - **Database Password** : laisser Supabase en générer un, **et le ranger
     dans un gestionnaire de mots de passe**. Il ne sert pas à l'application,
     mais il est irremplaçable si un jour vous voulez récupérer la base
     directement.
   - **Region** : `Europe (Frankfurt)` ou `Europe (Paris)` — le plus proche
     d'Alger, donc le plus rapide.
3. Attendre deux minutes que le projet soit prêt.

## 2. Créer les tables

1. Menu de gauche → **SQL Editor** → *New query*.
2. Coller **tout** le contenu de [`supabase/schema.sql`](../supabase/schema.sql).
3. Cliquer sur **Run**. Le message attendu est `Success. No rows returned`.

## 3. Fermer les inscriptions

Sans cela, n'importe qui connaissant l'adresse du site pourrait se créer un
compte. Il ne verrait aucun dossier — la base l'interdit — mais autant fermer
la porte.

1. Menu de gauche → **Authentication** → **Sign In / Providers** → *Email*.
2. Décocher **Allow new users to sign up**. Enregistrer.
3. Toujours dans *Email* : décocher **Confirm email** si vous créez le compte
   vous-même à l'étape suivante (sinon elle recevra un lien de confirmation à
   valider avant de pouvoir se connecter).

## 4. Créer le compte de la praticienne

1. **Authentication** → **Users** → *Add user* → *Create new user*.
2. Son adresse e-mail, et un mot de passe provisoire que vous lui
   transmettez de vive voix — pas par écrit.
3. Elle le changera elle-même à la première connexion, depuis
   **Réglages → Mon compte**.

## 5. Donner les deux clés à l'application

1. Menu de gauche → **Project Settings** → **API**.
2. Relever :
   - **Project URL** — de la forme `https://xxxxxxxx.supabase.co`
   - **anon / public** — une longue clé commençant par `eyJ...`
3. Les reporter dans [`src/lib/config.ts`](../src/lib/config.ts).

> **La clé `anon` est faite pour être publique.** Elle se trouve dans le code
> de toute application Supabase et ne donne accès à rien par elle-même : c'est
> la règle de sécurité posée à l'étape 2 qui protège les dossiers.
>
> **La clé `service_role`, elle, ne doit jamais quitter le tableau de bord.**
> Celle-là passe outre toutes les règles. Ne la mettez nulle part dans le code,
> ne l'envoyez à personne.

## 6. Publier

```bash
npm run build
git add -A
git commit -m "Branche l'application sur sa base en ligne"
git push
```

Deux minutes plus tard, l'application en ligne demande une connexion.

## 7. Installer sur son téléphone

1. Ouvrir l'adresse dans **Chrome** (Android) ou **Safari** (iPhone).
2. Se connecter avec son adresse et son mot de passe.
3. Menu du navigateur → **Ajouter à l'écran d'accueil**.

L'icône se comporte comme une application : plein écran, sans barre d'adresse,
et elle fonctionne sans réseau.

---

## Reprendre ses données un jour

C'est la question qui compte pour des dossiers tenus sur une carrière. Trois
sorties, dans l'ordre de simplicité :

1. **Réglages → Sauvegarder** dans l'application : un fichier `.json` lisible,
   qui contient tout.
2. **Supabase → Table Editor → coffre → Export CSV** : le même contenu, depuis
   le tableau de bord.
3. **La base entière**, avec le mot de passe rangé à l'étape 1 :
   `pg_dump` sur la chaîne de connexion donnée dans *Project Settings →
   Database*. Le fichier obtenu se remonte sur n'importe quel PostgreSQL, chez
   n'importe quel hébergeur.

Aucune de ces trois sorties ne dépend de l'application ni de moi.

## Le jour où l'offre gratuite ne suffit plus

Rien à changer dans le code. Dans le tableau de bord Supabase, passer le projet
en offre *Pro* (25 $ par mois) : plus de mise en veille, et des sauvegardes
automatiques conservées sept jours. Le passage se fait sans interruption.
