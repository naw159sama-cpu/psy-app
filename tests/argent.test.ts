import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bilan, estDue, montantDu, partCabinet, partPsy } from '../src/lib/argent.ts'
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
