/**
 * Mise au format international des numéros, pour les liens wa.me.
 *
 * wa.me n'accepte qu'une suite de chiffres : ni « + », ni espace, ni tiret,
 * ni zéro initial. Un numéro mal formé n'échoue pas à l'envoi, il ouvre une
 * conversation avec un inconnu — d'où la validation dès la saisie.
 */

export interface NumeroNormalise {
  valide: boolean
  /** Suite de chiffres prête pour wa.me, vide si le numéro est inexploitable. */
  international: string
  /** Ce qui cloche, en français, à afficher sous le champ. */
  probleme: string
}

/** Longueurs admises pour un numéro international, indicatif compris (E.164). */
const MIN_CHIFFRES = 8
const MAX_CHIFFRES = 15

const invalide = (probleme: string): NumeroNormalise => ({
  valide: false, international: '', probleme,
})

export function normaliserNumero(brut: string, indicatif: string): NumeroNormalise {
  const saisi = (brut ?? '').trim()
  if (!saisi) return invalide('Aucun numéro renseigné')

  const code = (indicatif ?? '').replace(/\D/g, '')
  if (!code) return invalide('Indicatif pays absent des réglages')

  // Un « + » ou un « 00 » en tête dit explicitement : ce numéro est déjà international.
  const deja = /^\s*(\+|00)/.test(saisi)

  // On ne garde que les chiffres ; tout autre caractère significatif est un refus.
  const reste = saisi.replace(/^\s*\+/, '').replace(/[\s.\-()/]/g, '')
  if (/[^\d]/.test(reste)) return invalide('Le numéro contient des caractères non chiffrés')

  let chiffres = reste
  if (deja && chiffres.startsWith('00')) chiffres = chiffres.slice(2)

  if (!chiffres) return invalide('Aucun chiffre dans le numéro')

  let international: string
  if (deja) {
    // Numéro d'un autre pays : on le respecte tel quel.
    international = chiffres
  } else if (chiffres.startsWith('0')) {
    international = code + chiffres.replace(/^0+/, '')
  } else if (chiffres.startsWith(code)) {
    international = chiffres
  } else {
    international = code + chiffres
  }

  if (international.length < MIN_CHIFFRES) return invalide('Numéro trop court')
  if (international.length > MAX_CHIFFRES) return invalide('Numéro trop long')

  return { valide: true, international, probleme: '' }
}

/** « 213551234567 » -> « +213 551 234 567 », pour relecture par un humain. */
export function lisible(international: string): string {
  if (!international) return ''
  const groupes = international.slice(3).replace(/(\d{3})(?=\d)/g, '$1 ')
  return `+${international.slice(0, 3)} ${groupes}`.trim()
}
