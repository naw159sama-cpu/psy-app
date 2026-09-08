import { useEffect, type ReactNode } from 'react'

interface Props {
  titre: string
  sous?: string
  onFermer: () => void
  children: ReactNode
}

/** Panneau qui monte depuis le bas, comme sur mobile. */
export default function Feuille({ titre, sous, onFermer, children }: Props) {
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

  return (
    <div className="voile" onClick={onFermer} role="presentation">
      <div
        className="feuille"
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="poignee" />
        <h2>{titre}</h2>
        {sous && <p className="sous">{sous}</p>}
        <div className="contenu-feuille">{children}</div>
      </div>
    </div>
  )
}
