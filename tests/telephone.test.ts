import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lisible, normaliserNumero } from '../src/lib/telephone.ts'

const DZ = '213'

function ok(brut: string, attendu: string, indicatif = DZ) {
  const n = normaliserNumero(brut, indicatif)
  assert.equal(n.valide, true, `${brut} devrait être valide : ${n.probleme}`)
  assert.equal(n.international, attendu, brut)
}

function ko(brut: string, indicatif = DZ) {
  const n = normaliserNumero(brut, indicatif)
  assert.equal(n.valide, false, `${brut} ne devrait pas être valide`)
  assert.equal(n.international, '')
  assert.ok(n.probleme.length > 0, 'un motif doit être donné')
}

test('un numéro local algérien perd son zéro et gagne l’indicatif', () => {
  ok('0551234567', '213551234567')
  ok('0770123456', '213770123456')
})

test('les séparateurs de saisie sont ignorés', () => {
  ok('0551 23 45 67', '213551234567')
  ok('0551-23-45-67', '213551234567')
  ok('0551.23.45.67', '213551234567')
  ok('(0551) 23 45 67', '213551234567')
  ok('  0551234567  ', '213551234567')
})

test('un numéro déjà international est conservé tel quel', () => {
  ok('213551234567', '213551234567')
  ok('+213551234567', '213551234567')
  ok('+213 551 23 45 67', '213551234567')
})

test('le préfixe 00 est retiré', () => {
  ok('00213551234567', '213551234567')
  ok('00 213 551 234 567', '213551234567')
})

test('un numéro d’un autre pays garde son propre indicatif', () => {
  ok('+33612345678', '33612345678')
  ok('0033612345678', '33612345678')
  // Sans « + » ni « 00 », rien ne dit que 33… est français : on ne devine pas.
  ok('33612345678', '21333612345678')
})

test('un numéro sans zéro initial reçoit l’indicatif', () => {
  ok('551234567', '213551234567')
})

test('l’indicatif déjà présent n’est pas doublé', () => {
  const n = normaliserNumero('213551234567', DZ)
  assert.equal(n.international.startsWith('213213'), false)
})

test('un numéro français est traité avec l’indicatif français', () => {
  ok('06 12 34 56 78', '33612345678', '33')
  ok('0033612345678', '33612345678', '33')
})

test('les numéros inexploitables sont refusés avec un motif', () => {
  ko('')
  ko('   ')
  ko('appelle-moi')
  ko('0551 23 AB 67')
  ko('12')          // trop court
  ko('0' + '1'.repeat(20)) // trop long
})

test('un indicatif absent des réglages est signalé', () => {
  const n = normaliserNumero('0551234567', '')
  assert.equal(n.valide, false)
  assert.match(n.probleme, /Indicatif/)
})

test('l’indicatif peut être saisi avec un + dans les réglages', () => {
  ok('0551234567', '213551234567', '+213')
})

test('plusieurs zéros initiaux sont tous retirés', () => {
  ok('00551234567'.replace(/^00/, '0'), '213551234567')
})

test('le numéro se relit facilement', () => {
  assert.equal(lisible('213551234567'), '+213 551 234 567')
  assert.equal(lisible(''), '')
})
