import { ajouterJours, aujourdhui, isoDeDate } from './dates.ts'

/** Une case de la grille mensuelle. */
export interface CaseMois {
  date: string // YYYY-MM-DD
  /** Faux pour les jours débordant du mois précédent ou suivant. */
  dansLeMois: boolean
  estAujourdhui: boolean
}

export const JOURS_GRILLE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Nombre de jours d'un mois « YYYY-MM », années bissextiles comprises. */
export function joursDuMois(mois: string): number {
  const [a, m] = mois.split('-').map(Number)
  return new Date(a, m, 0).getDate()
}

/** Lundi qui ouvre la semaine du 1er du mois (semaines ISO, lundi en tête). */
export function debutGrille(mois: string): string {
  const [a, m] = mois.split('-').map(Number)
  const premier = new Date(a, m - 1, 1)
  const recul = (premier.getDay() + 6) % 7 // lundi -> 0, dimanche -> 6
  premier.setDate(premier.getDate() - recul)
  return isoDeDate(premier)
}

/**
 * Grille du mois, lundi en première colonne.
 *
 * Toujours 5 ou 6 lignes : jamais moins, pour que la hauteur de l'écran ne
 * saute pas d'un mois à l'autre ; jamais plus que nécessaire.
 * Les dates sont produites par arithmétique calendaire, insensible aux
 * changements d'heure.
 */
export function grilleMois(mois: string, today = aujourdhui()): CaseMois[] {
  const debut = debutGrille(mois)
  const [a, m] = mois.split('-').map(Number)
  const recul = (new Date(a, m - 1, 1).getDay() + 6) % 7
  const lignes = Math.max(5, Math.ceil((recul + joursDuMois(mois)) / 7))

  return Array.from({ length: lignes * 7 }, (_, i) => {
    const date = ajouterJours(debut, i)
    return {
      date,
      dansLeMois: date.slice(0, 7) === mois,
      estAujourdhui: date === today,
    }
  })
}

/** Les trois mois à garder sous la main : précédent, courant, suivant. */
export function moisVoisins(mois: string): [string, string, string] {
  const [a, m] = mois.split('-').map(Number)
  const cle = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return [cle(new Date(a, m - 2, 1)), mois, cle(new Date(a, m, 1))]
}
