import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dureeCycle, dureeTotale, EXERCICES, positionCyclique, positionLineaire, trouverExercice,
} from '../src/lib/exercices.ts'

const QUATRE_QUATRE_SIX = [4, 4, 6]

test('la respiration avance bien d’un temps au suivant', () => {
  // C'était le défaut : le libellé restait sur « Inspirez » pendant trois minutes.
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 0).index, 0)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 3).index, 0)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 4).index, 1)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 7).index, 1)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 8).index, 2)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 13).index, 2)
})

test('la respiration recommence au tour suivant', () => {
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 14).index, 0)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 18).index, 1)
  // Loin dans l'exercice, la position reste juste : rien ne s'accumule.
  // 280 = vingt tours pile, on repart donc sur le premier temps.
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 280).index, 0)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 284).index, 1)
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, 289).index, 2)
})

test('le temps restant dans un temps de respiration', () => {
  assert.deepEqual(positionCyclique(QUATRE_QUATRE_SIX, 0), { index: 0, reste: 4, passe: 0 })
  assert.deepEqual(positionCyclique(QUATRE_QUATRE_SIX, 5), { index: 1, reste: 3, passe: 1 })
  assert.deepEqual(positionCyclique(QUATRE_QUATRE_SIX, 13), { index: 2, reste: 1, passe: 5 })
})

test('un temps écoulé négatif ne casse rien', () => {
  assert.equal(positionCyclique(QUATRE_QUATRE_SIX, -3).index, 0)
})

test('une respiration sans temps ne casse rien', () => {
  assert.deepEqual(positionCyclique([], 12), { index: 0, reste: 0, passe: 0 })
})

test('les étapes se jouent une fois, puis l’exercice est fini', () => {
  const durees = [25, 30, 15]
  assert.deepEqual(positionLineaire(durees, 0), { index: 0, reste: 25, passe: 0, fini: false })
  assert.equal(positionLineaire(durees, 24).index, 0)
  assert.equal(positionLineaire(durees, 25).index, 1)
  assert.equal(positionLineaire(durees, 54).index, 1)
  assert.equal(positionLineaire(durees, 55).index, 2)
  assert.equal(positionLineaire(durees, 69).fini, false)
  assert.equal(positionLineaire(durees, 70).fini, true)
  // Une fois fini, on reste sur la dernière étape : rien ne repart en boucle.
  assert.equal(positionLineaire(durees, 500).index, 2)
  assert.equal(positionLineaire(durees, 500).fini, true)
})

test('le tour de respiration fait la somme de ses temps', () => {
  assert.equal(dureeCycle([{ libelle: 'a', secondes: 4, geste: 'inspire' },
                           { libelle: 'b', secondes: 6, geste: 'expire' }]), 10)
})

test('la durée totale suit la forme de l’exercice', () => {
  const coherence = trouverExercice('coherence')!
  assert.equal(dureeTotale(coherence), 300)
  const sas = trouverExercice('sas')!
  assert.equal(dureeTotale(sas), sas.etapes!.reduce((t, s) => t + s.secondes, 0))
})

test('chaque exercice est jouable et dure un temps raisonnable', () => {
  const ids = new Set<string>()
  for (const e of EXERCICES) {
    assert.ok(!ids.has(e.id), `identifiant en double : ${e.id}`)
    ids.add(e.id)
    // Une forme et une seule : soit des temps de respiration, soit des étapes.
    assert.ok(Boolean(e.phases) !== Boolean(e.etapes), `${e.id} doit avoir une seule forme`)
    if (e.phases) {
      assert.ok(e.phases.length >= 2, `${e.id} : une respiration a au moins deux temps`)
      assert.ok(e.phases.every((p) => p.secondes > 0), `${e.id} : un temps ne peut être nul`)
      assert.ok((e.minutes ?? 0) > 0, `${e.id} : il faut une durée`)
    }
    if (e.etapes) {
      assert.ok(e.etapes.length >= 2, `${e.id} : un guidé a au moins deux étapes`)
      assert.ok(e.etapes.every((s) => s.secondes > 0), `${e.id} : une étape ne peut être nulle`)
    }
    const t = dureeTotale(e)
    assert.ok(t >= 45 && t <= 600, `${e.id} : ${t} s, hors de « entre deux séances »`)
  }
})

test('l’exercice inconnu ne renvoie rien plutôt que de casser', () => {
  assert.equal(trouverExercice('nexiste-pas'), undefined)
})
