import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Part remplie, de 0 à 100. */
  pourcent: number
  taille?: number
  epaisseur?: number
  /** Teinte du tracé ; par défaut le vert sauge. */
  couleur?: string
}

/**
 * Anneau de progression. Le tracé se dessine à l'arrivée, puis suit la valeur :
 * c'est le seul endroit de l'application où un chiffre devient une forme.
 */
export default function Anneau({
  pourcent, taille = 46, epaisseur = 4, couleur = 'var(--sauge)',
}: Props) {
  const [dessine, setDessine] = useState(0)
  const image = useRef(0)

  const part = Math.max(0, Math.min(100, Math.round(pourcent)))
  const rayon = (taille - epaisseur) / 2
  const perimetre = 2 * Math.PI * rayon

  useEffect(() => {
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduit) { setDessine(part); return }
    const depart = performance.now()
    const debut = dessine
    const pas = (t: number) => {
      const avance = Math.min(1, (t - depart) / 700)
      const adouci = 1 - Math.pow(1 - avance, 3)
      setDessine(debut + (part - debut) * adouci)
      if (avance < 1) image.current = requestAnimationFrame(pas)
    }
    image.current = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(image.current)
    // `dessine` est volontairement absent : il sert de point de départ, pas de déclencheur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part])

  return (
    <span className="anneau" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} aria-hidden>
        <circle
          cx={taille / 2} cy={taille / 2} r={rayon}
          fill="none" stroke="currentColor" strokeWidth={epaisseur} opacity={0.18}
        />
        <circle
          cx={taille / 2} cy={taille / 2} r={rayon}
          fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round"
          strokeDasharray={perimetre}
          strokeDashoffset={perimetre * (1 - dessine / 100)}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
        />
      </svg>
      <span className="anneau-valeur">{part}%</span>
    </span>
  )
}
