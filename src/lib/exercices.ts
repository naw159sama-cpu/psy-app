/**
 * Mon espace — les exercices courts que la praticienne peut faire pour
 * elle-même, entre deux séances.
 *
 * Deux formes seulement : une respiration guidée, qui tourne en boucle sur
 * quelques temps jusqu'à la fin du minuteur, et une suite d'étapes, qui se
 * déroule une fois puis s'arrête. Tout le reste — position, temps restant,
 * étape en cours — se recalcule à partir du temps écoulé. Rien ne s'accumule,
 * donc rien ne peut se désynchroniser.
 */

/** Un temps de respiration. Le geste commande l'animation du cercle. */
export interface Phase {
  libelle: string
  secondes: number
  geste: 'inspire' | 'tenu' | 'expire'
}

/** Une étape d'un exercice guidé. */
export interface Etape {
  titre: string
  texte: string
  secondes: number
}

export type Famille = 'sauge' | 'ardoise' | 'terre' | 'ambre' | 'violet' | 'peche'

export interface Exercice {
  id: string
  nom: string
  /** Ce que c'est, en quelques mots. */
  sous: string
  /** Quand y venir. C'est ce qui décide du choix, plus que la technique. */
  quand: string
  famille: Famille
  groupe: 'respirer' | 'se-poser'
  /** Respiration : les temps, répétés jusqu'à `minutes`. */
  phases?: Phase[]
  minutes?: number
  /** Guidé : les étapes, jouées une fois. */
  etapes?: Etape[]
}

export const EXERCICES: Exercice[] = [
  {
    id: 'coherence',
    nom: 'Cohérence cardiaque',
    sous: 'Cinq secondes d’un côté, cinq de l’autre',
    quand: 'Le repère le plus solide. Trois fois par jour, six respirations par minute.',
    famille: 'sauge',
    groupe: 'respirer',
    minutes: 5,
    phases: [
      { libelle: 'Inspirez', secondes: 5, geste: 'inspire' },
      { libelle: 'Expirez', secondes: 5, geste: 'expire' },
    ],
  },
  {
    id: 'apaisement',
    nom: 'Respiration apaisante',
    sous: 'Quatre temps, quatre temps, six temps',
    quand: 'L’expiration plus longue que l’inspiration : c’est elle qui fait redescendre.',
    famille: 'ardoise',
    groupe: 'respirer',
    minutes: 3,
    phases: [
      { libelle: 'Inspirez', secondes: 4, geste: 'inspire' },
      { libelle: 'Retenez', secondes: 4, geste: 'tenu' },
      { libelle: 'Expirez', secondes: 6, geste: 'expire' },
    ],
  },
  {
    id: 'carree',
    nom: 'Respiration carrée',
    sous: 'Quatre temps rigoureusement égaux',
    quand: 'Quand la tête s’emballe : quatre temps identiques donnent quelque chose à suivre.',
    famille: 'violet',
    groupe: 'respirer',
    minutes: 3,
    phases: [
      { libelle: 'Inspirez', secondes: 4, geste: 'inspire' },
      { libelle: 'Retenez', secondes: 4, geste: 'tenu' },
      { libelle: 'Expirez', secondes: 4, geste: 'expire' },
      { libelle: 'Poumons vides', secondes: 4, geste: 'tenu' },
    ],
  },
  {
    id: 'soupir',
    nom: 'Le double soupir',
    sous: 'Deux inspirations, une longue expiration',
    quand: 'Le plus rapide. Une minute suffit à faire retomber la tension d’un cran.',
    famille: 'terre',
    groupe: 'respirer',
    minutes: 1,
    phases: [
      { libelle: 'Inspirez par le nez', secondes: 3, geste: 'inspire' },
      { libelle: 'Une seconde inspiration, courte', secondes: 2, geste: 'inspire' },
      { libelle: 'Expirez longuement par la bouche', secondes: 7, geste: 'expire' },
    ],
  },
  {
    id: 'sas',
    nom: 'Sas entre deux séances',
    sous: 'Poser ce qui vient de se dire',
    quand: 'Pour ne pas emmener la séance précédente dans la suivante.',
    famille: 'peche',
    groupe: 'se-poser',
    etapes: [
      {
        titre: 'Ce qui vient de se passer',
        texte: 'En une phrase, pour vous seule. Ce qui a compté dans cette séance.',
        secondes: 25,
      },
      {
        titre: 'Ce qui appartient à la personne',
        texte: 'Son histoire, sa douleur, ses décisions. Vous les avez accompagnées ; elles ne sont pas les vôtres.',
        secondes: 30,
      },
      {
        titre: 'Ce qui vous appartient',
        texte: 'Ce que cette séance a touché chez vous. Le nommer, sans le juger, suffit à le mettre à sa place.',
        secondes: 30,
      },
      {
        titre: 'Ce que vous posez',
        texte: 'S’il reste une question, elle attendra la supervision. Elle n’a pas à être résolue maintenant.',
        secondes: 20,
      },
      {
        titre: 'Revenir ici',
        texte: 'La pièce, la chaise, le prochain prénom. Vous êtes disponible.',
        secondes: 15,
      },
    ],
  },
  {
    id: 'ancrage',
    nom: 'Ancrage 5-4-3-2-1',
    sous: 'Revenir par les cinq sens',
    quand: 'Quand la tête est encore ailleurs et que la suivante attend.',
    famille: 'ambre',
    groupe: 'se-poser',
    etapes: [
      { titre: 'Cinq choses que vous voyez', texte: 'Regardez-les vraiment. Nommez-les intérieurement, une par une.', secondes: 30 },
      { titre: 'Quatre choses que vous entendez', texte: 'Les plus lointaines comptent aussi. La rue, une porte, votre propre souffle.', secondes: 25 },
      { titre: 'Trois choses que vous touchez', texte: 'Le dossier de la chaise, le sol sous vos pieds, le tissu de vos vêtements.', secondes: 25 },
      { titre: 'Deux odeurs', texte: 'Ou, à défaut, deux choses dont vous vous rappelez l’odeur.', secondes: 20 },
      { titre: 'Une chose que vous goûtez', texte: 'Un reste de café, l’air, rien de particulier. Restez-y un instant.', secondes: 20 },
    ],
  },
  {
    id: 'relachement',
    nom: 'Relâchement express',
    sous: 'Contracter, puis lâcher',
    quand: 'Le corps garde ce que la tête a laissé passer.',
    famille: 'sauge',
    groupe: 'se-poser',
    etapes: [
      { titre: 'Les épaules', texte: 'Montez-les vers les oreilles. Serrez cinq secondes… puis laissez tomber d’un coup.', secondes: 25 },
      { titre: 'La mâchoire', texte: 'Serrez les dents quelques secondes, puis desserrez. Laissez la bouche légèrement entrouverte.', secondes: 20 },
      { titre: 'Les mains', texte: 'Fermez les poings, fort. Puis ouvrez grand les doigts et relâchez.', secondes: 20 },
      { titre: 'Le visage', texte: 'Plissez tout — front, yeux, nez. Puis laissez le visage redevenir lisse.', secondes: 20 },
      { titre: 'Tout le corps', texte: 'Une inspiration lente. À l’expiration, laissez le corps peser sur la chaise.', secondes: 25 },
    ],
  },
  {
    id: 'nuque',
    nom: 'Dénouer la nuque',
    sous: 'Pour six heures passées assise',
    quand: 'À faire lentement, sans forcer, et sans jamais aller dans la douleur.',
    famille: 'ardoise',
    groupe: 'se-poser',
    etapes: [
      { titre: 'Oreille vers l’épaule', texte: 'Penchez doucement la tête à droite. Respirez trois fois. Puis à gauche.', secondes: 30 },
      { titre: 'Menton vers la poitrine', texte: 'Laissez le poids de la tête faire le travail. Ne tirez pas.', secondes: 25 },
      { titre: 'Rouler les épaules', texte: 'Cinq tours en arrière, larges et lents. Puis cinq en avant.', secondes: 25 },
      { titre: 'Ouvrir la poitrine', texte: 'Mains derrière le dossier, écartez les épaules. Regardez légèrement vers le haut.', secondes: 25 },
      { titre: 'Les yeux', texte: 'Fermez-les. Posez les paumes dessus, sans appuyer. Le noir complet, quinze secondes.', secondes: 20 },
    ],
  },
  {
    id: 'fin-journee',
    nom: 'Clore la journée',
    sous: 'Quelques questions, et on ferme',
    quand: 'Le soir, avant de quitter le cabinet. Pour que la journée reste au cabinet.',
    famille: 'violet',
    groupe: 'se-poser',
    etapes: [
      { titre: 'Ce qui s’est bien passé', texte: 'Une chose. Même petite. Elle compte autant que le reste.', secondes: 30 },
      { titre: 'Ce qui reste en travers', texte: 'Nommez-le. C’est ce qui n’est pas nommé qui revient le soir.', secondes: 30 },
      { titre: 'Ce que vous laissez ici', texte: 'Les dossiers restent dans le cabinet. Vous, vous rentrez.', secondes: 25 },
      { titre: 'Demain', texte: 'Une seule intention, pas une liste. Puis fermez.', secondes: 20 },
    ],
  },
]

export function trouverExercice(id: string): Exercice | undefined {
  return EXERCICES.find((e) => e.id === id)
}

/** Durée d'un tour de respiration, en secondes. */
export function dureeCycle(phases: Phase[]): number {
  return phases.reduce((t, p) => t + p.secondes, 0)
}

/** Durée totale de l'exercice, en secondes. */
export function dureeTotale(e: Exercice): number {
  if (e.etapes) return e.etapes.reduce((t, s) => t + s.secondes, 0)
  return (e.minutes ?? 0) * 60
}

export interface Position {
  index: number
  /** Secondes restantes dans le temps ou l'étape en cours. */
  reste: number
  /** Secondes déjà passées dans le temps ou l'étape en cours. */
  passe: number
}

/**
 * Où l'on en est dans une suite qui recommence — les temps d'une respiration.
 * Le calcul part du temps écoulé et de rien d'autre : une image sautée ou un
 * téléphone mis en veille ne peuvent pas le décaler.
 */
export function positionCyclique(durees: number[], ecoule: number): Position {
  const total = durees.reduce((t, d) => t + d, 0)
  if (durees.length === 0 || total <= 0) return { index: 0, reste: 0, passe: 0 }
  let reste = ((Math.max(0, ecoule) % total) + total) % total
  for (let i = 0; i < durees.length; i++) {
    if (reste < durees[i]) return { index: i, reste: durees[i] - reste, passe: reste }
    reste -= durees[i]
  }
  return { index: durees.length - 1, reste: 0, passe: durees[durees.length - 1] }
}

/**
 * Où l'on en est dans une suite qui se joue une fois. Au-delà de la dernière
 * étape, `fini` passe à vrai et l'index reste sur la dernière.
 */
export function positionLineaire(
  durees: number[], ecoule: number,
): Position & { fini: boolean } {
  if (durees.length === 0) return { index: 0, reste: 0, passe: 0, fini: true }
  let reste = Math.max(0, ecoule)
  for (let i = 0; i < durees.length; i++) {
    if (reste < durees[i]) return { index: i, reste: durees[i] - reste, passe: reste, fini: false }
    reste -= durees[i]
  }
  const dernier = durees.length - 1
  return { index: dernier, reste: 0, passe: durees[dernier], fini: true }
}
