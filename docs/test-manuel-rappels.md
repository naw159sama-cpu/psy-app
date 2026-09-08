# Test manuel des rappels — à exécuter sur de vrais appareils

L'ouverture de WhatsApp depuis une application web installée est le point qui
casse le plus souvent, et il ne se teste pas en émulation. Cette procédure doit
être passée sur **un iPhone, un Android et un ordinateur** avant de se fier à la
fonctionnalité.

Compter vingt minutes. Utiliser les **données de démonstration**, jamais un vrai
dossier : les messages partiraient pour de bon.

## Préparation, une fois par appareil

1. Réglages → **Charger des données de démonstration**.
2. Réglages → **Rappels aux patients** : vérifier que l'indicatif affiche
   `0551 23 45 67 → 213551234567`.
3. Renseigner une signature (votre prénom) et une adresse.
4. Ouvrir le dossier **Amina Démo** et remplacer son numéro par **le vôtre**,
   au format local. C'est vous qui recevrez les messages de test.

## Parcours à passer sur chaque appareil

| # | Geste | Attendu |
|---|---|---|
| 1 | Accueil : la carte « rappels à envoyer » | Elle est là, avec le bon nombre |
| 2 | L'ouvrir | L'avertissement Meta s'affiche la première fois seulement |
| 3 | Toucher **Ouvrir WhatsApp** | WhatsApp s'ouvre sur la conversation, message pré-rempli, **rien n'est envoyé** |
| 4 | Revenir dans l'application | La proposition « Marquer comme envoyé » est visible |
| 5 | Marquer comme envoyé | La pastille passe à « Envoyé », le compteur avance |
| 6 | Attendre 8 secondes | Le bouton d'annulation disparaît |
| 7 | Recommencer, puis annuler dans les 8 s | La pastille repasse à « À envoyer » |
| 8 | Toucher le crayon, modifier le texte, ouvrir WhatsApp | Le texte modifié est bien celui qui arrive |
| 9 | Toucher **Par SMS** | L'application Messages s'ouvre, corps pré-rempli |
| 10 | Toucher **Copier** | « Copié » s'affiche ; coller ailleurs redonne le message |
| 11 | Écrire un message de plus de 1000 caractères | L'alerte de longueur apparaît sous le champ |
| 12 | Ouvrir le dossier de **Karim Démo** (mineur) | Le rappel vise le numéro de sa mère, « via Farida Démo » |
| 13 | Section « Non rappelés » | Nadia y figure avec « Pas de numéro renseigné » |

## Les pièges connus, à surveiller particulièrement

**iOS.** L'ouverture en nouvel onglet est parfois bloquée. Le bouton est un vrai
lien `<a>`, pas un `window.open`, ce qui évite le blocage — mais si rien ne se
passe au premier appui, noter le modèle d'iPhone et la version d'iOS.

**Application installée sur l'écran d'accueil.** Tester le parcours **depuis
l'icône**, pas seulement depuis le navigateur : le comportement des liens
sortants diffère en mode autonome. C'est le test le plus important.

**Retour dans l'application.** Sur certains téléphones, revenir depuis WhatsApp
recharge la page. Vérifier alors que la pastille « À envoyer » n'a pas été
perdue et que le compteur est resté juste.

**Numéro sans WhatsApp.** Essayer avec un numéro qui n'a pas de compte : WhatsApp
affiche « le numéro est invalide ». C'est normal et hors de portée de
l'application, qui ne peut pas le savoir à l'avance.

**Ordinateur.** Le lien ouvre WhatsApp Web ; il faut y être connecté. Si un
onglet blanc s'ouvre, c'est que la session WhatsApp Web est expirée.

## Ce qu'il faut noter

Pour chaque appareil : modèle, version du système, navigateur, et le numéro des
étapes qui ont échoué. Une capture d'écran vaut mieux qu'une description.
