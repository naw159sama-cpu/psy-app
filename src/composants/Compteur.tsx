import { useEffect, useRef, useState } from 'react'

/**
 * Fait défiler un montant de sa valeur précédente jusqu'à la nouvelle.
 * Purement décoratif : la valeur finale est toujours exacte.
 */
export function useCompteur(valeur: number, duree = 750): number {
  const [affiche, setAffiche] = useState(valeur)
  const depart = useRef(valeur)
  const image = useRef(0)

  useEffect(() => {
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const de = depart.current
    if (reduit || de === valeur) {
      depart.current = valeur
      setAffiche(valeur)
      return
    }
    const t0 = performance.now()
    const pas = (t: number) => {
      const avance = Math.min(1, (t - t0) / duree)
      // Décélération douce, comme le reste des transitions du système.
      const adouci = 1 - Math.pow(1 - avance, 3)
      setAffiche(Math.round(de + (valeur - de) * adouci))
      if (avance < 1) image.current = requestAnimationFrame(pas)
      else depart.current = valeur
    }
    image.current = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(image.current)
  }, [valeur, duree])

  return affiche
}
