import { useEffect, useRef, useState } from 'react'
import {
  dureeCycle, dureeTotale, positionCyclique, positionLineaire, type Exercice,
} from '../lib/exercices'
import { IconeCroix, IconeLecture, IconePause } from './Icones'

interface Props {
  exercice: Exercice
  /** Revenir à la liste des exercices : arrêter, fermer, Échap. */
  onRetour: () => void
  /** Quitter Mon espace : l’exercice est allé à son terme. */
  onQuitter: () => void
}

/** mm:ss */
function chrono(secondes: number): string {
  const s = Math.max(0, Math.round(secondes))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Le plein écran d'un exercice.
 *
 * Tout est déduit du temps réellement écoulé, relu à chaque battement. Rien
 * n'est compté au fil de l'eau : c'est ce qui faisait rester la respiration sur
 * « Inspirez » du début à la fin. Un exercice mis en pause, un téléphone qui
 * s'éteint, une image sautée — la position reste juste.
 */
export default function LecteurExercice({ exercice, onRetour, onQuitter }: Props) {
  const total = dureeTotale(exercice)
  const [ecoule, setEcoule] = useState(0)
  const [enPause, setEnPause] = useState(false)

  // Le temps se mesure à l'horloge, pas en additionnant des battements.
  const depart = useRef(Date.now())
  const accumule = useRef(0)
  const pause = useRef(false)
  pause.current = enPause

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') onRetour() }
    document.addEventListener('keydown', echap)
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', echap)
      document.body.style.overflow = avant
    }
  }, [onRetour])

  useEffect(() => {
    const battement = setInterval(() => {
      if (pause.current) return
      const s = accumule.current + (Date.now() - depart.current) / 1000
      setEcoule(Math.min(total, Math.floor(s)))
    }, 200)
    return () => clearInterval(battement)
  }, [total])

  const basculerPause = () => {
    if (pause.current) {
      depart.current = Date.now()
    } else {
      accumule.current += (Date.now() - depart.current) / 1000
    }
    setEnPause(!enPause)
  }

  /** Passer à l'étape suivante : on avance l'horloge du temps qui restait. */
  const avancer = (secondes: number) => {
    accumule.current += secondes
    setEcoule((e) => Math.min(total, e + Math.ceil(secondes)))
  }

  const restantTotal = Math.max(0, total - ecoule)
  const fini = restantTotal === 0
  const avance = total > 0 ? Math.min(100, (ecoule / total) * 100) : 0

  /* ---------- Respiration ---------- */

  if (exercice.phases) {
    const phases = exercice.phases
    const p = positionCyclique(phases.map((x) => x.secondes), ecoule)
    const phase = phases[p.index]
    const tours = Math.floor(ecoule / dureeCycle(phases)) + 1

    return (
      <Plein exercice={exercice} onRetour={onRetour} avance={avance}>
        <div
          className={`souffle-cercle ${fini ? '' : phase.geste}${enPause ? ' fige' : ''}`}
          // La durée de l'animation suit celle du temps en cours : sans cela,
          // un temps de 5 s serait animé sur 4 s et le cercle mentirait.
          style={{ transitionDuration: `${phase.secondes}s` }}
        >
          <span className="cercle-libelle">{fini ? 'Terminé' : phase.libelle}</span>
          {!fini && <span className="cercle-compte">{Math.ceil(p.reste)}</span>}
        </div>

        <p className="souffle-restant">
          {fini
            ? 'Prenez le temps de revenir à votre journée.'
            : `${chrono(restantTotal)} · ${tours === 1 ? '1ʳᵉ' : `${tours}ᵉ`} respiration`}
        </p>

        <div className="souffle-actions">
          {!fini && (
            <button className="btn-clair" onClick={basculerPause}>
              {enPause ? <IconeLecture taille={16} /> : <IconePause taille={16} />}
              {enPause ? 'Reprendre' : 'Pause'}
            </button>
          )}
          <button className="btn-clair" onClick={fini ? onQuitter : onRetour}>
            {fini ? 'Revenir au cabinet' : 'Arrêter'}
          </button>
        </div>
      </Plein>
    )
  }

  /* ---------- Exercice guidé ---------- */

  const etapes = exercice.etapes ?? []
  const p = positionLineaire(etapes.map((e) => e.secondes), ecoule)
  const etape = etapes[p.index]

  return (
    <Plein exercice={exercice} onRetour={onRetour} avance={avance}>
      <ol className="etape-points" aria-hidden>
        {etapes.map((e, i) => (
          <li
            key={e.titre}
            className={i < p.index || p.fini ? 'passee' : i === p.index ? 'active' : ''}
          />
        ))}
      </ol>

      {p.fini ? (
        <div className="etape-carte">
          <h3>C’est fait</h3>
          <p>Prenez le temps de revenir à votre journée.</p>
        </div>
      ) : (
        <div className="etape-carte" key={etape.titre}>
          <span className="etape-rang">Étape {p.index + 1} sur {etapes.length}</span>
          <h3>{etape.titre}</h3>
          <p>{etape.texte}</p>
          <div className="etape-jauge">
            <span style={{ width: `${(p.passe / etape.secondes) * 100}%` }} />
          </div>
        </div>
      )}

      <p className="souffle-restant">
        {p.fini ? exercice.nom : `${chrono(restantTotal)} restantes`}
      </p>

      <div className="souffle-actions">
        {!p.fini && (
          <>
            <button className="btn-clair" onClick={basculerPause}>
              {enPause ? <IconeLecture taille={16} /> : <IconePause taille={16} />}
              {enPause ? 'Reprendre' : 'Pause'}
            </button>
            <button className="btn-clair" onClick={() => avancer(p.reste)}>
              Suivant
            </button>
          </>
        )}
        <button className="btn-clair" onClick={p.fini ? onQuitter : onRetour}>
          {p.fini ? 'Revenir au cabinet' : 'Arrêter'}
        </button>
      </div>
    </Plein>
  )
}

/** L'enveloppe commune : le fond sombre, le titre, la barre d'avancement. */
function Plein({
  exercice, onRetour, avance, children,
}: {
  exercice: Exercice
  onRetour: () => void
  avance: number
  children: React.ReactNode
}) {
  return (
    <div className="souffle-plein" role="dialog" aria-modal="true" aria-label={exercice.nom}>
      <div className="plein-avance"><span style={{ width: `${avance}%` }} /></div>
      <button className="plein-fermer" aria-label="Fermer" onClick={onRetour}>
        <IconeCroix taille={20} />
      </button>
      <h2 className="plein-titre">{exercice.nom}</h2>
      {children}
    </div>
  )
}
