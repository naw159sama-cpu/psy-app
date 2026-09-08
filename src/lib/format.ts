/** 6000 -> "6 000 DA". */
export function da(montant: number): string {
  const n = Math.round(montant)
  const signe = n < 0 ? '-' : ''
  const chiffres = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${signe}${chiffres} DA`
}

export function initiales(prenom: string, nom: string): string {
  const i = `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}`
  return i || '?'
}

/** Retire accents et casse, pour que la recherche marche sans accent. */
export function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
