import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bilan, encaissementsParMoyen, estDue, montantDu, partCabinet, partPsy, totalEncaisse,
} from '../src/lib/argent.ts'
import type { Seance, StatutSeance } from '../src/lib/types.ts'

function seance(champs: Partial<Seance> = {}): Seance {
  return {
    id: 's1',
    patientId: 'p1',
    date: '2026-09-05',
    creneau: 0,
    statut: 'effectue',
    tarif: 6000,
    partPsyPct: 50,
    paye: false,
    modePaiement: null,
    datePaiement: null,
    note: '',
    noteMajLe: null,
    motifAnnulation: '',
    rappelEnvoyeLe: null,
    rappelModele: null,
    creeLe: '2026-09-01T00:00:00.000Z',
    ...champs,
  }
}

test('la séance à 6 000 DA se partage en 3 000 / 3 000', () => {
  const s = seance()
  assert.equal(partPsy(s), 3000)
  assert.equal(partCabinet(s), 3000)
  assert.equal(partPsy(s) + partCabinet(s), s.tarif)
})

test('une absence et une annulation tardive restent dues', () => {
  for (const statut of ['absent', 'annule_hors_delai'] as StatutSeance[]) {
    const s = seance({ statut })
    assert.equal(estDue(statut), true, statut)
    assert.equal(montantDu(s), 6000, statut)
    assert.equal(partPsy(s), 3000, statut)
  }
})

test('une annulation dans les délais ne se facture pas', () => {
  const s = seance({ statut: 'annule_delai' })
  assert.equal(estDue('annule_delai'), false)
  assert.equal(montantDu(s), 0)
  assert.equal(partPsy(s), 0)
  assert.equal(partCabinet(s), 0)
})

test('une séance seulement prévue ne compte pas encore', () => {
  const s = seance({ statut: 'prevu' })
  assert.equal(montantDu(s), 0)
  assert.equal(partPsy(s), 0)
})

test('les deux parts font toujours exactement le tarif, même sur un montant impair', () => {
  for (const tarif of [6000, 5500, 4501, 3333, 1, 7777]) {
    for (const pct of [50, 40, 60, 33, 67, 0, 100]) {
      const s = seance({ tarif, partPsyPct: pct })
      assert.equal(
        partPsy(s) + partCabinet(s),
        tarif,
        `tarif ${tarif} à ${pct} %`,
      )
    }
  }
})

test('un tarif adapté est respecté séance par séance', () => {
  const s = seance({ tarif: 4000 })
  assert.equal(partPsy(s), 2000)
  assert.equal(partCabinet(s), 2000)
})

test('le bilan sépare encaissé et reste dû', () => {
  const b = bilan([
    seance({ id: 'a', paye: true }),
    seance({ id: 'b', paye: false }),
    seance({ id: 'c', statut: 'absent', paye: false }),
    seance({ id: 'd', statut: 'annule_delai' }),
    seance({ id: 'e', statut: 'prevu' }),
  ])
  assert.equal(b.nbDues, 3)
  assert.equal(b.nbEffectuees, 2)
  assert.equal(b.nbAbsences, 1)
  assert.equal(b.nbAnnulations, 1)
  assert.equal(b.total, 18000)
  assert.equal(b.partPsy, 9000)
  assert.equal(b.partCabinet, 9000)
  assert.equal(b.encaisse, 6000)
  assert.equal(b.impaye, 12000)
  assert.equal(b.encaisse + b.impaye, b.total)
})

test('un bilan vide ne renvoie que des zéros', () => {
  const b = bilan([])
  assert.deepEqual(b, {
    nbDues: 0, nbEffectuees: 0, nbAbsences: 0, nbAnnulations: 0,
    total: 0, partPsy: 0, partCabinet: 0, encaisse: 0, impaye: 0,
  })
})

/* ---------------- Encaissements par moyen de paiement ---------------- */

test('les encaissements se regroupent par moyen de paiement', () => {
  const lignes = encaissementsParMoyen([
    seance({ id: 'a', patientId: 'p1', paye: true, modePaiement: 'sg', datePaiement: '2026-09-03' }),
    seance({ id: 'b', patientId: 'p2', paye: true, modePaiement: 'sg', datePaiement: '2026-09-10' }),
    seance({ id: 'c', patientId: 'p3', paye: true, modePaiement: 'ccp', datePaiement: '2026-09-12' }),
    seance({ id: 'd', patientId: 'p4', paye: true, modePaiement: 'especes', datePaiement: '2026-09-15' }),
  ], '2026-09')
  assert.equal(lignes.length, 3)
  const sg = lignes.find((l) => l.moyen === 'sg')
  assert.ok(sg)
  assert.equal(sg.nbSeances, 2)
  assert.equal(sg.nbPatients, 2)
  assert.equal(sg.montant, 12000)
  assert.equal(totalEncaisse(lignes), 24000)
})

test('deux séances d’une même personne ne comptent que pour une personne', () => {
  const lignes = encaissementsParMoyen([
    seance({ id: 'a', patientId: 'p1', paye: true, modePaiement: 'ccp', datePaiement: '2026-09-03' }),
    seance({ id: 'b', patientId: 'p1', paye: true, modePaiement: 'ccp', datePaiement: '2026-09-10' }),
  ], '2026-09')
  assert.equal(lignes[0].nbSeances, 2)
  assert.equal(lignes[0].nbPatients, 1)
  assert.equal(lignes[0].montant, 12000)
})

test('une séance réglée en retard compte dans le mois du règlement', () => {
  // Séance de mars, virement arrivé en avril : c'est un encaissement d'avril.
  const tardive = seance({
    id: 'a', date: '2026-03-20', paye: true, modePaiement: 'sg', datePaiement: '2026-04-05',
  })
  assert.equal(encaissementsParMoyen([tardive], '2026-03').length, 0)
  const avril = encaissementsParMoyen([tardive], '2026-04')
  assert.equal(avril.length, 1)
  assert.equal(avril[0].montant, 6000)
})

test('une séance non réglée n’entre dans aucun encaissement', () => {
  const lignes = encaissementsParMoyen([
    seance({ id: 'a', paye: false, modePaiement: null, datePaiement: null }),
    seance({ id: 'b', paye: true, modePaiement: 'ccp', datePaiement: null }),
  ], '2026-09')
  assert.equal(lignes.length, 0)
})

test('une annulation dans les délais ne peut pas être encaissée', () => {
  const lignes = encaissementsParMoyen([
    seance({ statut: 'annule_delai', paye: true, modePaiement: 'ccp', datePaiement: '2026-09-03' }),
  ], '2026-09')
  assert.equal(lignes.length, 0)
})

test('un règlement sans moyen précisé est regroupé à part, jamais perdu', () => {
  const lignes = encaissementsParMoyen([
    seance({ paye: true, modePaiement: null, datePaiement: '2026-09-03' }),
  ], '2026-09')
  assert.equal(lignes.length, 1)
  assert.equal(lignes[0].moyen, '')
  assert.equal(lignes[0].montant, 6000)
})

test('les moyens sont classés du plus gros montant au plus petit', () => {
  const lignes = encaissementsParMoyen([
    seance({ id: 'a', patientId: 'p1', paye: true, modePaiement: 'ccp', datePaiement: '2026-09-03' }),
    seance({ id: 'b', patientId: 'p2', paye: true, modePaiement: 'sg', datePaiement: '2026-09-04' }),
    seance({ id: 'c', patientId: 'p3', paye: true, modePaiement: 'sg', datePaiement: '2026-09-05' }),
    seance({ id: 'd', patientId: 'p4', paye: true, modePaiement: 'sg', datePaiement: '2026-09-06' }),
  ], '2026-09')
  assert.equal(lignes[0].moyen, 'sg')
  assert.equal(lignes[0].montant, 18000)
  assert.equal(lignes[1].moyen, 'ccp')
})
