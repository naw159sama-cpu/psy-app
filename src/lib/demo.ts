import { id, lire } from './store'
import type { Donnees, Patient, Seance, StatutSeance } from './types'
import { aujourdhui, ajouterJours, debutSemaine, jourDeIso } from './dates'

/**
 * Jeu de démonstration. Tous les patients portent le nom « Démo » :
 * aucune confusion possible avec un vrai dossier.
 */
const FICHES: Array<Pick<Patient, 'prenom' | 'motif' | 'adressePar' | 'statut' | 'dateNaissance'>> = [
  { prenom: 'Amina', motif: 'Anxiété généralisée', adressePar: 'Médecin traitant', statut: 'actif', dateNaissance: '1994-03-12' },
  { prenom: 'Karim', motif: 'Difficultés scolaires', adressePar: 'Parents', statut: 'actif', dateNaissance: '2012-09-02' },
  { prenom: 'Leila', motif: 'Deuil', adressePar: 'Bouche à oreille', statut: 'actif', dateNaissance: '1978-11-25' },
  { prenom: 'Yacine', motif: 'Stress professionnel', adressePar: 'Instagram', statut: 'actif', dateNaissance: '1989-06-30' },
  { prenom: 'Nadia', motif: 'Troubles du sommeil', adressePar: 'Médecin traitant', statut: 'pause', dateNaissance: '1966-01-18' },
  { prenom: 'Sofiane', motif: 'Estime de soi', adressePar: 'Ancien patient', statut: 'cloture', dateNaissance: '1999-04-07' },
]

export function genererDemo(): Donnees {
  const reglages = { ...lire().reglages }
  const patients: Patient[] = FICHES.map((f) => ({
    ...f,
    id: id(),
    nom: 'Démo',
    telephone: '0550 00 00 00',
    anamnese: 'Dossier de démonstration — à supprimer avant utilisation réelle.',
    tarifPerso: null,
    creeLe: new Date().toISOString(),
  }))

  const actifs = patients.filter((p) => p.statut !== 'cloture')
  const seances: Seance[] = []
  const depart = debutSemaine(ajouterJours(aujourdhui(), -7 * 7))

  for (let j = 0; j < 7 * 9; j++) {
    const date = ajouterJours(depart, j)
    if (!reglages.joursTravail.includes(jourDeIso(date))) continue
    for (let c = 0; c < reglages.creneaux.length; c++) {
      // ~75 % de remplissage, pseudo-aléatoire mais stable pour la démo
      if ((j * 7 + c * 3) % 4 === 3) continue
      const p = actifs[(j + c) % actifs.length]
      const passe = date < aujourdhui()
      let statut: StatutSeance = passe ? 'effectue' : 'prevu'
      if (passe && (j + c) % 17 === 0) statut = 'absent'
      if (passe && (j + c) % 23 === 0) statut = 'annule_delai'
      seances.push({
        id: id(),
        patientId: p.id,
        date,
        creneau: c,
        statut,
        tarif: reglages.tarifDefaut,
        partPsyPct: reglages.partPsyPct,
        paye: statut === 'effectue' && (j + c) % 9 !== 0,
        modePaiement: statut === 'effectue' ? 'especes' : null,
        datePaiement: statut === 'effectue' ? date : null,
        note: statut === 'effectue' ? 'Note de séance de démonstration.' : '',
        noteMajLe: statut === 'effectue' ? date : null,
        motifAnnulation: statut === 'annule_delai' ? 'Empêchement, prévenu la veille' : '',
        creeLe: new Date().toISOString(),
      })
    }
  }

  return { version: 1, patients, seances, reglages }
}
