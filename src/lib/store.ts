import { useSyncExternalStore } from 'react'
import type { Donnees, Objectif, Patient, Reglages, Seance } from './types'
import { aujourdhui } from './dates'

const CLE = 'psy-app:donnees'
export const VERSION = 2

export const REGLAGES_DEFAUT: Reglages = {
  nomPraticienne: '',
  nomCabinet: '',
  tarifDefaut: 6000,
  partPsyPct: 50,
  // samedi, dimanche, lundi, mardi
  joursTravail: [6, 0, 1, 2],
  creneaux: [
    { debut: '09:00', fin: '10:30' },
    { debut: '11:00', fin: '12:30' },
    { debut: '13:30', fin: '15:00' },
    { debut: '15:00', fin: '16:30' },
  ],
  masquerNoms: false,
}

function vide(): Donnees {
  return { version: VERSION, patients: [], seances: [], reglages: { ...REGLAGES_DEFAUT } }
}

/**
 * Complète les dossiers enregistrés avant l'arrivée d'un champ.
 * Aucune donnée existante n'est écrasée : on ne fait qu'ajouter ce qui manque.
 */
export function normaliserPatient(p: Patient): Patient {
  return { ...p, objectifs: Array.isArray(p.objectifs) ? p.objectifs : [] }
}

export function normaliserSeance(s: Seance): Seance {
  return {
    ...s,
    etatObserve: typeof s.etatObserve === 'string' ? s.etatObserve : '',
    note: typeof s.note === 'string' ? s.note : '',
    aReprendre: typeof s.aReprendre === 'string' ? s.aReprendre : '',
  }
}

function normaliser(d: Partial<Donnees>): Donnees {
  return {
    version: VERSION,
    patients: (d.patients ?? []).map(normaliserPatient),
    seances: (d.seances ?? []).map(normaliserSeance),
    reglages: { ...REGLAGES_DEFAUT, ...(d.reglages ?? {}) },
  }
}

function charger(): Donnees {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return vide()
    return normaliser(JSON.parse(brut) as Donnees)
  } catch {
    return vide()
  }
}

let etat: Donnees = charger()
const abonnes = new Set<() => void>()

function publier(suivant: Donnees) {
  etat = suivant
  try {
    localStorage.setItem(CLE, JSON.stringify(etat))
  } catch (e) {
    console.error('Sauvegarde impossible', e)
  }
  abonnes.forEach((f) => f())
}

function abonner(f: () => void) {
  abonnes.add(f)
  return () => { abonnes.delete(f) }
}

export function useDonnees(): Donnees {
  return useSyncExternalStore(abonner, () => etat, () => etat)
}

export function lire(): Donnees {
  return etat
}

export function id(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// --- Patients ---

export function ajouterPatient(p: Omit<Patient, 'id' | 'creeLe'>): Patient {
  const patient: Patient = normaliserPatient({ ...p, id: id(), creeLe: new Date().toISOString() })
  publier({ ...etat, patients: [...etat.patients, patient] })
  return patient
}

export function majPatient(idPatient: string, champs: Partial<Patient>) {
  publier({
    ...etat,
    patients: etat.patients.map((p) => (p.id === idPatient ? { ...p, ...champs } : p)),
  })
}

/** Supprime le patient et tout son historique de séances. */
export function supprimerPatient(idPatient: string) {
  publier({
    ...etat,
    patients: etat.patients.filter((p) => p.id !== idPatient),
    seances: etat.seances.filter((s) => s.patientId !== idPatient),
  })
}

export function patient(idPatient: string): Patient | undefined {
  return etat.patients.find((p) => p.id === idPatient)
}

// --- Objectifs thérapeutiques ---

export function ajouterObjectif(idPatient: string, texte: string) {
  const objectif: Objectif = {
    id: id(),
    texte: texte.trim(),
    atteint: false,
    creeLe: new Date().toISOString(),
  }
  if (!objectif.texte) return
  const p = patient(idPatient)
  if (!p) return
  majPatient(idPatient, { objectifs: [...p.objectifs, objectif] })
}

export function basculerObjectif(idPatient: string, idObjectif: string) {
  const p = patient(idPatient)
  if (!p) return
  majPatient(idPatient, {
    objectifs: p.objectifs.map((o) => (o.id === idObjectif ? { ...o, atteint: !o.atteint } : o)),
  })
}

export function supprimerObjectif(idPatient: string, idObjectif: string) {
  const p = patient(idPatient)
  if (!p) return
  majPatient(idPatient, { objectifs: p.objectifs.filter((o) => o.id !== idObjectif) })
}

// --- Séances ---

export function ajouterSeance(
  patientId: string,
  date: string,
  creneau: number,
): Seance {
  const p = patient(patientId)
  const seance: Seance = {
    id: id(),
    patientId,
    date,
    creneau,
    statut: date < aujourdhui() ? 'effectue' : 'prevu',
    tarif: p?.tarifPerso ?? etat.reglages.tarifDefaut,
    partPsyPct: etat.reglages.partPsyPct,
    paye: false,
    modePaiement: null,
    datePaiement: null,
    etatObserve: '',
    note: '',
    aReprendre: '',
    noteMajLe: null,
    motifAnnulation: '',
    creeLe: new Date().toISOString(),
  }
  publier({ ...etat, seances: [...etat.seances, seance] })
  return seance
}

export function majSeance(idSeance: string, champs: Partial<Seance>) {
  publier({
    ...etat,
    seances: etat.seances.map((s) => (s.id === idSeance ? { ...s, ...champs } : s)),
  })
}

export function supprimerSeance(idSeance: string) {
  publier({ ...etat, seances: etat.seances.filter((s) => s.id !== idSeance) })
}

/** Déplace une séance vers un autre créneau, si celui-ci est libre. */
export function deplacerSeance(idSeance: string, date: string, creneau: number): boolean {
  const occupe = etat.seances.some(
    (s) => s.id !== idSeance && s.date === date && s.creneau === creneau,
  )
  if (occupe) return false
  majSeance(idSeance, { date, creneau })
  return true
}

export function seancesDuJour(date: string): Seance[] {
  return etat.seances.filter((s) => s.date === date).sort((a, b) => a.creneau - b.creneau)
}

// --- Réglages ---

export function majReglages(champs: Partial<Reglages>) {
  publier({ ...etat, reglages: { ...etat.reglages, ...champs } })
}

export function basculerMasquage() {
  majReglages({ masquerNoms: !etat.reglages.masquerNoms })
}

// --- Sauvegarde / restauration ---

export function exporter(): string {
  return JSON.stringify(etat, null, 2)
}

export function importer(json: string): { ok: true } | { ok: false; erreur: string } {
  try {
    const d = JSON.parse(json)
    if (!Array.isArray(d.patients) || !Array.isArray(d.seances)) {
      return { ok: false, erreur: "Ce fichier n'est pas une sauvegarde de l'application." }
    }
    publier(normaliser(d))
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Fichier illisible.' }
  }
}

export function toutEffacer() {
  publier({ ...vide(), reglages: etat.reglages })
}
