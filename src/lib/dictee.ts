/**
 * Dictée vocale, par la reconnaissance vocale du navigateur.
 *
 * À savoir, et c'est écrit dans l'interface : sur Chrome comme sur Safari, le
 * son est transmis au service de reconnaissance de l'éditeur du navigateur pour
 * y être transcrit. Le texte revient dans le téléphone et n'en repart plus,
 * mais la voix, elle, est sortie. La dictée du clavier du téléphone est souvent
 * traitée sur l'appareil : c'est l'option la plus discrète.
 */

type Reconnaissance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechEvenement) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

interface SpeechEvenement {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

type Constructeur = new () => Reconnaissance

function constructeur(): Constructeur | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: Constructeur
    webkitSpeechRecognition?: Constructeur
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function dicteeDisponible(): boolean {
  return constructeur() !== null
}

export const MESSAGES_ERREUR: Record<string, string> = {
  'not-allowed': 'Micro refusé. Autorisez-le dans les réglages du navigateur.',
  'service-not-allowed': 'Micro refusé par le système.',
  'audio-capture': 'Aucun micro détecté.',
  network: 'Pas de connexion : la dictée a besoin d’Internet.',
  'no-speech': 'Rien n’a été entendu.',
  aborted: '',
}

export interface OptionsDictee {
  /** Appelé avec chaque bout de phrase terminé. */
  surTexte: (morceau: string) => void
  /** Appelé pendant la parole, avant que la phrase soit arrêtée. */
  surProvisoire?: (morceau: string) => void
  surErreur?: (message: string) => void
  surFin?: () => void
}

export interface SessionDictee {
  arreter: () => void
}

/**
 * Démarre une session. Relance d'elle-même tant qu'on ne l'a pas arrêtée :
 * la reconnaissance des navigateurs se coupe seule après un silence.
 */
export function demarrerDictee(options: OptionsDictee): SessionDictee | null {
  const C = constructeur()
  if (!C) return null

  const reco = new C()
  reco.lang = 'fr-FR'
  reco.continuous = true
  reco.interimResults = true
  reco.maxAlternatives = 1

  let arretDemande = false
  let echecs = 0

  reco.onresult = (e) => {
    let provisoire = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      const texte = r[0].transcript
      if (r.isFinal) options.surTexte(texte)
      else provisoire += texte
    }
    if (provisoire) options.surProvisoire?.(provisoire)
  }

  reco.onerror = (e) => {
    if (e.error === 'aborted') return
    // Un silence n'est pas une erreur : on laisse la relance faire son travail.
    if (e.error === 'no-speech') return
    echecs++
    const message = MESSAGES_ERREUR[e.error] ?? 'La dictée s’est interrompue.'
    if (message) options.surErreur?.(message)
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || echecs > 3) {
      arretDemande = true
    }
  }

  reco.onend = () => {
    if (arretDemande) { options.surFin?.(); return }
    try { reco.start() } catch { options.surFin?.() }
  }

  try {
    reco.start()
  } catch {
    return null
  }

  return {
    arreter: () => {
      arretDemande = true
      try { reco.stop() } catch { /* déjà arrêtée */ }
    },
  }
}

/**
 * Recolle un morceau dicté à ce qui est déjà écrit : espace là où il faut,
 * majuscule en début de phrase, et pas de doublon d'espace.
 */
export function fusionner(actuel: string, morceau: string): string {
  const ajout = morceau.trim()
  if (!ajout) return actuel
  const base = actuel.replace(/[ \t]+$/, '')
  if (!base) return ajout.charAt(0).toUpperCase() + ajout.slice(1)
  // Après un point, on repart sur une majuscule.
  const finDePhrase = /[.!?…]$/.test(base)
  const suite = finDePhrase ? ajout.charAt(0).toUpperCase() + ajout.slice(1) : ajout
  const separateur = base.endsWith('\n') ? '' : ' '
  return `${base}${separateur}${suite}`
}
