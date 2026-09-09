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

/* ------------------------------------------------------------------ */
/* Encaissements par moyen de paiement                                 */
/* ------------------------------------------------------------------ */

export interface LigneEncaissement {
  /** Identifiant du moyen ; vide si la séance a été réglée sans le préciser. */
  moyen: string
  /** Nombre de séances réglées par ce moyen. */
  nbSeances: number
  /** Nombre de personnes distinctes — c'est ce qui se dit à l'oral. */
  nbPatients: number
  montant: number
}

/**
 * Ce qui est réellement entré sur un mois, regroupé par moyen de paiement.
 *
 * Le regroupement se fait sur la **date d'encaissement**, pas sur la date de
 * séance : une séance de mars réglée en avril est un encaissement d'avril.
 * C'est la seule lecture qui corresponde à ce qui arrive sur les comptes.
 */
export function encaissementsParMoyen(seances: Seance[], mois: string): LigneEncaissement[] {
  const parMoyen = new Map<string, { nbSeances: number; patients: Set<string>; montant: number }>()

  for (const s of seances) {
    if (!s.paye || !estDue(s.statut)) continue
    if (!s.datePaiement || !s.datePaiement.startsWith(mois)) continue
    const cle = s.modePaiement ?? ''
    const ligne = parMoyen.get(cle) ?? { nbSeances: 0, patients: new Set<string>(), montant: 0 }
    ligne.nbSeances++
    ligne.patients.add(s.patientId)
    ligne.montant += s.tarif
    parMoyen.set(cle, ligne)
  }

  return [...parMoyen.entries()]
    .map(([moyen, l]) => ({
      moyen, nbSeances: l.nbSeances, nbPatients: l.patients.size, montant: l.montant,
    }))
    .sort((a, b) => b.montant - a.montant)
}

/** Total encaissé sur le mois, toutes provenances confondues. */
export function totalEncaisse(lignes: LigneEncaissement[]): number {
  return lignes.reduce((t, l) => t + l.montant, 0)
}
