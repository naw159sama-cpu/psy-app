/**
 * 6000 -> "6 000 DA", à la française : espace fine insécable entre les milliers
 * et espace insécable avant l'unité, pour qu'un montant ne se coupe jamais
 * en fin de ligne.
 */
const FINE = ' '
const INSECABLE = ' '

const GROUPES = /\B(?=(\d{3})+(?!\d))/g

export function da(montant: number): string {
  return `${montantSeul(montant)}${INSECABLE}DA`
}

/** 50 -> "50 %", avec l'espace insécable qu'impose la typographie française. */
export function pourcent(valeur: number): string {
  return `${valeur}${INSECABLE}%`
}

export function initiales(prenom: string, nom: string): string {
  const i = `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}`
  return i || '?'
}

/** Retire accents et casse, pour que la recherche marche sans accent. */
export function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Le montant sans son unité, pour afficher « DA » dans un style séparé. */
export function montantSeul(montant: number): string {
  const n = Math.round(montant)
  const signe = n < 0 ? '-' : ''
  return signe + String(Math.abs(n)).replace(GROUPES, FINE)
}
