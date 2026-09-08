import { useEffect, useRef, useState } from 'react'
import { IconeCroix } from './Icones'

interface Props {
  onFermer: () => void
}

const DUREE = 180 // 3 minutes
const PHASES = [
  { libelle: 'Inspirez', secondes: 4, classe: 'inspire' },
  { libelle: 'Retenez', secondes: 4, classe: '' },
  { libelle: 'Expirez', secondes: 6, classe: 'expire' },
] as const

/** Trois minutes de respiration guidée, entre deux séances. */
export default function FeuilleSouffle({ onFermer }: Props) {
  const [restant, setRestant] = useState(DUREE)
  const [phase, setPhase] = useState(0)
  const compteurPhase = useRef(0)

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', echap)
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', echap)
      document.body.style.overflow = avant
    }
  }, [onFermer])

  useEffect(() => {
    const t = setInterval(() => {
      setRestant((r) => {
        if (r <= 1) { clearInterval(t); return 0 }
        return r - 1
      })
      compteurPhase.current += 1
      setPhase((p) => {
        if (compteurPhase.current >= PHASES[p].secondes) {
          compteurPhase.current = 0
          return (p + 1) % PHASES.length
        }
        return p
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const minutes = Math.floor(restant / 60)
  const secondes = String(restant % 60).padStart(2, '0')
  const fini = restant === 0

  return (
    <div className="souffle-plein" role="dialog" aria-modal="true" aria-label="Respiration guidée">
      <button
        className="bouton-rond"
        aria-label="Fermer"
        onClick={onFermer}
        style={{ position: 'absolute', top: 18, right: 18, color: '#fff' }}
      >
        <IconeCroix taille={20} />
      </button>

      <div className={`souffle-cercle ${fini ? '' : PHASES[phase].classe}`}>
        {fini ? 'Terminé' : PHASES[phase].libelle}
      </div>

      <p className="souffle-restant">
        {fini
          ? 'Prenez le temps de revenir à votre journée.'
          : `${minutes}:${secondes} restantes`}
      </p>

      <button className="btn-clair" onClick={onFermer}>
        {fini ? 'Revenir au cabinet' : 'Arrêter'}
      </button>
    </div>
  )
}
