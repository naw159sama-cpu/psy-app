import { id, lire } from './store'
import type { Donnees, Patient, Seance, StatutSeance } from './types'
import { aujourdhui, ajouterJours, debutSemaine, jourDeIso } from './dates'

/**
 * Jeu de démonstration. Tous les patients portent le nom « Démo » :
 * aucune confusion possible avec un vrai dossier.
 */
type Fiche = Pick<Patient, 'prenom' | 'motif' | 'adressePar' | 'statut' | 'dateNaissance'> & {
  objectifs: string[]
  canal: Patient['canalRappel']
  telephone: string
  representant?: Patient['representant']
}

const FICHES: Fiche[] = [
  {
    prenom: 'Amina', motif: 'Anxiété généralisée', adressePar: 'Médecin traitant',
    statut: 'actif', dateNaissance: '1994-03-12',
    objectifs: ['Retrouver un sommeil continu', 'Reprendre les sorties du week-end'],
    canal: 'whatsapp', telephone: '0551 23 45 67',
  },
  {
    prenom: 'Karim', motif: 'Difficultés scolaires', adressePar: 'Parents',
    statut: 'actif', dateNaissance: '2012-09-02',
    objectifs: ['Tenir trente minutes de devoirs', 'Renouer avec un camarade de classe'],
    canal: 'whatsapp', telephone: '0770 11 22 33',
    representant: { nom: 'Farida Démo', telephone: '0661 44 55 66', lien: 'mère' },
  },
  {
    prenom: 'Leila', motif: 'Deuil', adressePar: 'Bouche à oreille',
    statut: 'actif', dateNaissance: '1978-11-25',
    objectifs: ['Pouvoir parler de son frère sans s’effondrer', 'Reprendre le travail à mi-temps'],
    canal: 'sms', telephone: '0555 66 77 88',
  },
  {
    prenom: 'Yacine', motif: 'Stress professionnel', adressePar: 'Instagram',
    statut: 'actif', dateNaissance: '1989-06-30',
    objectifs: ['Poser une limite claire à son responsable'],
    canal: 'aucun', telephone: '0554 99 88 77',
  },
  {
    prenom: 'Nadia', motif: 'Troubles du sommeil', adressePar: 'Médecin traitant',
    statut: 'pause', dateNaissance: '1966-01-18',
    objectifs: [],
    canal: 'whatsapp', telephone: '',
  },
  {
    prenom: 'Sofiane', motif: 'Estime de soi', adressePar: 'Ancien patient',
    statut: 'cloture', dateNaissance: '1999-04-07',
    objectifs: [],
    canal: 'aucun', telephone: '0556 00 11 22',
  },
]

/** Comptes rendus fictifs, pour que le brief d'avant-séance ait de la matière. */
const ETATS = [
  'Arrivée à l’heure, visiblement fatiguée',
  'Détendue, souriante en entrant',
  'Tendue, parle vite',
  'Calme, plus posée que la fois précédente',
]

const CONTENUS = [
  'Reprise du fil de la semaine.\nA pu nommer ce qui l’a mise en difficulté au travail.\nExercice de respiration en fin de séance.',
  'Travail sur la relation familiale.\nBeaucoup d’émotion, larmes contenues.\nA accepté de mettre des mots sur sa colère.',
  'Point sur les objectifs.\nProgrès nets sur le sommeil, moins sur les sorties.\nA formulé seule une piste pour la semaine.',
  'Séance plus légère.\nA raconté un moment agréable du week-end.\nOn a nommé ce qui a rendu ce moment possible.',
]

/** Notes pratiques d'agenda : ni cliniques, ni confidentielles. */
const DESCRIPTIONS = [
  '', '', 'Apporte le compte rendu du médecin', '',
  'Vient accompagnée de sa sœur', '', '', 'Prévoir un peu plus de temps',
]

const REPRISES = [
  'Revenir sur la lettre qu’elle voulait écrire',
  'Reprendre l’exercice de respiration, voir s’il a été fait',
  'Demander comment s’est passé le repas de famille',
  'Vérifier où en est la reprise du travail',
]

export function genererDemo(): Donnees {
  const reglages = { ...lire().reglages }
  const patients: Patient[] = FICHES.map((f) => ({
    prenom: f.prenom,
    motif: f.motif,
    adressePar: f.adressePar,
    statut: f.statut,
    dateNaissance: f.dateNaissance,
    id: id(),
    nom: 'Démo',
    telephone: f.telephone,
    canalRappel: f.canal,
    consentementLe: f.canal === 'aucun' ? null : '2026-02-01',
    messageNeutreRenforce: f.prenom === 'Leila',
    representant: f.representant ?? null,
    anamnese: 'Dossier de démonstration — à supprimer avant utilisation réelle.',
    objectifs: f.objectifs.map((texte, i) => ({
      id: id(),
      texte,
      atteint: i > 0 && i % 3 === 0,
      creeLe: new Date().toISOString(),
    })),
    tarifPerso: null,
    creeLe: new Date().toISOString(),
  }))

  const actifs = patients.filter((p) => p.statut !== 'cloture')
  const seances: Seance[] = []
  const depart = debutSemaine(ajouterJours(aujourdhui(), -7 * 7))
  const joursOuvres = [...reglages.joursTravail]

  /**
   * Chaque patient a son rendez-vous hebdomadaire, toujours le même jour à la
   * même heure — c'est ainsi que se tient un suivi, et c'est ce qui donne au
   * brief d'avant-séance un rythme crédible. Les deux premiers en ont deux.
   */
  const proprietaire = new Map<string, string>()
  actifs.forEach((p, i) => {
    const jour = joursOuvres[i % joursOuvres.length]
    const creneau = Math.floor(i / joursOuvres.length) % reglages.creneaux.length
    proprietaire.set(`${jour}-${creneau}`, p.id)
    if (i < 2) {
      const jour2 = joursOuvres[(i + 2) % joursOuvres.length]
      proprietaire.set(`${jour2}-${creneau + 2}`, p.id)
    }
  })

  for (let j = 0; j < 7 * 9; j++) {
    const date = ajouterJours(depart, j)
    const jourSemaine = jourDeIso(date)
    if (!joursOuvres.includes(jourSemaine)) continue
    for (let c = 0; c < reglages.creneaux.length; c++) {
      const patientId = proprietaire.get(`${jourSemaine}-${c}`)
      if (!patientId) continue
      const p = actifs.find((x) => x.id === patientId)!
      const passe = date < aujourdhui()
      let statut: StatutSeance = passe ? 'effectue' : 'prevu'
      if (passe && (j + c) % 17 === 0) statut = 'absent'
      if (passe && (j + c) % 23 === 0) statut = 'annule_delai'
      const faite = statut === 'effectue'
      // Une séance récente sur cinq reste sans compte rendu : le badge « note à
      // rédiger » a ainsi de quoi s'afficher.
      const redigee = faite && (j + c) % 5 !== 0
      seances.push({
        id: id(),
        patientId: p.id,
        date,
        creneau: c,
        statut,
        tarif: reglages.tarifDefaut,
        partPsyPct: reglages.partPsyPct,
        paye: faite && (j + c) % 9 !== 0,
        modePaiement: faite ? 'especes' : null,
        datePaiement: faite ? date : null,
        description: DESCRIPTIONS[(j + c) % DESCRIPTIONS.length],
        etatObserve: redigee ? ETATS[(j + c) % ETATS.length] : '',
        note: redigee ? CONTENUS[(j + c) % CONTENUS.length] : '',
        aReprendre: redigee ? REPRISES[(j + c) % REPRISES.length] : '',
        noteMajLe: redigee ? date : null,
        motifAnnulation: statut === 'annule_delai' ? 'Empêchement, prévenu la veille' : '',
        rappelEnvoyeLe: null,
        rappelModele: null,
        creeLe: new Date().toISOString(),
      })
    }
  }

  return { version: 4, patients, seances, reglages, journalRappels: [] }
}
