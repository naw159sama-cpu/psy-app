import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  debutGrille, grilleMois, joursDuMois, moisVoisins,
} from '../src/lib/calendrier.ts'
import { jourDeIso } from '../src/lib/dates.ts'

test('la grille commence toujours un lundi', () => {
  for (const mois of ['2026-01', '2026-02', '2026-08', '2026-09', '2027-03', '2024-02']) {
    assert.equal(jourDeIso(debutGrille(mois)), 1, mois)
  }
})

test('un mois commençant un dimanche recule de six jours', () => {
  // 1er novembre 2026 tombe un dimanche.
  assert.equal(jourDeIso('2026-11-01'), 0)
  assert.equal(debutGrille('2026-11'), '2026-10-26')
  assert.equal(jourDeIso('2026-10-26'), 1)
})

test('un mois commençant un lundi ne recule pas', () => {
  // 1er juin 2026 tombe un lundi.
  assert.equal(jourDeIso('2026-06-01'), 1)
  assert.equal(debutGrille('2026-06'), '2026-06-01')
})

test('février compte 29 jours les années bissextiles', () => {
  assert.equal(joursDuMois('2024-02'), 29)
  assert.equal(joursDuMois('2026-02'), 28)
  assert.equal(joursDuMois('2000-02'), 29)
  assert.equal(joursDuMois('1900-02'), 28) // divisible par 100 sans l'être par 400
  assert.equal(joursDuMois('2026-04'), 30)
  assert.equal(joursDuMois('2026-12'), 31)
})

test('février bissextile est présent en entier dans la grille', () => {
  const cases = grilleMois('2024-02', '2024-02-15')
  const duMois = cases.filter((c) => c.dansLeMois)
  assert.equal(duMois.length, 29)
  assert.equal(duMois[0].date, '2024-02-01')
  assert.equal(duMois[28].date, '2024-02-29')
})

test('un mois qui déborde demande six lignes', () => {
  // Août 2026 commence un samedi et compte 31 jours : 6 + 31 = 37 cases utiles.
  assert.equal(jourDeIso('2026-08-01'), 6)
  const cases = grilleMois('2026-08', '2026-08-10')
  assert.equal(cases.length, 42)
  assert.equal(cases[0].date, '2026-07-27')
  assert.equal(cases[41].date, '2026-09-06')
})

test('la grille ne descend jamais sous cinq lignes', () => {
  // Février 2021 commence un lundi et compte 28 jours : quatre semaines pile.
  assert.equal(jourDeIso('2021-02-01'), 1)
  const cases = grilleMois('2021-02', '2021-02-10')
  assert.equal(cases.length, 35)
  assert.equal(cases[0].date, '2021-02-01')
})

test('chaque grille est faite de semaines complètes et continues', () => {
  for (const mois of ['2026-01', '2026-02', '2026-05', '2026-08', '2026-11', '2027-02']) {
    const cases = grilleMois(mois, '2026-09-08')
    assert.equal(cases.length % 7, 0, mois)
    assert.ok(cases.length === 35 || cases.length === 42, `${mois} : ${cases.length} cases`)
    for (let i = 0; i < cases.length; i++) {
      assert.equal(jourDeIso(cases[i].date), (i % 7 + 1) % 7, `${mois} case ${i}`)
    }
  }
})

test('le mois entier est couvert, sans trou ni doublon', () => {
  const cases = grilleMois('2026-09', '2026-09-08')
  const duMois = cases.filter((c) => c.dansLeMois).map((c) => c.date)
  assert.equal(duMois.length, 30)
  assert.equal(new Set(duMois).size, 30)
  assert.equal(duMois[0], '2026-09-01')
  assert.equal(duMois[29], '2026-09-30')
})

test('les jours des mois voisins sont marqués comme tels', () => {
  const cases = grilleMois('2026-09', '2026-09-08')
  assert.equal(cases[0].date, '2026-08-31')
  assert.equal(cases[0].dansLeMois, false)
  assert.equal(cases[1].dansLeMois, true)
})

test('aujourd’hui est repéré, et lui seul', () => {
  const cases = grilleMois('2026-09', '2026-09-08')
  const marques = cases.filter((c) => c.estAujourdhui)
  assert.equal(marques.length, 1)
  assert.equal(marques[0].date, '2026-09-08')
})

test('un jour d’un mois voisin peut être aujourd’hui sans appartenir au mois', () => {
  const cases = grilleMois('2026-10', '2026-09-30')
  const marque = cases.find((c) => c.estAujourdhui)
  assert.ok(marque)
  assert.equal(marque.dansLeMois, false)
})

test('les mois voisins passent correctement les bornes d’année', () => {
  assert.deepEqual(moisVoisins('2026-01'), ['2025-12', '2026-01', '2026-02'])
  assert.deepEqual(moisVoisins('2026-12'), ['2026-11', '2026-12', '2027-01'])
  assert.deepEqual(moisVoisins('2026-09'), ['2026-08', '2026-09', '2026-10'])
})

test('un mois traversé par un changement d’heure garde ses jours alignés', () => {
  // En France, l'heure d'été s'arrête le dernier dimanche d'octobre.
  const cases = grilleMois('2026-10', '2026-10-15')
  const duMois = cases.filter((c) => c.dansLeMois).map((c) => c.date)
  assert.equal(duMois.length, 31)
  assert.equal(duMois[24], '2026-10-25') // le dimanche du changement
  assert.equal(duMois[30], '2026-10-31')
})
