import type { ModePaiement, Patient, Reglages, StatutPatient, StatutSeance } from './types'
import { initiales } from './format'

/** Nom affiché, remplacé par les initiales quand l'écran de confidentialité est actif. */
export function nomAffiche(p: Patient | undefined, masquer: boolean): string {
  if (!p) return 'Patient supprimé'
  if (masquer) return `${initiales(p.prenom, p.nom)}.`
  return `${p.prenom} ${p.nom}`.trim()
}

export const LIBELLE_STATUT: Record<StatutSeance, string> = {
  prevu: 'Prévue',
  retard: 'En retard',
  effectue: 'Effectuée',
  annule_delai: 'Annulée à temps',
  annule_hors_delai: 'Annulée tard',
  absent: 'Absence',
}

export const AIDE_STATUT: Record<StatutSeance, string> = {
  prevu: 'Rendez-vous à venir.',
  retard: 'Attendue, elle a du retard. Rien n’est dû tant que la séance n’a pas eu lieu.',
  effectue: 'La séance a eu lieu, elle est due.',
  annule_delai: 'Prévenue à temps : rien à payer.',
  annule_hors_delai: 'Prévenue trop tard : la séance reste due.',
  absent: "Ne s'est pas présentée : la séance reste due.",
}

export function couleurStatut(s: StatutSeance): string {
  switch (s) {
    case 'prevu': return 'avenir'
    case 'retard': return 'attente'
    case 'effectue': return 'faite'
    case 'annule_delai': return 'gris'
    case 'annule_hors_delai': return 'attente'
    case 'absent': return 'alerte'
  }
}

export const LIBELLE_STATUT_PATIENT: Record<StatutPatient, string> = {
  actif: 'Suivi en cours',
  pause: 'En pause',
  cloture: 'Suivi terminé',
}

/** Nom lisible d'un moyen de paiement, tel qu'elle l'a saisi. */
export function nomMoyenPaiement(id: ModePaiement | null, r: Reglages): string {
  if (!id) return 'Non précisé'
  return r.modesPaiement.find((m) => m.id === id)?.nom ?? id
}
