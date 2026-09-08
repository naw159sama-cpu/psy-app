export const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
export const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Date -> "YYYY-MM-DD" en heure locale (jamais toISOString, qui décale en UTC). */
export function isoDeDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${j}`
}

export function dateDeIso(iso: string): Date {
  const [a, m, j] = iso.split('-').map(Number)
  return new Date(a, m - 1, j)
}

export function aujourdhui(): string {
  return isoDeDate(new Date())
}

export function ajouterJours(iso: string, n: number): string {
  const d = dateDeIso(iso)
  d.setDate(d.getDate() + n)
  return isoDeDate(d)
}

/** Samedi qui ouvre la semaine de travail contenant `iso`. */
export function debutSemaine(iso: string): string {
  const d = dateDeIso(iso)
  const recul = (d.getDay() + 1) % 7 // samedi -> 0, dimanche -> 1, ...
  d.setDate(d.getDate() - recul)
  return isoDeDate(d)
}

export function jourDeIso(iso: string): number {
  return dateDeIso(iso).getDay()
}

export function dateLongue(iso: string): string {
  const d = dateDeIso(iso)
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`
}

export function dateCourte(iso: string): string {
  const d = dateDeIso(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function moisLibelle(mois: string): string {
  const [a, m] = mois.split('-').map(Number)
  return `${MOIS[m - 1]} ${a}`
}

/** "YYYY-MM" du mois courant. */
export function moisCourant(): string {
  return aujourdhui().slice(0, 7)
}

export function ajouterMois(mois: string, n: number): string {
  const [a, m] = mois.split('-').map(Number)
  const d = new Date(a, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function age(dateNaissance: string): number | null {
  if (!dateNaissance) return null
  const n = dateDeIso(dateNaissance)
  const now = new Date()
  let a = now.getFullYear() - n.getFullYear()
  const m = now.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < n.getDate())) a--
  return a >= 0 && a < 130 ? a : null
}

export const MOIS_COURTS = [
  'janv', 'févr', 'mars', 'avr', 'mai', 'juin',
  'juil', 'août', 'sept', 'oct', 'nov', 'déc',
]

/** "08/09" — sans l'année quand c'est l'année en cours, pour tenir sur une ligne. */
export function dateBreve(iso: string): string {
  const d = dateDeIso(iso)
  const jm = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  const anneeCourante = new Date().getFullYear()
  return d.getFullYear() === anneeCourante ? jm : `${jm}/${String(d.getFullYear()).slice(2)}`
}

/** "2026-09-08" -> "8 sept." — le format des pastilles de date. */
export function dateJourMois(iso: string): string {
  const d = dateDeIso(iso)
  return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]}.`
}
