import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODELES_DEFAUT, eligibilite, lienSms, lienWhatsApp, messagePour, rendreModele,
  variablesDe,
} from '../src/lib/rappels.ts'
import type { Patient, Reglages, Seance } from '../src/lib/types.ts'
import { isoDeDate } from '../src/lib/dates.ts'

const reglages: Reglages = {
  nomPraticienne: 'Sabrina Mokrane',
  nomCabinet: 'Cabinet',
  tarifDefaut: 6000,
  partPsyPct: 50,
  joursTravail: [6, 0, 1, 2],
  creneaux: [
    { debut: '09:00', fin: '10:30' },
    { debut: '11:00', fin: '12:30' },
  ],
  masquerNoms: false,
  indicatifPays: '213',
  adresseCabinet: '12 rue des Oliviers, El Achour',
  signatureRappel: 'Sabrina',
  lienVisioParDefaut: 'https://meet.exemple/salle',
  modelesRappel: MODELES_DEFAUT,
  heureRappelQuotidien: '18:00',
  avertissementRappelsVu: true,
}

function patient(champs: Partial<Patient> = {}): Patient {
  return {
    id: 'p1', prenom: 'Amina', nom: 'Démo', telephone: '0551234567',
    dateNaissance: '1994-03-12', motif: 'Anxiété', adressePar: '', statut: 'actif',
    anamnese: '', objectifs: [],
    canalRappel: 'whatsapp', consentementLe: '2026-01-10',
    messageNeutreRenforce: false, representant: null,
    tarifPerso: null, creeLe: '2026-01-01T00:00:00.000Z',
    ...champs,
  }
}

function seance(champs: Partial<Seance> = {}): Seance {
  return {
    id: 's1', patientId: 'p1', date: '2026-09-09', creneau: 0, statut: 'prevu',
    tarif: 6000, partPsyPct: 50, paye: false, modePaiement: null, datePaiement: null,
    description: '',
    etatObserve: '', note: '', aReprendre: '', noteMajLe: null, motifAnnulation: '',
    rappelEnvoyeLe: null, rappelModele: null, creeLe: '2026-09-01T00:00:00.000Z',
    ...champs,
  }
}

/* ---------------- Éligibilité ---------------- */

test('un patient consentant avec un numéro valide est éligible', () => {
  const e = eligibilite(patient(), reglages)
  assert.equal(e.eligible, true)
  if (e.eligible) {
    assert.equal(e.destinataire.numero, '213551234567')
    assert.equal(e.destinataire.viaRepresentant, false)
  }
})

test('sans consentement, aucun rappel n’est proposé', () => {
  const e = eligibilite(patient({ canalRappel: 'aucun' }), reglages)
  assert.equal(e.eligible, false)
  if (!e.eligible) assert.match(e.motif, /[Cc]onsentement/)
})

test('un consentement limité à l’e-mail exclut WhatsApp', () => {
  const e = eligibilite(patient({ canalRappel: 'email' }), reglages)
  assert.equal(e.eligible, false)
  if (!e.eligible) assert.match(e.motif, /e-mail/)
})

test('un numéro absent est signalé, pas masqué', () => {
  const e = eligibilite(patient({ telephone: '  ' }), reglages)
  assert.equal(e.eligible, false)
  if (!e.eligible) assert.match(e.motif, /numéro/i)
})

test('un numéro invalide est signalé avec son motif', () => {
  const e = eligibilite(patient({ telephone: '12' }), reglages)
  assert.equal(e.eligible, false)
  if (!e.eligible) assert.match(e.motif, /trop court/)
})

test('pour un mineur, le rappel part au représentant légal', () => {
  const naissance = isoDeDate(new Date(new Date().getFullYear() - 12, 3, 2))
  const e = eligibilite(patient({
    dateNaissance: naissance,
    telephone: '0770000000',
    representant: { nom: 'Farida Démo', telephone: '0661112233', lien: 'mère' },
  }), reglages)
  assert.equal(e.eligible, true)
  if (e.eligible) {
    assert.equal(e.destinataire.numero, '213661112233')
    assert.equal(e.destinataire.viaRepresentant, true)
    assert.equal(e.destinataire.nom, 'Farida Démo')
  }
})

test('un mineur sans représentant n’est jamais contacté sur son propre numéro', () => {
  const naissance = isoDeDate(new Date(new Date().getFullYear() - 12, 3, 2))
  const e = eligibilite(patient({ dateNaissance: naissance, telephone: '0770000000' }), reglages)
  assert.equal(e.eligible, false)
  if (!e.eligible) assert.match(e.motif, /[Mm]ineur/)
})

test('un majeur garde son propre numéro même avec un représentant enregistré', () => {
  const e = eligibilite(patient({
    representant: { nom: 'Quelqu’un', telephone: '0661112233', lien: 'conjoint' },
  }), reglages)
  assert.equal(e.eligible, true)
  if (e.eligible) assert.equal(e.destinataire.numero, '213551234567')
})

/* ---------------- Rendu des modèles ---------------- */

test('les variables sont remplacées par les valeurs de la séance', () => {
  const v = variablesDe(seance(), patient(), reglages)
  assert.equal(v.prenom, 'Amina')
  assert.equal(v.heure, '09:00')
  assert.equal(v.duree, '1 h 30')
  assert.equal(v.jour, 'mercredi')
  assert.equal(v.adresse, '12 rue des Oliviers, El Achour')
  assert.equal(v.signature, 'Sabrina')
})

test('le rappel de la veille se rend sans variable résiduelle', () => {
  const m = messagePour(seance(), patient(), reglages, MODELES_DEFAUT[0])
  assert.equal(m.includes('{'), false)
  assert.match(m, /Bonjour Amina/)
  assert.match(m, /mercredi à 09:00/)
  assert.match(m, /Sabrina$/)
})

test('aucun modèle par défaut ne trahit la nature du rendez-vous', () => {
  const interdits = /(psycholog|thérap|séance|consultation|patient|cabinet|clinique)/i
  for (const m of MODELES_DEFAUT) {
    const rendu = rendreModele(m.corps, variablesDe(seance(), patient(), reglages))
    assert.equal(interdits.test(rendu), false, `${m.nom} : « ${rendu} »`)
  }
})

test('le message neutre renforcé retire la signature et le lieu', () => {
  const p = patient({ messageNeutreRenforce: true })
  const v = variablesDe(seance(), p, reglages)
  assert.equal(v.signature, '')
  assert.equal(v.adresse, '')
  const m = messagePour(seance(), p, reglages, MODELES_DEFAUT[2])
  assert.equal(m.includes('Oliviers'), false)
  assert.equal(m.includes('Sabrina'), false)
  // Le « au » orphelin et la ponctuation en double doivent avoir été nettoyés.
  assert.equal(/\s{2,}/.test(m), false, m)
  assert.equal(/,\s*\./.test(m), false, m)
  assert.equal(/\.\./.test(m), false, m)
})

test('une variable inconnue est laissée telle quelle, pas effacée en silence', () => {
  assert.equal(rendreModele('Bonjour {inconnue}', { prenom: 'A' }), 'Bonjour {inconnue}')
})

test('un modèle personnalisé accepte toutes les variables', () => {
  const corps = '{prenom} {nom} {jour} {date} {heure} {duree} {tarif} {lien_visio}'
  const rendu = rendreModele(corps, variablesDe(seance(), patient(), reglages))
  assert.equal(rendu.includes('{'), false)
  assert.match(rendu, /Amina Démo mercredi/)
})

/* ---------------- Liens ---------------- */

test('le lien WhatsApp encode le message et les sauts de ligne', () => {
  const lien = lienWhatsApp('213551234567', 'Bonjour Amina,\nà demain.')
  assert.match(lien, /^https:\/\/wa\.me\/213551234567\?text=/)
  assert.match(lien, /%0A/)
  assert.equal(lien.includes(' '), false)
})

test('les caractères accentués passent le lien sans dommage', () => {
  const message = 'À demain, éàçù « ok »'
  const lien = lienWhatsApp('213551234567', message)
  const relu = decodeURIComponent(lien.split('?text=')[1])
  assert.equal(relu, message)
})

test('le lien SMS change de séparateur selon la plateforme', () => {
  assert.match(lienSms('213551234567', 'Bonjour', true), /^sms:\+213551234567&body=/)
  assert.match(lienSms('213551234567', 'Bonjour', false), /^sms:\+213551234567\?body=/)
})
