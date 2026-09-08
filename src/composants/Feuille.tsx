import type { ReactNode } from 'react'
import { useGlissement } from './useGlissement'
import { IconeFermer } from './Icones'

interface Props {
  titre: string
  sous?: string
  onFermer: () => void
  children: ReactNode
}

/**
 * Panneau qui monte depuis le bas. Se ferme de quatre façons : glissement vers
 * le bas, bouton de fermeture, appui sur le fond, touche Échap.
 */
export default function Feuille({ titre, sous, onFermer, children }: Props) {
  const { refFeuille, refVoile, fermer, handlers } = useGlissement(onFermer)

  return (
    <div
      className="voile"
      ref={refVoile}
      onClick={fermer}
      role="presentation"
    >
      <div
        className="feuille"
        ref={refFeuille}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
        {...handlers}
      >
        <div className="poignee-zone" data-poignee>
          <div className="poignee" />
        </div>
        <div className="feuille-entete">
          <div style={{ minWidth: 0 }}>
            <h2>{titre}</h2>
            {sous && <p className="sous">{sous}</p>}
          </div>
          <button className="bouton-rond" aria-label="Fermer" onClick={fermer}>
            <IconeFermer />
          </button>
        </div>
        <div className="contenu-feuille">{children}</div>
      </div>
    </div>
  )
}
