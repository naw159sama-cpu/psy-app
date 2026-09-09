import { test } from 'node:test'
import assert from 'node:assert/strict'
import { briefSeance, depuis, rangSeance, troisPremieresLignes } from '../src/lib/suivi.ts'
import type { Patient, Seance, StatutSeance } from '../src/lib/types.ts'
import { da } from '../src/lib/format.ts'

let compteur = 0
function seance(champs: Partial<Seance> = {}): Seance {
  compteur++
  return {
    id: `s${compteur}`,
    patientId: 'p1',
    date: '2026-09-01',
    creneau: 0,
    statut: 'effectue' as StatutSeance,
    tarif: 6000,
    partPsyPct: 50,
    paye: true,
    modePaiement: 'especes',
    datePaiement: '2026-09-01',
    description: '',
    etatObserve: '',
    note: '',
    aReprendre: '',
    noteMajLe: null,
    motifAnnulation: '',
    creeLe: '2026-08-01T00:00:00.000Z',
    ...champs,
  }
}

function patient(champs: Partial<Patient> = {}): Patient {
  return {
    id: 'p1', prenom: 'Amina', nom: 'Démo', telephone: '', dateNaissance: '',
    motif: '', adressePar: '', statut: 'actif', anamnese: '', objectifs: [],
    tarifPerso: null, creeLe: '2026-01-01T00:00:00.000Z',
    ...champs,
  }
}

test('une première séance ne propose rien à reprendre', () => {
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [s], patient())
  assert.equal(b.premiereSeance, true)
  assert.equal(b.rang, 1)
  assert.equal(b.derniere, null)
  assert.equal(b.ecartJours, null)
  assert.equal(b.resume, '')
  assert.deepEqual(b.alertes, [])
})

test('le rang compte les séances effectuées, pas les annulations', () => {
  const passees = [
    seance({ date: '2026-08-01' }),
    seance({ date: '2026-08-08' }),
    seance({ date: '2026-08-15', statut: 'annule_delai', paye: false }),
    seance({ date: '2026-08-22' }),
  ]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [...passees, s], patient())
  assert.equal(b.rang, 4) // trois effectuées avant, celle-ci est la quatrième
})

test('le brief reprend le compte rendu et le « à reprendre » de la dernière séance', () => {
  const derniere = seance({
    date: '2026-09-01',
    etatObserve: 'Arrivée tendue, fatiguée',
    note: 'Travail sur la relation au père.\nBeaucoup d’émotion.\nA pu nommer sa colère.',
    aReprendre: 'Revenir sur la lettre qu’elle voulait écrire',
  })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [derniere, s], patient())
  assert.equal(b.derniere?.id, derniere.id)
  assert.equal(b.aReprendre, 'Revenir sur la lettre qu’elle voulait écrire')
  assert.equal(b.etatPrecedent, 'Arrivée tendue, fatiguée')
  assert.equal(b.resume, 'Travail sur la relation au père. Beaucoup d’émotion. A pu nommer sa colère.')
  assert.equal(b.ecartJours, 7)
})

test('la dernière séance retenue est la dernière effectuée, pas une annulation postérieure', () => {
  const utile = seance({ date: '2026-08-25', note: 'Séance utile.' })
  const annulee = seance({ date: '2026-09-01', statut: 'annule_delai', paye: false })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [utile, annulee, s], patient())
  assert.equal(b.derniere?.id, utile.id)
  assert.equal(b.precedente?.id, annulee.id)
  assert.equal(b.ecartJours, 14)
})

test('deux séances du même jour sont ordonnées par créneau', () => {
  const matin = seance({ date: '2026-09-08', creneau: 0, note: 'Le matin.' })
  const apresMidi = seance({ date: '2026-09-08', creneau: 2, statut: 'prevu' })
  const b = briefSeance(apresMidi, [matin, apresMidi], patient())
  assert.equal(b.derniere?.id, matin.id)
  assert.equal(b.ecartJours, 0)
})

test('une absence la fois précédente est signalée', () => {
  const absente = seance({ date: '2026-09-01', statut: 'absent', paye: true })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [absente, s], patient())
  assert.ok(b.alertes.some((a) => a.cle === 'absence' && a.ton === 'terre'))
})

test('deux séances manquées d’affilée signalent un décrochage', () => {
  const a = seance({ date: '2026-08-25', statut: 'annule_hors_delai', paye: true })
  const b2 = seance({ date: '2026-09-01', statut: 'absent', paye: true })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [a, b2, s], patient())
  assert.ok(b.alertes.some((x) => x.cle === 'decrochage'))
})

test('les impayés antérieurs sont chiffrés', () => {
  const impayees = [
    seance({ date: '2026-08-18', paye: false }),
    seance({ date: '2026-08-25', paye: false }),
  ]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [...impayees, s], patient())
  const alerte = b.alertes.find((a) => a.cle === 'impaye')
  assert.ok(alerte)
  assert.match(alerte.texte, /2 séances non réglées/)
  // Le séparateur de milliers est une espace fine insécable : on compare au
  // formateur plutôt qu’à des caractères recopiés à la main.
  assert.ok(alerte.texte.endsWith(da(12000)))
})

test('une annulation dans les délais ne compte pas comme un impayé', () => {
  const annulee = seance({ date: '2026-09-01', statut: 'annule_delai', paye: false })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [annulee, s], patient())
  assert.equal(b.alertes.some((a) => a.cle === 'impaye'), false)
})

test('une séance précédente sans compte rendu est signalée', () => {
  const sansNote = seance({ date: '2026-09-01', note: '   ' })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [sansNote, s], patient())
  assert.ok(b.alertes.some((a) => a.cle === 'sans-note'))
})

test('un écart inhabituel est repéré à partir du rythme du suivi', () => {
  const hebdo = [
    seance({ date: '2026-07-07', note: 'a' }),
    seance({ date: '2026-07-14', note: 'a' }),
    seance({ date: '2026-07-21', note: 'a' }),
    seance({ date: '2026-07-28', note: 'a' }),
  ]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [...hebdo, s], patient())
  assert.equal(b.rythmeJours, 7)
  assert.equal(b.ecartJours, 42)
  assert.ok(b.alertes.some((a) => a.cle === 'ecart'))
})

test('un rythme régulier respecté ne déclenche aucune alerte d’écart', () => {
  const hebdo = [
    seance({ date: '2026-08-11', note: 'a' }),
    seance({ date: '2026-08-18', note: 'a' }),
    seance({ date: '2026-08-25', note: 'a' }),
    seance({ date: '2026-09-01', note: 'a' }),
  ]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [...hebdo, s], patient())
  assert.equal(b.alertes.some((a) => a.cle === 'ecart'), false)
})

test('le rythme n’est pas calculé sur un suivi trop court', () => {
  const deux = [seance({ date: '2026-09-01', note: 'a' }), seance({ date: '2026-09-04', note: 'a' })]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  assert.equal(briefSeance(s, [...deux, s], patient()).rythmeJours, null)
})

test('les objectifs sont séparés entre en cours et atteints', () => {
  const p = patient({
    objectifs: [
      { id: 'o1', texte: 'Reprendre le sommeil', atteint: false, creeLe: '' },
      { id: 'o2', texte: 'Sortir de l’isolement', atteint: true, creeLe: '' },
      { id: 'o3', texte: 'Reparler à sa sœur', atteint: false, creeLe: '' },
    ],
  })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [s], p)
  assert.equal(b.objectifsEnCours.length, 2)
  assert.equal(b.nbObjectifsAtteints, 1)
})

test('les séances d’un autre patient sont ignorées', () => {
  const autre = seance({ patientId: 'p2', date: '2026-09-01', note: 'Pas la bonne personne.' })
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [autre, s], patient())
  assert.equal(b.premiereSeance, true)
  assert.equal(b.resume, '')
})

test('le résumé se limite à trois lignes et se coupe proprement', () => {
  assert.equal(troisPremieresLignes('une\n\ndeux\ntrois\nquatre'), 'une deux trois')
  const long = troisPremieresLignes('x'.repeat(400))
  assert.equal(long.length, 221)
  assert.ok(long.endsWith('…'))
  assert.equal(troisPremieresLignes(''), '')
})

test('les rangs et les délais s’écrivent en français', () => {
  assert.equal(rangSeance(1), '1re séance')
  assert.equal(rangSeance(7), '7e séance')
  assert.equal(depuis(null), 'première rencontre')
  assert.equal(depuis(0), 'aujourd’hui')
  assert.equal(depuis(1), 'hier')
  assert.equal(depuis(4), 'il y a 4 jours')
  assert.equal(depuis(21), 'il y a 3 semaines')
  assert.equal(depuis(90), 'il y a 3 mois')
})

test('un rythme de un ou deux jours ne produit pas d’alerte d’écart', () => {
  // Des séances presque quotidiennes ne décrivent pas un rythme de suivi :
  // la médiane ne doit alors rien conclure.
  const rapprochees = [
    seance({ date: '2026-08-03', note: 'a' }),
    seance({ date: '2026-08-04', note: 'a' }),
    seance({ date: '2026-08-05', note: 'a' }),
    seance({ date: '2026-08-06', note: 'a' }),
  ]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [...rapprochees, s], patient())
  assert.equal(b.rythmeJours, 1)
  assert.equal(b.alertes.some((a) => a.cle === 'ecart'), false)
})

test('le brief ne montre jamais plus de trois signalements', () => {
  const passees = [
    seance({ date: '2026-07-01', paye: false, note: 'a' }),
    seance({ date: '2026-07-08', paye: false, note: 'a' }),
    seance({ date: '2026-07-15', paye: false, note: '' }),
    seance({ date: '2026-08-01', statut: 'annule_hors_delai', paye: false }),
    seance({ date: '2026-08-08', statut: 'absent', paye: false }),
  ]
  const s = seance({ date: '2026-09-08', statut: 'prevu' })
  const b = briefSeance(s, [...passees, s], patient())
  assert.ok(b.alertes.length <= 3)
  // Les plus graves passent devant.
  assert.equal(b.alertes[0].cle, 'absence')
  assert.equal(b.alertes[1].cle, 'decrochage')
})
