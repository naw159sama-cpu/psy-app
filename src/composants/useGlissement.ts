import { useCallback, useEffect, useRef } from 'react'

/** Déplacement minimal avant de décider qu'il s'agit d'un glissement. */
const SEUIL_DEMARRAGE = 6
/** Part de la hauteur du panneau au-delà de laquelle on ferme. */
const PART_FERMETURE = 0.25
/** Vitesse (px/ms) suffisante pour fermer même sans avoir beaucoup descendu. */
const VITESSE_FERMETURE = 0.5
/** Fenêtre (ms) sur laquelle la vitesse du geste est moyennée. */
const FENETRE_VITESSE = 100
/** Durée de l'animation de fermeture, alignée sur celle d'ouverture. */
const DUREE_FERMETURE = 220

function mouvementReduit(): boolean {
  return typeof window !== 'undefined'
    && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Les éléments où un appui doit rester un appui, pas devenir un glissement. */
function estInteractif(cible: EventTarget | null): boolean {
  if (!(cible instanceof Element)) return false
  return !!cible.closest('input, textarea, select, button, a, [contenteditable="true"]')
}

/**
 * Glissement vers le bas pour fermer un panneau.
 *
 * Repose sur les Pointer Events : souris, tactile et stylet passent par le même
 * chemin, et `setPointerCapture` garantit qu'on reçoit la fin du geste même si
 * le doigt sort du panneau. Le panneau suit le doigt en `translateY`, jamais en
 * `height` ou `top`, pour ne déclencher aucun recalcul de mise en page.
 */
export function useGlissement(onFermer: () => void) {
  const refFeuille = useRef<HTMLDivElement | null>(null)
  const refVoile = useRef<HTMLDivElement | null>(null)
  const ferme = useRef(false)

  const geste = useRef({
    candidat: false,
    actif: false,
    pointerId: -1,
    xDepart: 0,
    yDepart: 0,
    /** Repère glissant pour la vitesse, rafraîchi toutes les ~100 ms. */
    yRepere: 0,
    tRepere: 0,
    vitesse: 0,
    /** Le geste part de la poignée : on glisse même si le contenu est défilé. */
    depuisPoignee: false,
  })

  /** Position du panneau et opacité du fond, pendant le geste. */
  const peindre = useCallback((dy: number) => {
    const f = refFeuille.current
    if (!f) return
    f.style.transform = dy === 0 ? '' : `translateY(${dy}px)`
    const v = refVoile.current
    if (v) {
      const part = Math.min(1, Math.max(0, dy) / (f.offsetHeight || 1))
      v.style.opacity = String(1 - part * 0.85)
    }
  }, [])

  const fermerAnime = useCallback(() => {
    if (ferme.current) return
    ferme.current = true
    const f = refFeuille.current
    if (!f || mouvementReduit()) { onFermer(); return }
    f.style.transition = `transform ${DUREE_FERMETURE}ms cubic-bezier(.3,0,.8,.15)`
    f.style.transform = `translateY(${f.offsetHeight}px)`
    const v = refVoile.current
    if (v) {
      v.style.transition = `opacity ${DUREE_FERMETURE}ms ease`
      v.style.opacity = '0'
    }
    setTimeout(onFermer, DUREE_FERMETURE)
  }, [onFermer])

  /** Retour à la position ouverte, avec un léger effet de ressort. */
  const revenir = useCallback(() => {
    const f = refFeuille.current
    if (!f) return
    f.style.transition = mouvementReduit()
      ? 'none'
      : 'transform .34s cubic-bezier(.22,1.2,.36,1)'
    f.style.transform = ''
    const v = refVoile.current
    if (v) {
      v.style.transition = 'opacity .3s ease'
      v.style.opacity = ''
    }
    setTimeout(() => {
      if (f) f.style.transition = ''
      if (v) v.style.transition = ''
    }, 360)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const f = refFeuille.current
    if (!f || e.button !== 0) return

    const surPoignee = e.target instanceof Element && !!e.target.closest('[data-poignee]')
    if (!surPoignee && estInteractif(e.target)) return
    // Hors poignée, le glissement ne prend la main que si le contenu est en haut :
    // sinon c'est au défilement natif de jouer.
    if (!surPoignee && f.scrollTop > 0) return

    const g = geste.current
    g.candidat = true
    g.actif = false
    g.pointerId = e.pointerId
    g.xDepart = e.clientX
    g.yDepart = e.clientY
    g.yRepere = e.clientY
    g.tRepere = e.timeStamp
    g.vitesse = 0
    g.depuisPoignee = surPoignee
    f.style.transition = ''
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const g = geste.current
    const f = refFeuille.current
    if (!f || !g.candidat || e.pointerId !== g.pointerId) return

    const dx = e.clientX - g.xDepart
    const dy = e.clientY - g.yDepart

    if (!g.actif) {
      if (Math.abs(dy) < SEUIL_DEMARRAGE && Math.abs(dx) < SEUIL_DEMARRAGE) return
      // Geste horizontal, ou remontée alors que le contenu peut défiler : on laisse.
      if (Math.abs(dx) > Math.abs(dy) || (dy < 0 && !g.depuisPoignee)) {
        g.candidat = false
        return
      }
      g.actif = true
      // La capture peut être refusée (pointeur déjà relâché) : ce n’est pas
      // une raison pour interrompre le geste.
      try { f.setPointerCapture(e.pointerId) } catch { /* sans conséquence */ }
    }

    // Vitesse mesurée sur une petite fenêtre glissante plutôt que d'un
    // événement à l'autre : deux points trop rapprochés ne l'effacent pas.
    const dt = e.timeStamp - g.tRepere
    if (dt > 0) g.vitesse = (e.clientY - g.yRepere) / dt
    if (dt > FENETRE_VITESSE) { g.yRepere = e.clientY; g.tRepere = e.timeStamp }

    // Résistance élastique si l'on tire vers le haut au-delà de l'ouverture.
    peindre(dy >= 0 ? dy : -Math.pow(-dy, 0.7))
  }, [peindre])

  const terminer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const g = geste.current
    const f = refFeuille.current
    if (!g.candidat || e.pointerId !== g.pointerId) return
    const etaitActif = g.actif
    g.candidat = false
    g.actif = false
    try {
      if (f?.hasPointerCapture(e.pointerId)) f.releasePointerCapture(e.pointerId)
    } catch { /* sans conséquence */ }
    if (!etaitActif || !f) return

    const parcouru = e.clientY - g.yDepart
    const assezLoin = parcouru > f.offsetHeight * PART_FERMETURE
    const assezVite = g.vitesse > VITESSE_FERMETURE && parcouru > SEUIL_DEMARRAGE * 4
    if (assezLoin || assezVite) fermerAnime()
    else revenir()
  }, [fermerAnime, revenir])

  // Fermeture au clavier, et blocage du défilement de la page derrière.
  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') fermerAnime() }
    document.addEventListener('keydown', echap)
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', echap)
      document.body.style.overflow = avant
    }
  }, [fermerAnime])

  return {
    refFeuille,
    refVoile,
    /** Ferme avec l'animation, pour le bouton de fermeture et le fond. */
    fermer: fermerAnime,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: terminer,
      onPointerCancel: terminer,
    },
  }
}
