import type { Objectif, Patient, Seance } from './types'
import { dateDeIso } from './dates.ts'
import { estDue } from './argent.ts'
import { da } from './format.ts'

/** Un signalement discret affiché en tête du brief. */
export interface Alerte {
  cle: string
  texte: string
  /** « terre » attire l'œil, « douce » informe sans alarmer. */
  ton: 'terre' | 'douce'
}

export interface Brief {
  /** Rang de la séance dans le suivi : 1 pour la première. */
  rang: number
  /** Jours écoulés depuis la dernière séance effectuée. */
  ecartJours: number | null
  /** Rythme habituel du suivi, en jours (médiane des écarts). */
  rythmeJours: number | null
  /** Dernière séance effectuée avant celle-ci. */
  derniere: Seance | null
  /** Séance qui précède immédiatement, quel que soit son statut. */
  precedente: Seance | null
  /** Trois premières lignes du compte rendu précédent. */
  resume: string
  aReprendre: string
  etatPrecedent: string
  objectifsEnCours: Objectif[]
  nbObjectifsAtteints: number
  alertes: Alerte[]
  /** Vrai quand il n'y a rien à reprendre : première séance du suivi. */
  premiereSeance: boolean
}

/** Ordre chronologique réel : la date d'abord, puis le créneau dans la journée. */
function avant(a: Seance, b: Seance): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return a.creneau - b.creneau
}

function joursEntre(depuis: string, jusqua: string): number {
  const ms = dateDeIso(jusqua).getTime() - dateDeIso(depuis).getTime()
  return Math.round(ms / 86_400_000)
}

/** Médiane des écarts entre séances consécutives, arrondie au jour. */
function rythme(effectuees: Seance[]): number | null {
  if (effectuees.length < 3) return null
  const ecarts: number[] = []
  for (let i = 1; i < effectuees.length; i++) {
    ecarts.push(joursEntre(effectuees[i - 1].date, effectuees[i].date))
  }
  ecarts.sort((a, b) => a - b)
  const milieu = Math.floor(ecarts.length / 2)
  const med = ecarts.length % 2 === 1
    ? ecarts[milieu]
    : Math.round((ecarts[milieu - 1] + ecarts[milieu]) / 2)
  return med > 0 ? med : null
}

/** Les trois premières lignes non vides d'un compte rendu. */
export function troisPremieresLignes(texte: string, maxCar = 220): string {
  const lignes = texte.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3)
  const joint = lignes.join(' ')
  return joint.length > maxCar ? `${joint.slice(0, maxCar).trimEnd()}…` : joint
}

/**
 * Tout ce qu'il faut savoir en trente secondes avant de faire entrer la personne.
 * Fonction pure : elle ne lit que ce qu'on lui passe.
 */
export function briefSeance(seance: Seance, seancesDuPatient: Seance[], p?: Patient): Brief {
  const anterieures = seancesDuPatient
    .filter((s) => s.patientId === seance.patientId && s.id !== seance.id && avant(s, seance) < 0)
    .sort(avant)

  const effectuees = anterieures.filter((s) => s.statut === 'effectue')
  const derniere = effectuees.length > 0 ? effectuees[effectuees.length - 1] : null
  const precedente = anterieures.length > 0 ? anterieures[anterieures.length - 1] : null

  const ecartJours = derniere ? joursEntre(derniere.date, seance.date) : null
  const rythmeJours = rythme(effectuees)

  const objectifs = p?.objectifs ?? []
  const objectifsEnCours = objectifs.filter((o) => !o.atteint)
  const nbObjectifsAtteints = objectifs.length - objectifsEnCours.length

  const alertes: Alerte[] = []

  if (precedente && precedente.statut === 'absent') {
    alertes.push({ cle: 'absence', texte: 'Absence non excusée la fois précédente', ton: 'terre' })
  } else if (precedente && precedente.statut.startsWith('annule')) {
    alertes.push({ cle: 'annulee', texte: 'Séance précédente annulée', ton: 'douce' })
  }

  const deuxDernieres = anterieures.slice(-2)
  if (
    deuxDernieres.length === 2 &&
    deuxDernieres.every((s) => s.statut === 'absent' || s.statut.startsWith('annule'))
  ) {
    alertes.push({
      cle: 'decrochage',
      texte: 'Deux séances manquées d’affilée — risque de décrochage',
      ton: 'terre',
    })
  }

  const impayes = anterieures.filter((s) => estDue(s.statut) && !s.paye)
  if (impayes.length > 0) {
    const montant = impayes.reduce((t, s) => t + s.tarif, 0)
    alertes.push({
      cle: 'impaye',
      texte: `${impayes.length} séance${impayes.length > 1 ? 's' : ''} non réglée${impayes.length > 1 ? 's' : ''} · ${da(montant)}`,
      ton: 'terre',
    })
  }

  if (derniere && !derniere.note.trim()) {
    alertes.push({
      cle: 'sans-note',
      texte: 'La séance précédente n’a pas de compte rendu',
      ton: 'douce',
    })
  }

  // En dessous de trois jours, la médiane ne décrit pas un rythme de suivi :
  // mieux vaut se taire que signaler un écart qui n’en est pas un.
  if (rythmeJours && rythmeJours >= 3 && ecartJours !== null && ecartJours > rythmeJours * 2) {
    alertes.push({
      cle: 'ecart',
      texte: `Écart inhabituel : ${ecartJours} jours, au lieu de ${rythmeJours} d’ordinaire`,
      ton: 'douce',
    })
  }

  return {
    rang: effectuees.length + 1,
    ecartJours,
    rythmeJours,
    derniere,
    precedente,
    resume: derniere ? troisPremieresLignes(derniere.note) : '',
    aReprendre: derniere?.aReprendre.trim() ?? '',
    etatPrecedent: derniere?.etatObserve.trim() ?? '',
    objectifsEnCours,
    nbObjectifsAtteints,
    alertes: alertes.slice(0, 3),
    premiereSeance: anterieures.length === 0,
  }
}

/** « 7ᵉ séance » — en français, seul le premier rang porte « re ». */
export function rangSeance(rang: number): string {
  return rang === 1 ? '1re séance' : `${rang}e séance`
}

/** « il y a 3 semaines », « il y a 4 jours », « hier ». */
export function depuis(jours: number | null): string {
  if (jours === null) return 'première rencontre'
  if (jours <= 0) return 'aujourd’hui'
  if (jours === 1) return 'hier'
  if (jours < 14) return `il y a ${jours} jours`
  const semaines = Math.round(jours / 7)
  if (semaines < 9) return `il y a ${semaines} semaines`
  const mois = Math.round(jours / 30)
  return `il y a ${mois} mois`
}
