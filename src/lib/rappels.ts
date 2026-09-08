import type { Modele, Patient, Reglages, Seance } from './types'
import { JOURS, age, ajouterJours, dateDeIso, dateLongue } from './dates.ts'
import { da } from './format.ts'
import { normaliserNumero } from './telephone.ts'

/**
 * Aucun modèle ne doit laisser deviner qu'il s'agit d'un rendez-vous chez une
 * psychologue : le téléphone peut être consulté par un proche. Pas de « séance »,
 * pas de « consultation », pas de nom de cabinet.
 */
export const MODELES_DEFAUT: Modele[] = [
  {
    id: 'veille',
    nom: 'Rappel de la veille',
    corps: 'Bonjour {prenom}, je vous confirme notre rendez-vous de demain {jour} à {heure}. À demain. {signature}',
    actif: true,
  },
  {
    id: 'confirmation',
    nom: 'Confirmation de prise de rendez-vous',
    corps: 'Bonjour {prenom}, votre rendez-vous est bien noté pour le {date} à {heure}. {signature}',
    actif: true,
  },
  {
    id: 'premiere',
    nom: 'Première rencontre, avec adresse',
    corps: 'Bonjour {prenom}, je vous confirme notre premier rendez-vous le {date} à {heure}, au {adresse}. À bientôt. {signature}',
    actif: true,
  },
  {
    id: 'distance',
    nom: 'Rendez-vous à distance',
    corps: 'Bonjour {prenom}, je vous confirme notre rendez-vous de demain {jour} à {heure}. Voici le lien : {lien_visio}. À demain. {signature}',
    actif: true,
  },
  {
    id: 'report',
    nom: 'Report ou annulation',
    corps: 'Bonjour {prenom}, je dois malheureusement décaler notre rendez-vous du {date}. Je vous propose de convenir d’un autre créneau. {signature}',
    actif: true,
  },
]

export const VARIABLES = [
  'prenom', 'nom', 'jour', 'date', 'heure', 'duree', 'adresse', 'lien_visio',
  'tarif', 'signature',
] as const

/** Au-delà, certains navigateurs tronquent l'URL du lien wa.me. */
export const LONGUEUR_ALERTE = 1000

/* ------------------------------------------------------------------ */
/* Destinataire                                                        */
/* ------------------------------------------------------------------ */

export interface Destinataire {
  numero: string
  /** À qui l'on écrit réellement : la personne, ou son représentant légal. */
  nom: string
  viaRepresentant: boolean
}

export interface Exclusion {
  motif: string
}

export type Eligibilite =
  | { eligible: true; destinataire: Destinataire }
  | { eligible: false; motif: string }

/** Un dossier de mineur écrit au représentant légal, jamais au mineur. */
function estMineur(p: Patient): boolean {
  const a = age(p.dateNaissance)
  return a !== null && a < 18
}

/**
 * Qui peut recevoir un rappel, et sinon pourquoi pas.
 * Les exclusions sont affichées, jamais masquées.
 */
export function eligibilite(p: Patient | undefined, r: Reglages): Eligibilite {
  if (!p) return { eligible: false, motif: 'Dossier introuvable' }

  if (p.canalRappel === 'aucun') {
    return { eligible: false, motif: 'Consentement au rappel non recueilli' }
  }
  if (p.canalRappel === 'email') {
    return { eligible: false, motif: 'Rappel accepté par e-mail seulement' }
  }

  const mineur = estMineur(p)
  if (mineur && !p.representant?.telephone.trim()) {
    return { eligible: false, motif: 'Mineur : aucun représentant légal enregistré' }
  }

  const brut = mineur ? p.representant!.telephone : p.telephone
  if (!brut.trim()) return { eligible: false, motif: 'Pas de numéro renseigné' }

  const n = normaliserNumero(brut, r.indicatifPays)
  if (!n.valide) return { eligible: false, motif: `Numéro inutilisable : ${n.probleme.toLowerCase()}` }

  return {
    eligible: true,
    destinataire: {
      numero: n.international,
      nom: mineur ? (p.representant!.nom || 'Représentant légal') : `${p.prenom} ${p.nom}`.trim(),
      viaRepresentant: mineur,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Rendu des modèles                                                   */
/* ------------------------------------------------------------------ */

function duree(debut: string, fin: string): string {
  const [h1, m1] = debut.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

export function variablesDe(
  s: Seance, p: Patient, r: Reglages,
): Record<string, string> {
  const creneau = r.creneaux[s.creneau]
  const neutre = p.messageNeutreRenforce
  return {
    prenom: p.prenom,
    nom: p.nom,
    jour: JOURS[dateDeIso(s.date).getDay()],
    date: dateLongue(s.date),
    heure: creneau?.debut ?? '',
    duree: creneau ? duree(creneau.debut, creneau.fin) : '',
    // En message neutre renforcé, ni lieu ni signature ne doivent apparaître.
    adresse: neutre ? '' : r.adresseCabinet,
    lien_visio: r.lienVisioParDefaut,
    tarif: da(s.tarif),
    signature: neutre ? '' : r.signatureRappel,
  }
}

/**
 * Remplace les variables, puis répare ce que les valeurs vides laissent
 * derrière elles : espaces doublés, virgule orpheline, « au  . » et compagnie.
 */
export function rendreModele(corps: string, valeurs: Record<string, string>): string {
  const texte = corps.replace(/\{(\w+)\}/g, (entier, cle: string) => (
    cle in valeurs ? valeurs[cle] : entier
  ))

  // Chaque règle peut en rendre une autre applicable — « au {adresse}. » vide
  // laisse d'abord « au . », puis « , . », puis « ,. » — d'où les passes.
  const passe = (t: string) => t
    .replace(/\b(au|à la|le|la|à)\s+(?=[.,;!?])/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    // Le deux-points garde son espace : c'est la typographie française.
    .replace(/[ \t]+([.,;!?])/g, '$1')
    .replace(/,(?=\s*[.!?])/g, '')
    .replace(/,\s*$/g, '')
    .replace(/([.!?])\1+/g, '$1')
    .replace(/\n{3,}/g, '\n\n')

  let avant = texte
  for (let i = 0; i < 3; i++) {
    const apres = passe(avant)
    if (apres === avant) break
    avant = apres
  }
  return avant.trim()
}

export function messagePour(
  s: Seance, p: Patient, r: Reglages, modele: Modele,
): string {
  return rendreModele(modele.corps, variablesDe(s, p, r))
}

/* ------------------------------------------------------------------ */
/* Liens                                                               */
/* ------------------------------------------------------------------ */

/** Lien profond WhatsApp. Les sauts de ligne deviennent %0A. */
export function lienWhatsApp(numero: string, message: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
}

/**
 * Lien SMS. Le séparateur du corps diffère selon la plateforme :
 * « & » sur iOS, « ? » ailleurs.
 */
export function lienSms(numero: string, message: string, ios: boolean): string {
  return `sms:+${numero}${ios ? '&' : '?'}body=${encodeURIComponent(message)}`
}

export function estIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS se présente comme un Macintosh tactile depuis la version 13.
  return /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)
}

/* ------------------------------------------------------------------ */
/* Compte des rappels restants                                         */
/* ------------------------------------------------------------------ */

/**
 * Rendez-vous d'un jour donné pour lesquels un rappel est possible et
 * n'a pas encore été marqué comme envoyé.
 */
export function rappelsEnAttente(
  seances: Seance[], patients: Patient[], reglages: Reglages, date: string,
): number {
  return seances.filter((s) => (
    s.date === date
    && s.statut === 'prevu'
    && !s.rappelEnvoyeLe
    && eligibilite(patients.find((p) => p.id === s.patientId), reglages).eligible
  )).length
}

/** Vrai passé l'heure choisie pour préparer les rappels du lendemain. */
export function heurePassee(heure: string, maintenant = new Date()): boolean {
  const [h, m] = heure.split(':').map(Number)
  if (Number.isNaN(h)) return false
  return maintenant.getHours() * 60 + maintenant.getMinutes() >= h * 60 + (m || 0)
}

/**
 * Jour à rappeler : le prochain qui porte des rendez-vous, dans les huit jours.
 *
 * Le « lendemain » littéral ne convient pas à une semaine de travail discontinue :
 * un mardi soir, le prochain jour de consultation est le samedi, et c'est lui
 * qu'il faut préparer.
 */
export function prochainJourARappeler(
  seances: Seance[], depuisDate: string,
): string | null {
  for (let i = 0; i < 8; i++) {
    const jour = ajouterJours(depuisDate, i)
    if (seances.some((s) => s.date === jour && s.statut === 'prevu')) return jour
  }
  return null
}
