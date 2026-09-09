import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MARGE_PEREMPTION, messageErreur, quelGarder, sessionPerimee, type Session,
} from '../src/lib/nuage.ts'
import type { Donnees, Patient, Seance } from '../src/lib/types.ts'

function doc(majLe: string, nbPatients = 0, nbSeances = 0): Donnees {
  return {
    version: 7,
    majLe,
    patients: Array.from({ length: nbPatients }, (_, i) => ({ id: `p${i}` } as Patient)),
    seances: Array.from({ length: nbSeances }, (_, i) => ({ id: `s${i}` } as Seance)),
    journalRappels: [],
    reglages: {} as Donnees['reglages'],
  }
}

function session(expireLe: number): Session {
  return {
    jeton: 'j', rafraichissement: 'r', expireLe,
    utilisateur: { id: 'u', email: 'a@b.c' },
  }
}

/* ---------- Qui l'emporte ---------- */

test('le document le plus récemment modifié l’emporte', () => {
  const vieux = doc('2026-09-01T10:00:00.000Z', 3)
  const neuf = doc('2026-09-09T10:00:00.000Z', 3)
  assert.equal(quelGarder(neuf, vieux), 'local')
  assert.equal(quelGarder(vieux, neuf), 'distant')
})

test('deux documents de même date ne déclenchent aucun échange', () => {
  const a = doc('2026-09-09T10:00:00.000Z', 3)
  const b = doc('2026-09-09T10:00:00.000Z', 3)
  assert.equal(quelGarder(a, b), 'identique')
})

test('un coffre vide ne remplace jamais des dossiers, même s’il est plus récent', () => {
  // Le cas qui compte : le coffre vient d'être créé, le téléphone porte tout.
  const local = doc('2020-01-01T00:00:00.000Z', 12, 300)
  const distantVideEtRecent = doc('2026-09-09T10:00:00.000Z', 0, 0)
  assert.equal(quelGarder(local, distantVideEtRecent), 'local')
})

test('une mémoire de navigateur effacée ne vide jamais le coffre', () => {
  // L'inverse : le téléphone a tout perdu, le coffre a tout. Il gagne, quelle
  // que soit la date que porte le document local.
  const localVideEtRecent = doc('2026-09-09T10:00:00.000Z', 0, 0)
  const distant = doc('2020-01-01T00:00:00.000Z', 12, 300)
  assert.equal(quelGarder(localVideEtRecent, distant), 'distant')
})

test('deux documents vides sont considérés identiques', () => {
  assert.equal(quelGarder(doc('2026-09-09T10:00:00.000Z'), doc('2020-01-01T00:00:00.000Z')), 'identique')
})

test('un document sans date ne l’emporte pas sur un document daté', () => {
  assert.equal(quelGarder(doc('', 2), doc('2026-09-09T10:00:00.000Z', 2)), 'distant')
  assert.equal(quelGarder(doc('2026-09-09T10:00:00.000Z', 2), doc('', 2)), 'local')
})

test('des séances sans patient comptent comme un document plein', () => {
  // Un dossier peut être supprimé en gardant son historique : ce n'est pas vide.
  assert.equal(quelGarder(doc('2026-01-01T00:00:00.000Z', 0, 5), doc('2026-09-09T00:00:00.000Z', 0, 0)), 'local')
})

/* ---------- Péremption de session ---------- */

test('une session est périmée un peu avant son terme', () => {
  const maintenant = 1_000_000
  assert.equal(sessionPerimee(session(maintenant + MARGE_PEREMPTION + 1), maintenant), false)
  assert.equal(sessionPerimee(session(maintenant + MARGE_PEREMPTION), maintenant), true)
  assert.equal(sessionPerimee(session(maintenant - 1), maintenant), true)
})

test('l’absence de session vaut péremption', () => {
  assert.equal(sessionPerimee(null, Date.now()), true)
})

/* ---------- Messages ---------- */

test('chaque échec parle français, et jamais technique', () => {
  assert.match(messageErreur(0), /Pas de connexion/)
  assert.match(messageErreur(400), /mot de passe/i)
  assert.match(messageErreur(401), /mot de passe/i)
  assert.match(messageErreur(429), /Trop de tentatives/)
  assert.match(messageErreur(500), /ne répond pas/)
  assert.match(messageErreur(503), /ne répond pas/)
})

test('une adresse non confirmée se dit autrement qu’un mauvais mot de passe', () => {
  assert.match(messageErreur(400, { error_code: 'email_not_confirmed' }), /confirmée/)
})

test('un statut inattendu donne quand même une phrase lisible', () => {
  assert.equal(messageErreur(418), 'Échec de l’opération. Réessayez.')
})
