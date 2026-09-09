import { useState } from 'react'
import { cleTheme, themesDeduits, THEMES_SUGGERES } from '../lib/themes'
import { IconeCroix, IconePlus } from './Icones'

interface Props {
  /** Thèmes déjà rattachés à la fiche. */
  themes: string[]
  /** Motif écrit à la main : il sert à remonter les bons thèmes en tête. */
  motif: string
  onBasculer: (nom: string) => void
}

/**
 * Le choix des thèmes d'une fiche. Deux gestes seulement : toucher un thème
 * proposé, ou en écrire un qui manque. Les thèmes que le motif laisse deviner
 * remontent en tête, pour que le cas courant tienne en un seul geste.
 */
export default function ChampThemes({ themes, motif, onBasculer }: Props) {
  const [ajout, setAjout] = useState('')

  const clesChoisies = new Set(themes.map(cleTheme))
  const devines = themesDeduits(motif).filter((n) => !clesChoisies.has(cleTheme(n)))
  const clesDevinees = new Set(devines.map(cleTheme))
  const autres = THEMES_SUGGERES
    .map((t) => t.nom)
    .filter((n) => !clesChoisies.has(cleTheme(n)) && !clesDevinees.has(cleTheme(n)))

  const ajouter = () => {
    const propre = ajout.trim()
    if (!propre || clesChoisies.has(cleTheme(propre))) { setAjout(''); return }
    onBasculer(propre)
    setAjout('')
  }

  return (
    <div className="champ champ-themes">
      <label>Thèmes de consultation</label>

      {themes.length > 0 && (
        <div className="themes-choisis">
          {themes.map((t) => (
            <button
              key={cleTheme(t)}
              type="button"
              className="theme-puce choisie"
              aria-label={`Retirer le thème ${t}`}
              onClick={() => onBasculer(t)}
            >
              {t}
              <IconeCroix taille={13} />
            </button>
          ))}
        </div>
      )}

      {devines.length > 0 && (
        <>
          <p className="aide">D’après le motif :</p>
          <div className="themes-choix">
            {devines.map((n) => (
              <button key={n} type="button" className="theme-puce devine" onClick={() => onBasculer(n)}>
                <IconePlus taille={13} />
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="themes-choix">
        {autres.map((n) => (
          <button key={n} type="button" className="theme-puce" onClick={() => onBasculer(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="themes-ajout">
        <input
          value={ajout}
          placeholder="Un autre thème…"
          aria-label="Ajouter un thème"
          onChange={(e) => setAjout(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouter() } }}
        />
        <button type="button" className="btn petit" disabled={!ajout.trim()} onClick={ajouter}>
          Ajouter
        </button>
      </div>

      <p className="aide">
        Une fiche peut porter plusieurs thèmes. Ils servent au nuage de l’aperçu ;
        le motif, lui, reste écrit avec vos mots.
      </p>
    </div>
  )
}
