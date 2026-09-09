import { NUAGE_CLE, NUAGE_URL } from './config.ts'
import type { Donnees } from './types'

/**
 * Le coffre en ligne, parlé en HTTP direct.
 *
 * Supabase publie deux interfaces web documentées et stables : GoTrue pour les
 * comptes, PostgREST pour les données. Les appeler avec `fetch` tient en deux
 * cents lignes lisibles, contre une bibliothèque de plusieurs centaines de
 * kilooctets qu'il faudrait suivre pendant des années. Pour une application
 * qui doit rester réparable dans dix ans, c'est le bon échange.
 */

const CLE_SESSION = 'psy-app:session'

export interface Session {
  jeton: string
  rafraichissement: string
  /** Date de péremption du jeton, en millisecondes depuis 1970. */
  expireLe: number
  utilisateur: { id: string; email: string }
}

export interface Coffre {
  document: Donnees
  version: number
  majLe: string
}

/* ------------------------------------------------------------------ *
 * Décisions pures — tout ce qui se teste sans réseau                 *
 * ------------------------------------------------------------------ */

/** Une marge d'une minute : mieux vaut rafraîchir un peu tôt que trop tard. */
export const MARGE_PEREMPTION = 60_000

export function sessionPerimee(
  session: Session | null, maintenant: number, marge = MARGE_PEREMPTION,
): boolean {
  if (!session) return true
  return session.expireLe - marge <= maintenant
}

function vide(d: Donnees): boolean {
  return (d.patients?.length ?? 0) === 0 && (d.seances?.length ?? 0) === 0
}

/**
 * Lequel des deux documents garder.
 *
 * La date de dernière modification tranche — mais deux garde-fous passent
 * avant elle : **un document vide ne remplace jamais un document plein**. Une
 * mémoire de navigateur effacée, ou un coffre encore neuf, ne doivent pas
 * pouvoir emporter des dossiers. Le perdant n'est de toute façon jamais jeté :
 * il part dans l'historique avant que l'autre ne prenne sa place.
 */
export function quelGarder(local: Donnees, distant: Donnees): 'local' | 'distant' | 'identique' {
  const lVide = vide(local)
  const dVide = vide(distant)
  if (lVide && dVide) return 'identique'
  if (dVide) return 'local'
  if (lVide) return 'distant'
  if (local.majLe === distant.majLe) return 'identique'
  if (!distant.majLe) return 'local'
  if (!local.majLe) return 'distant'
  return local.majLe > distant.majLe ? 'local' : 'distant'
}

/** Un message en français, et jamais le texte brut d'une erreur technique. */
export function messageErreur(statut: number, corps?: unknown): string {
  const code = typeof corps === 'object' && corps !== null
    ? String((corps as Record<string, unknown>).error_code
        ?? (corps as Record<string, unknown>).code ?? '')
    : ''

  // Le rassurant « rien n'est perdu » n'a de sens que pendant une
  // synchronisation : c'est la navette qui l'ajoute, pas ce message-ci.
  if (statut === 0) return 'Pas de connexion à Internet.'
  if (statut === 400 || statut === 401) {
    if (code === 'email_not_confirmed') return 'Cette adresse n’a pas encore été confirmée.'
    return 'Adresse ou mot de passe incorrect.'
  }
  if (statut === 403) return 'Ce compte n’a pas accès à ce coffre.'
  if (statut === 422) return 'Le mot de passe doit faire au moins six caractères.'
  if (statut === 429) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (statut >= 500) return 'Le serveur ne répond pas. Réessayez dans un moment.'
  return 'Échec de l’opération. Réessayez.'
}

/* ------------------------------------------------------------------ *
 * Session — gardée sur le téléphone, comme un jeton de vestiaire      *
 * ------------------------------------------------------------------ */

export function lireSession(): Session | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION)
    if (!brut) return null
    const s = JSON.parse(brut) as Session
    return s?.jeton && s?.utilisateur?.id ? s : null
  } catch {
    return null
  }
}

function ecrireSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s))
    else localStorage.removeItem(CLE_SESSION)
  } catch { /* le navigateur refuse d'écrire : on continue sans mémoire */ }
}

interface ReponseJeton {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email: string }
}

function versSession(r: ReponseJeton): Session {
  return {
    jeton: r.access_token,
    rafraichissement: r.refresh_token,
    expireLe: Date.now() + r.expires_in * 1000,
    utilisateur: { id: r.user.id, email: r.user.email },
  }
}

/** Erreur portant un message déjà écrit en français. */
export class ErreurCoffre extends Error {
  statut: number
  constructor(statut: number, message: string) {
    super(message)
    this.statut = statut
    this.name = 'ErreurCoffre'
  }
}

async function appeler(chemin: string, options: RequestInit & { jeton?: string } = {}) {
  const { jeton, headers, ...reste } = options
  let reponse: Response
  try {
    reponse = await fetch(`${NUAGE_URL}${chemin}`, {
      ...reste,
      headers: {
        apikey: NUAGE_CLE,
        'Content-Type': 'application/json',
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        ...(headers as Record<string, string> | undefined),
      },
    })
  } catch {
    // Coupure réseau : le navigateur ne donne pas de statut.
    throw new ErreurCoffre(0, messageErreur(0))
  }

  const texte = await reponse.text()
  const corps = texte ? (() => { try { return JSON.parse(texte) } catch { return texte } })() : null
  if (!reponse.ok) throw new ErreurCoffre(reponse.status, messageErreur(reponse.status, corps))
  return corps
}

/* ------------------------------------------------------------------ *
 * Comptes                                                             *
 * ------------------------------------------------------------------ */

export async function connecter(email: string, motDePasse: string): Promise<Session> {
  const r = await appeler('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password: motDePasse }),
  }) as ReponseJeton
  const s = versSession(r)
  ecrireSession(s)
  return s
}

export async function deconnecter(): Promise<void> {
  const s = lireSession()
  ecrireSession(null)
  if (!s) return
  // La session locale est déjà effacée : l'échec côté serveur n'a pas d'importance.
  try {
    await appeler('/auth/v1/logout', { method: 'POST', jeton: s.jeton })
  } catch { /* rien à faire */ }
}

/**
 * Rend une session utilisable, en la renouvelant si son jeton a expiré.
 * Renvoie null quand le renouvellement échoue : il faut alors se reconnecter.
 */
export async function sessionValide(): Promise<Session | null> {
  const s = lireSession()
  if (!s) return null
  if (!sessionPerimee(s, Date.now())) return s
  try {
    const r = await appeler('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: s.rafraichissement }),
    }) as ReponseJeton
    const neuve = versSession(r)
    ecrireSession(neuve)
    return neuve
  } catch (e) {
    // Hors ligne : la session n'est pas invalide, seulement invérifiable.
    // On la garde, pour que l'application reste ouverte dans le métro.
    if (e instanceof ErreurCoffre && e.statut === 0) return s
    ecrireSession(null)
    return null
  }
}

export async function changerMotDePasse(nouveau: string): Promise<void> {
  const s = await sessionValide()
  if (!s) throw new ErreurCoffre(401, 'Session expirée. Reconnectez-vous.')
  await appeler('/auth/v1/user', {
    method: 'PUT',
    jeton: s.jeton,
    body: JSON.stringify({ password: nouveau }),
  })
}

export async function envoyerReinitialisation(email: string): Promise<void> {
  await appeler('/auth/v1/recover', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  })
}

/* ------------------------------------------------------------------ *
 * Le coffre                                                           *
 * ------------------------------------------------------------------ */

interface LigneCoffre { document: Donnees; version: number; maj_le: string }

/** Le document en ligne, ou null si le coffre n'a jamais été rempli. */
export async function lireCoffre(s: Session): Promise<Coffre | null> {
  const lignes = await appeler('/rest/v1/coffre?select=document,version,maj_le&limit=1', {
    jeton: s.jeton,
  }) as LigneCoffre[]
  const l = lignes?.[0]
  return l ? { document: l.document, version: l.version, majLe: l.maj_le } : null
}

/** Premier remplissage. */
export async function creerCoffre(s: Session, document: Donnees): Promise<Coffre> {
  const lignes = await appeler('/rest/v1/coffre', {
    method: 'POST',
    jeton: s.jeton,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ utilisateur: s.utilisateur.id, document, version: 1 }),
  }) as LigneCoffre[]
  const l = lignes[0]
  return { document: l.document, version: l.version, majLe: l.maj_le }
}

/**
 * Écrit, à condition que personne n'ait écrit entre-temps. Le filtre sur la
 * version fait ce travail dans la base elle-même : si elle a changé, aucune
 * ligne n'est modifiée et l'on récupère zéro résultat.
 *
 * Renvoie null en cas de conflit, pour que l'appelant aille voir ce qui s'est
 * passé plutôt que d'écraser.
 */
export async function ecrireCoffre(
  s: Session, document: Donnees, versionAttendue: number,
): Promise<Coffre | null> {
  const lignes = await appeler(
    `/rest/v1/coffre?utilisateur=eq.${s.utilisateur.id}&version=eq.${versionAttendue}`,
    {
      method: 'PATCH',
      jeton: s.jeton,
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        document,
        version: versionAttendue + 1,
        maj_le: new Date().toISOString(),
      }),
    },
  ) as LigneCoffre[]
  const l = lignes?.[0]
  return l ? { document: l.document, version: l.version, majLe: l.maj_le } : null
}

/** Dépose une copie datée. Jamais bloquant : une copie ratée n'arrête rien. */
export async function archiver(
  s: Session, document: Donnees, motif: 'jour' | 'conflit',
): Promise<void> {
  await appeler('/rest/v1/coffre_historique', {
    method: 'POST',
    jeton: s.jeton,
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ utilisateur: s.utilisateur.id, document, motif }),
  })
}

/** Date de la copie automatique la plus récente, ou null s'il n'y en a pas. */
export async function derniereArchive(s: Session): Promise<string | null> {
  const lignes = await appeler(
    '/rest/v1/coffre_historique?select=cree_le&motif=eq.jour&order=cree_le.desc&limit=1',
    { jeton: s.jeton },
  ) as Array<{ cree_le: string }>
  return lignes?.[0]?.cree_le ?? null
}

export async function purgerHistorique(s: Session): Promise<void> {
  await appeler('/rest/v1/rpc/purger_historique', {
    method: 'POST',
    jeton: s.jeton,
    headers: { Prefer: 'return=minimal' },
    body: '{}',
  })
}
