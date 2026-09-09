import { useSyncExternalStore } from 'react'
import { abonnerModifications, adopter, lire } from './store'
import {
  archiver, creerCoffre, derniereArchive, ecrireCoffre, ErreurCoffre, lireCoffre,
  purgerHistorique, quelGarder, sessionValide, type Session,
} from './nuage.ts'
import { coffreConfigure } from './config.ts'

/**
 * La navette entre le téléphone et le coffre.
 *
 * Le téléphone reste la source de vérité de la séance en cours : on écrit
 * d'abord en local, toujours, et l'envoi suit. C'est ce qui permet de
 * travailler dans une pièce sans réseau sans même s'en apercevoir.
 */

const CLE_VERSION = 'psy-app:coffre-version'
const CLE_ATTENTE = 'psy-app:coffre-attente'

/** Le temps qu'on laisse à une saisie de se terminer avant de l'envoyer. */
const ATTENTE_ENVOI = 1_500
/** Après un échec, on réessaie de plus en plus tard, sans jamais abandonner. */
const REPRISES = [5_000, 20_000, 60_000, 180_000]

export type Phase =
  | 'local'        // pas de coffre configuré : l'application vit sur le téléphone
  | 'deconnecte'
  | 'chargement'
  | 'a-jour'
  | 'envoi'
  | 'attente'      // des modifications attendent le réseau ou la fin de la saisie
  | 'erreur'

export interface EtatSynchro {
  phase: Phase
  message: string
  /** Instant du dernier envoi réussi, au format ISO. */
  dernierEnvoi: string | null
  /** Vrai tant que des modifications locales ne sont pas dans le coffre. */
  enAttente: boolean
}

let etat: EtatSynchro = {
  phase: coffreConfigure() ? 'deconnecte' : 'local',
  message: '',
  dernierEnvoi: null,
  enAttente: lireAttente(),
}

const abonnes = new Set<() => void>()

function poser(champs: Partial<EtatSynchro>) {
  etat = { ...etat, ...champs }
  abonnes.forEach((f) => f())
}

export function useSynchro(): EtatSynchro {
  return useSyncExternalStore(
    (f) => { abonnes.add(f); return () => { abonnes.delete(f) } },
    () => etat,
    () => etat,
  )
}

export function etatSynchro(): EtatSynchro {
  return etat
}

/* ---------- Mémoire de bord ---------- */

function lireVersion(): number {
  const v = Number(localStorage.getItem(CLE_VERSION))
  return Number.isFinite(v) && v > 0 ? v : 0
}

function ecrireVersion(v: number) {
  try { localStorage.setItem(CLE_VERSION, String(v)) } catch { /* tant pis */ }
}

function lireAttente(): boolean {
  try { return localStorage.getItem(CLE_ATTENTE) === '1' } catch { return false }
}

function ecrireAttente(v: boolean) {
  try {
    if (v) localStorage.setItem(CLE_ATTENTE, '1')
    else localStorage.removeItem(CLE_ATTENTE)
  } catch { /* tant pis */ }
}

/* ---------- Le moteur ---------- */

let session: Session | null = null
let minuteur: ReturnType<typeof setTimeout> | null = null
let echecs = 0
let enCours = false
let desabonner: (() => void) | null = null
let archiveFaite = false

function programmer(delai: number) {
  if (minuteur) clearTimeout(minuteur)
  minuteur = setTimeout(() => { minuteur = null; void envoyer() }, delai)
}

/**
 * Envoie le document local. Un seul envoi à la fois : si une modification
 * arrive pendant, elle repart d'elle-même au tour suivant grâce au drapeau
 * d'attente, qui n'est levé qu'après confirmation du serveur.
 */
async function envoyer(): Promise<void> {
  if (enCours || !session) return
  if (!lireAttente()) { poser({ phase: 'a-jour', enAttente: false, message: '' }); return }

  enCours = true
  poser({ phase: 'envoi', message: '' })

  try {
    const s = await sessionValide()
    if (!s) { session = null; poser({ phase: 'deconnecte', message: 'Session expirée.' }); return }
    session = s

    const document = lire()
    let coffre = await ecrireCoffre(s, document, lireVersion())

    if (!coffre) {
      // Quelqu'un — un autre appareil, un autre onglet — a écrit entre-temps.
      const distant = await lireCoffre(s)
      if (!distant) {
        coffre = await creerCoffre(s, document)
      } else if (quelGarder(document, distant.document) === 'distant') {
        // Le coffre est plus récent : on garde une copie de ce qu'on allait
        // envoyer, puis on adopte sa version.
        await archiver(s, document, 'conflit').catch(() => {})
        adopter(distant.document)
        ecrireVersion(distant.version)
        ecrireAttente(false)
        poser({
          phase: 'a-jour', enAttente: false, dernierEnvoi: distant.majLe,
          message: 'Une version plus récente a été trouvée en ligne. Elle a été reprise ; la vôtre est gardée dans l’historique.',
        })
        echecs = 0
        return
      } else {
        await archiver(s, distant.document, 'conflit').catch(() => {})
        coffre = await ecrireCoffre(s, document, distant.version)
        if (!coffre) throw new ErreurCoffre(409, 'Le coffre change trop vite. Réessayez.')
      }
    }

    ecrireVersion(coffre.version)
    ecrireAttente(false)
    echecs = 0
    poser({ phase: 'a-jour', enAttente: false, dernierEnvoi: coffre.majLe, message: '' })
    void archiveQuotidienne()
  } catch (e) {
    const erreur = e instanceof ErreurCoffre ? e : new ErreurCoffre(0, 'Échec de l’envoi.')
    if (erreur.statut === 401 || erreur.statut === 403) {
      session = null
      poser({ phase: 'deconnecte', message: 'Session expirée. Reconnectez-vous.' })
      return
    }
    // Rien n'est perdu : le document reste sur le téléphone et repartira.
    poser({
      phase: 'erreur',
      enAttente: true,
      message: erreur.statut === 0
        ? 'Pas de connexion. Vos modifications sont gardées sur ce téléphone et partiront au retour du réseau.'
        : erreur.message,
    })
    programmer(REPRISES[Math.min(echecs, REPRISES.length - 1)])
    echecs++
  } finally {
    enCours = false
  }
}

/** Une copie datée par journée de travail, pas davantage. */
async function archiveQuotidienne(): Promise<void> {
  if (archiveFaite || !session) return
  archiveFaite = true
  try {
    const derniere = await derniereArchive(session)
    const aujourdhui = new Date().toISOString().slice(0, 10)
    if (derniere && derniere.slice(0, 10) === aujourdhui) return
    await archiver(session, lire(), 'jour')
    await purgerHistorique(session)
  } catch { /* une copie ratée n'arrête rien */ }
}

/** Premier échange au démarrage : on met les deux copies d'accord. */
async function premierEchange(): Promise<void> {
  if (!session) return
  poser({ phase: 'chargement', message: '' })
  try {
    const local = lire()
    const distant = await lireCoffre(session)

    if (!distant) {
      const cree = await creerCoffre(session, local)
      ecrireVersion(cree.version)
      ecrireAttente(false)
      poser({ phase: 'a-jour', enAttente: false, dernierEnvoi: cree.majLe, message: '' })
    } else {
      ecrireVersion(distant.version)
      const garder = quelGarder(local, distant.document)
      if (garder === 'distant') {
        adopter(distant.document)
        ecrireAttente(false)
        poser({ phase: 'a-jour', enAttente: false, dernierEnvoi: distant.majLe, message: '' })
      } else if (garder === 'local') {
        ecrireAttente(true)
        poser({ phase: 'attente', enAttente: true, message: '' })
        await envoyer()
      } else {
        ecrireAttente(false)
        poser({ phase: 'a-jour', enAttente: false, dernierEnvoi: distant.majLe, message: '' })
      }
    }
    void archiveQuotidienne()
  } catch (e) {
    const erreur = e instanceof ErreurCoffre ? e : new ErreurCoffre(0, 'Coffre injoignable.')
    if (erreur.statut === 401 || erreur.statut === 403) {
      session = null
      poser({ phase: 'deconnecte', message: 'Session expirée. Reconnectez-vous.' })
      return
    }
    poser({ phase: 'erreur', message: erreur.message })
    programmer(REPRISES[0])
  }
}

/** Branche la navette. À appeler une fois la session obtenue. */
export function demarrer(s: Session) {
  session = s
  echecs = 0
  archiveFaite = false

  desabonner?.()
  desabonner = abonnerModifications(() => {
    ecrireAttente(true)
    poser({ phase: 'attente', enAttente: true })
    programmer(ATTENTE_ENVOI)
  })

  window.addEventListener('online', reprendre)
  document.addEventListener('visibilitychange', reprendreSiVisible)
  void premierEchange()
}

export function arreter() {
  session = null
  desabonner?.()
  desabonner = null
  if (minuteur) { clearTimeout(minuteur); minuteur = null }
  window.removeEventListener('online', reprendre)
  document.removeEventListener('visibilitychange', reprendreSiVisible)
  poser({ phase: coffreConfigure() ? 'deconnecte' : 'local', message: '', dernierEnvoi: null })
}

function reprendre() {
  echecs = 0
  if (session && lireAttente()) programmer(0)
}

function reprendreSiVisible() {
  if (document.visibilityState === 'visible') reprendre()
}

/** Le bouton « Envoyer maintenant » des réglages. */
export function forcerEnvoi() {
  echecs = 0
  if (!session) return
  if (!lireAttente()) { void premierEchange(); return }
  programmer(0)
}

/* ---------- Ce que l'utilisatrice lit ---------- */

export function libelleEtat(e: EtatSynchro): string {
  switch (e.phase) {
    case 'local': return 'Sur ce téléphone'
    case 'deconnecte': return 'Déconnectée'
    case 'chargement': return 'Ouverture du coffre…'
    case 'envoi': return 'Enregistrement…'
    case 'attente': return 'À enregistrer'
    case 'erreur': return e.message.startsWith('Pas de connexion') ? 'Hors ligne' : 'Échec'
    case 'a-jour': return 'Enregistré'
  }
}

export function tonEtat(e: EtatSynchro): 'ok' | 'attente' | 'alerte' | 'neutre' {
  switch (e.phase) {
    case 'a-jour': return 'ok'
    case 'envoi': case 'chargement': case 'attente': return 'attente'
    case 'erreur': case 'deconnecte': return 'alerte'
    case 'local': return 'neutre'
  }
}
