import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleTheme, compterThemes, disposerBulles, THEME_ABSENT, themesDeduits, themesDuPatient,
} from '../src/lib/themes.ts'
import type { Patient } from '../src/lib/types.ts'

function fiche(p: Partial<Patient> & { id: string }): Patient {
  return {
    prenom: 'X', nom: 'Démo', telephone: '', dateNaissance: '1990-01-01',
    motif: '', adressePar: '', statut: 'actif', anamnese: '', objectifs: [],
    canalRappel: 'aucun', consentementLe: null, messageNeutreRenforce: false,
    representant: null, tarifPerso: null, themes: [], creeLe: '2026-01-01T00:00:00.000Z',
    ...p,
  }
}

test('la clé ignore accents, casse et espaces en trop', () => {
  assert.equal(cleTheme('Anxiété'), cleTheme('  anxiete '))
  assert.notEqual(cleTheme('Deuil'), cleTheme('Couple'))
})

test('le motif écrit à la main laisse deviner le thème', () => {
  assert.deepEqual(themesDeduits('Anxiété généralisée'), ['Anxiété'])
  assert.deepEqual(themesDeduits('Difficultés scolaires'), ['Scolarité'])
  assert.deepEqual(themesDeduits(''), [])
  assert.deepEqual(themesDeduits('Suivi de routine'), [])
})

test('un thème choisi à la main prime sur ce que dit le motif', () => {
  const p = fiche({ id: '1', motif: 'Anxiété généralisée', themes: ['Deuil'] })
  assert.deepEqual(themesDuPatient(p), ['Deuil'])
})

test('une fiche compte dans chacun de ses thèmes', () => {
  const bulles = compterThemes([
    fiche({ id: '1', themes: ['Deuil', 'Sommeil'] }),
    fiche({ id: '2', themes: ['Deuil'] }),
  ])
  const deuil = bulles.find((b) => b.nom === 'Deuil')
  assert.equal(deuil?.nb, 2)
  assert.deepEqual(deuil?.patientIds, ['1', '2'])
  assert.equal(bulles.find((b) => b.nom === 'Sommeil')?.nb, 1)
})

test('un même thème écrit deux fois sur une fiche ne compte qu’une fois', () => {
  const bulles = compterThemes([fiche({ id: '1', themes: ['Anxiété', 'anxiete'] })])
  assert.equal(bulles.length, 1)
  assert.equal(bulles[0].nb, 1)
})

test('les dossiers sans thème forment leur propre bulle', () => {
  const bulles = compterThemes([fiche({ id: '1' }), fiche({ id: '2', themes: ['Stress'] })])
  const absent = bulles.find((b) => b.absent)
  assert.equal(absent?.nom, THEME_ABSENT)
  assert.equal(absent?.nb, 1)
})

test('les bulles sortent du plus fréquent au moins fréquent', () => {
  const patients = [
    ...Array.from({ length: 3 }, (_, i) => fiche({ id: `a${i}`, themes: ['Stress'] })),
    ...Array.from({ length: 7 }, (_, i) => fiche({ id: `b${i}`, themes: ['Anxiété'] })),
  ]
  const bulles = compterThemes(patients)
  assert.deepEqual(bulles.map((b) => b.nom), ['Anxiété', 'Stress'])
  assert.deepEqual(bulles.map((b) => b.nb), [7, 3])
})

test('deux thèmes n’héritent jamais de la même teinte', () => {
  const patients = Array.from({ length: 9 }, (_, i) =>
    fiche({ id: `p${i}`, themes: [`Thème ${i}`] }))
  const teintes = compterThemes(patients).map((b) => b.teinte)
  assert.equal(new Set(teintes).size, teintes.length)
})

test('le même thème garde sa teinte quand les effectifs changent', () => {
  const seul = compterThemes([fiche({ id: '1', themes: ['Deuil'] })])
  const entoure = compterThemes([
    fiche({ id: '1', themes: ['Deuil'] }),
    fiche({ id: '2', themes: ['Deuil'] }),
  ])
  assert.equal(seul[0].teinte, entoure[0].teinte)
})

test('l’aire de la bulle suit l’effectif, pas son diamètre', () => {
  const [petite, grande] = disposerBulles([1, 4], 400, 300)
  // Quatre fois plus de patients : deux fois le rayon, quatre fois la surface.
  assert.ok(Math.abs(grande.r / petite.r - 2) < 0.001)
})

test('aucune bulle n’en chevauche une autre', () => {
  const valeurs = [12, 9, 7, 6, 5, 4, 4, 3, 2, 2, 1, 1]
  const disques = disposerBulles(valeurs, 360, 300)
  for (let i = 0; i < disques.length; i++) {
    for (let j = i + 1; j < disques.length; j++) {
      const a = disques[i]
      const b = disques[j]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      assert.ok(d >= a.r + b.r - 0.01, `bulles ${i} et ${j} se chevauchent`)
    }
  }
})

test('toutes les bulles tiennent dans le cadre', () => {
  const disques = disposerBulles([8, 5, 5, 3, 2, 1, 1, 1], 360, 260)
  for (const d of disques) {
    assert.ok(d.x - d.r >= -0.01 && d.x + d.r <= 360.01, 'déborde en largeur')
    assert.ok(d.y - d.r >= -0.01 && d.y + d.r <= 260.01, 'déborde en hauteur')
  }
})

test('une seule bulle se place au centre du cadre', () => {
  const [seule] = disposerBulles([5], 300, 200)
  assert.ok(Math.abs(seule.x - 150) < 0.01)
  assert.ok(Math.abs(seule.y - 100) < 0.01)
})

test('aucune bulle à placer ne casse rien', () => {
  assert.deepEqual(disposerBulles([], 300, 200), [])
  assert.deepEqual(compterThemes([]), [])
})
