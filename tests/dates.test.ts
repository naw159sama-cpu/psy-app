import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ajouterJours, ajouterMois, age, dateCourte, debutSemaine, isoDeDate, jourDeIso,
} from '../src/lib/dates.ts'

test('une date locale ne glisse pas d’un jour', () => {
  // 23 h locales : toISOString() basculerait au lendemain sur un fuseau à l'est.
  assert.equal(isoDeDate(new Date(2026, 8, 8, 23, 30)), '2026-09-08')
  assert.equal(isoDeDate(new Date(2026, 0, 1, 0, 15)), '2026-01-01')
})

test('la semaine de travail commence le samedi', () => {
  assert.equal(debutSemaine('2026-09-08'), '2026-09-05') // mardi -> samedi
  assert.equal(debutSemaine('2026-09-05'), '2026-09-05') // samedi -> lui-même
  assert.equal(debutSemaine('2026-09-11'), '2026-09-05') // vendredi -> samedi d'avant
})

test('les quatre jours travaillés tombent bien dans la semaine', () => {
  const debut = debutSemaine('2026-09-08')
  const jours = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => ajouterJours(debut, i))
    .filter((d) => [6, 0, 1, 2].includes(jourDeIso(d)))
  assert.deepEqual(jours, ['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08'])
})

test('les changements de mois et d’année sont corrects', () => {
  assert.equal(ajouterJours('2026-12-31', 1), '2027-01-01')
  assert.equal(ajouterJours('2026-03-01', -1), '2026-02-28')
  assert.equal(ajouterMois('2026-01', -1), '2025-12')
  assert.equal(ajouterMois('2026-12', 1), '2027-01')
})

test('l’âge tient compte de l’anniversaire non encore passé', () => {
  const now = new Date()
  const dansUnMois = new Date(now.getFullYear() - 30, now.getMonth() + 1, 15)
  assert.equal(age(isoDeDate(dansUnMois)), 29)
  assert.equal(age(''), null)
})

test('la date courte est au format jour/mois/année', () => {
  assert.equal(dateCourte('2026-09-08'), '08/09/2026')
})
