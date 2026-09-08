export type StatutPatient = 'actif' | 'pause' | 'cloture'

export interface Patient {
  id: string
  prenom: string
  nom: string
  telephone: string
  dateNaissance: string // YYYY-MM-DD
  motif: string
  adressePar: string
  statut: StatutPatient
  anamnese: string
  /** Tarif propre au patient (tarif adapté). Vide = tarif par défaut du cabinet. */
  tarifPerso: number | null
  creeLe: string
}

export type StatutSeance =
  | 'prevu'
  | 'effectue'
  | 'annule_delai'      // annulée dans les délais -> non facturée
  | 'annule_hors_delai' // annulée trop tard -> facturée
  | 'absent'            // ne s'est pas présentée -> facturée

export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'cb'

export interface Seance {
  id: string
  patientId: string
  date: string      // YYYY-MM-DD
  creneau: number   // index dans reglages.creneaux
  statut: StatutSeance
  tarif: number     // DA, figé à la création
  partPsyPct: number // % figé à la création
  paye: boolean
  modePaiement: ModePaiement | null
  datePaiement: string | null
  note: string
  noteMajLe: string | null
  motifAnnulation: string
  creeLe: string
}

export interface Creneau {
  debut: string // HH:MM
  fin: string   // HH:MM
}

export interface Reglages {
  nomPraticienne: string
  nomCabinet: string
  tarifDefaut: number
  partPsyPct: number
  /** Jours travaillés, au format getDay() : 0=dim, 1=lun ... 6=sam */
  joursTravail: number[]
  creneaux: Creneau[]
  masquerNoms: boolean
}

export interface Donnees {
  version: number
  patients: Patient[]
  seances: Seance[]
  reglages: Reglages
}
