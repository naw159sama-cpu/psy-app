import type { Seance, StatutSeance } from './types'

/** Une séance annulée dans les délais n'est pas due. Le reste l'est. */
export function estDue(statut: StatutSeance): boolean {
  return statut === 'effectue' || statut === 'annule_hors_delai' || statut === 'absent'
}

/** Part praticienne, arrondie au dinar. */
export function partPsy(s: Seance): number {
  if (!estDue(s.statut)) return 0
  return Math.round((s.tarif * s.partPsyPct) / 100)
}

/** Part cabinet = reste exact, pour que les deux parts fassent toujours le tarif. */
export function partCabinet(s: Seance): number {
  if (!estDue(s.statut)) return 0
  return s.tarif - partPsy(s)
}

export function montantDu(s: Seance): number {
  return estDue(s.statut) ? s.tarif : 0
}

export interface Bilan {
  nbDues: number
  nbEffectuees: number
  nbAbsences: number
  nbAnnulations: number
  total: number
  partPsy: number
  partCabinet: number
  encaisse: number
  impaye: number
}

export function bilan(seances: Seance[]): Bilan {
  const b: Bilan = {
    nbDues: 0, nbEffectuees: 0, nbAbsences: 0, nbAnnulations: 0,
    total: 0, partPsy: 0, partCabinet: 0, encaisse: 0, impaye: 0,
  }
  for (const s of seances) {
    if (s.statut === 'effectue') b.nbEffectuees++
    if (s.statut === 'absent') b.nbAbsences++
    if (s.statut === 'annule_delai' || s.statut === 'annule_hors_delai') b.nbAnnulations++
    if (!estDue(s.statut)) continue
    b.nbDues++
    b.total += s.tarif
    b.partPsy += partPsy(s)
    b.partCabinet += partCabinet(s)
    if (s.paye) b.encaisse += s.tarif
    else b.impaye += s.tarif
  }
  return b
}
