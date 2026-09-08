import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MESSAGES_ERREUR, fusionner } from '../src/lib/dictee.ts'

test('le premier morceau dicté commence par une majuscule', () => {
  assert.equal(fusionner('', 'elle arrive tendue'), 'Elle arrive tendue')
  assert.equal(fusionner('   ', 'elle arrive tendue'), 'Elle arrive tendue')
})

test('les morceaux suivants se collent avec une seule espace', () => {
  assert.equal(fusionner('Elle arrive tendue', 'puis se détend'), 'Elle arrive tendue puis se détend')
  assert.equal(fusionner('Elle arrive tendue ', 'puis se détend'), 'Elle arrive tendue puis se détend')
  assert.equal(fusionner('Elle arrive tendue', '  puis se détend  '), 'Elle arrive tendue puis se détend')
})

test('après un point, la phrase suivante prend une majuscule', () => {
  assert.equal(fusionner('Elle arrive tendue.', 'puis se détend'), 'Elle arrive tendue. Puis se détend')
  assert.equal(fusionner('Ah bon ?', 'elle a dit oui'), 'Ah bon ? Elle a dit oui')
  assert.equal(fusionner('Enfin !', 'ça avance'), 'Enfin ! Ça avance')
})

test('un retour à la ligne existant est respecté', () => {
  assert.equal(fusionner('Premier point\n', 'deuxième point'), 'Premier point\ndeuxième point')
})

test('un morceau vide ne change rien', () => {
  assert.equal(fusionner('Déjà écrit', ''), 'Déjà écrit')
  assert.equal(fusionner('Déjà écrit', '   '), 'Déjà écrit')
})

test('le texte déjà saisi au clavier n’est jamais écrasé', () => {
  const avant = 'Note écrite à la main, avec ses retours\net sa ponctuation.'
  const apres = fusionner(avant, 'et la suite dictée')
  assert.ok(apres.startsWith(avant))
  assert.match(apres, /Et la suite dictée$/)
})

test('les refus du micro sont expliqués en français', () => {
  assert.match(MESSAGES_ERREUR['not-allowed'], /[Mm]icro/)
  assert.match(MESSAGES_ERREUR.network, /connexion/)
  // Une interruption volontaire ne doit afficher aucun message.
  assert.equal(MESSAGES_ERREUR.aborted, '')
})
