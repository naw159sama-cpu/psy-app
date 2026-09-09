export type StatutPatient = 'actif' | 'pause' | 'cloture'

/** Un objectif thérapeutique suivi d'une séance à l'autre. */
export interface Objectif {
  id: string
  texte: string
  atteint: boolean
  creeLe: string
}

/** Par quel canal la personne accepte d'être rappelée. */
export type CanalRappel = 'aucun' | 'whatsapp' | 'sms' | 'email'

/** Représentant légal, pour les dossiers de mineurs. */
export interface Representant {
  nom: string
  telephone: string
  lien: string // mère, père, tuteur…
}

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
  /** Objectifs de la prise en charge, affichés dans le brief d'avant-séance. */
  objectifs: Objectif[]
  /** Canal accepté pour les rappels. « aucun » tant que rien n'a été recueilli. */
  canalRappel: CanalRappel
  /** Date de recueil du consentement, au format YYYY-MM-DD. */
  consentementLe: string | null
  /** Retire signature et lieu du message : discrétion maximale. */
  messageNeutreRenforce: boolean
  /** Pour un mineur, le rappel part ici et jamais sur son propre numéro. */
  representant: Representant | null
  /** Tarif propre au patient (tarif adapté). Vide = tarif par défaut du cabinet. */
  tarifPerso: number | null
  creeLe: string
}

export type StatutSeance =
  | 'prevu'
  | 'retard'            // attendue, elle a du retard -> pas encore due
  | 'effectue'
  | 'annule_delai'      // annulée dans les délais -> non facturée
  | 'annule_hors_delai' // annulée trop tard -> facturée
  | 'absent'            // ne s'est pas présentée -> facturée

/**
 * Identifiant d'un moyen de paiement. Ce n'est plus une liste figée : chaque
 * cabinet a ses comptes — CCP, telle banque, telle autre — et les nomme
 * lui-même dans les réglages.
 */
/** En cabinet ou à distance. */
export type ModePresence = 'presentiel' | 'visio'

export type ModePaiement = string

export interface MoyenPaiement {
  id: string
  nom: string
  actif: boolean
}

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
  /** En cabinet, ou en visioconférence. */
  modePresence: ModePresence
  /**
   * Note pratique attachée au rendez-vous : « apporte ses résultats »,
   * « vient avec sa sœur ». Rien de clinique — cela se lit d'un coup d'œil
   * dans l'agenda, avant même d'ouvrir le dossier.
   */
  description: string
  /** Clôture de séance — « État observé » : comment la personne est arrivée. */
  etatObserve: string
  /** Clôture de séance — « Contenu » : ce qui a été travaillé. */
  note: string
  /** Clôture de séance — « À reprendre » : nourrit le brief de la séance suivante. */
  aReprendre: string
  noteMajLe: string | null
  motifAnnulation: string
  /** Horodatage du « marqué comme envoyé ». L'app ne sait pas si le message est parti. */
  rappelEnvoyeLe: string | null
  /** Identifiant du modèle employé pour ce rappel. */
  rappelModele: string | null
  creeLe: string
}

export interface Creneau {
  debut: string // HH:MM
  fin: string   // HH:MM
}

/** Un modèle de message, éditable dans les réglages. */
export interface Modele {
  id: string
  nom: string
  corps: string
  actif: boolean
}

/**
 * Trace d'une préparation de rappel. Le contenu du message n'y figure jamais :
 * on note qui, quand, avec quel modèle, et où en est l'envoi.
 */
export interface JournalRappel {
  id: string
  patientId: string
  seanceId: string
  /** Date du rendez-vous concerné. */
  date: string
  modele: string
  statut: 'prepare' | 'envoye' | 'annule'
  creeLe: string
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
  /** Indicatif téléphonique du pays, sans « + ». 213 pour l'Algérie. */
  indicatifPays: string
  adresseCabinet: string
  signatureRappel: string
  /** Salle de visioconférence permanente, insérée par {lien_visio}. */
  lienVisioParDefaut: string
  modelesRappel: Modele[]
  /** Heure à partir de laquelle les rappels du lendemain sont mis en avant. */
  heureRappelQuotidien: string
  /** L'avertissement sur les métadonnées n'est montré qu'une fois. */
  avertissementRappelsVu: boolean
  /** Moyens de paiement proposés à l'encaissement. */
  modesPaiement: MoyenPaiement[]
  /** Bouton « Dicter » dans les champs cliniques. */
  dicteeActive: boolean
  /** L'avertissement sur la transmission de la voix n'est montré qu'une fois. */
  avertissementDicteeVu: boolean
}

export interface Donnees {
  version: number
  patients: Patient[]
  seances: Seance[]
  reglages: Reglages
  journalRappels: JournalRappel[]
}
