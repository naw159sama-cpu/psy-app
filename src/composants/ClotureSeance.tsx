import { useEffect, useRef, useState } from 'react'
import { majSeance } from '../lib/store'
import type { Seance } from '../lib/types'
import { IconeCadenas, IconeChrono } from './Icones'

interface Props {
  seance: Seance
}

/** Formulations courantes, pour n'avoir qu'à toucher au lieu d'écrire. */
const ETATS_FREQUENTS = [
  'Détendue', 'Tendue', 'Fatiguée', 'Émue', 'Combative', 'Fermée', 'Plus posée',
]

const OBJECTIF_SECONDES = 90

function chrono(secondes: number): string {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Clôture de séance : trois champs, dans l'ordre où l'on y pense.
 * Le troisième — « à reprendre » — devient le brief de la fois suivante.
 */
export default function ClotureSeance({ seance }: Props) {
  const [etat, setEtat] = useState(seance.etatObserve)
  const [contenu, setContenu] = useState(seance.note)
  const [reprise, setReprise] = useState(seance.aReprendre)
  const [secondes, setSecondes] = useState(0)
  const premierRendu = useRef(true)

  // Enregistrement automatique, un peu après la frappe.
  useEffect(() => {
    if (premierRendu.current) { premierRendu.current = false; return }
    const t = setTimeout(() => {
      majSeance(seance.id, {
        etatObserve: etat,
        note: contenu,
        aReprendre: reprise,
        noteMajLe: new Date().toISOString(),
      })
    }, 500)
    return () => clearTimeout(t)
  }, [etat, contenu, reprise, seance.id])

  // Chronomètre indicatif : il monte, il ne réprimande pas.
  useEffect(() => {
    const t = setInterval(() => setSecondes((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const ajouterEtat = (mot: string) => {
    setEtat((actuel) => (actuel.trim() ? `${actuel.replace(/[,\s]+$/, '')}, ${mot.toLowerCase()}` : mot))
  }

  const remplis = [etat, contenu, reprise].filter((v) => v.trim().length > 0).length

  return (
    <section>
      <div className="entete-section">
        <div className="cloture-entete" style={{ flex: 1 }}>
          <h3>Clôture de séance</h3>
          <span className={`chrono${secondes < OBJECTIF_SECONDES ? ' dedans' : ''}`}>
            <IconeChrono taille={13} />
            {chrono(secondes)}
          </span>
        </div>
      </div>

      <div className="etapes" aria-label={`${remplis} champs sur 3 remplis`}>
        {[0, 1, 2].map((i) => (
          <span className="etape" key={i}>
            {i < remplis && <span style={{ animationDelay: `${i * 0.08}s` }} />}
          </span>
        ))}
      </div>

      <div className="champ">
        <label htmlFor="cl-etat">État observé</label>
        <div className="suggestions">
          {ETATS_FREQUENTS.map((m) => (
            <button key={m} type="button" onClick={() => ajouterEtat(m)}>{m}</button>
          ))}
        </div>
        <input
          id="cl-etat"
          value={etat}
          placeholder="Comment elle est arrivée"
          onChange={(e) => setEtat(e.target.value)}
        />
      </div>

      <div className="champ">
        <label htmlFor="cl-contenu">Contenu de la séance</label>
        <textarea
          id="cl-contenu"
          rows={5}
          value={contenu}
          placeholder="Ce qui a été travaillé, ce qui est ressorti"
          onChange={(e) => setContenu(e.target.value)}
        />
      </div>

      <div className="champ">
        <label htmlFor="cl-reprise">À reprendre la prochaine fois</label>
        <textarea
          id="cl-reprise"
          rows={2}
          value={reprise}
          placeholder="La phrase que vous voudrez relire dans quinze jours"
          onChange={(e) => setReprise(e.target.value)}
        />
        <p className="aide">
          Ce champ s’affichera en tête de la prochaine séance, avant de la faire entrer.
        </p>
      </div>

      <div className="note-contexte">
        <IconeCadenas taille={17} />
        <span>
          <strong>Note clinique confidentielle</strong>
          Elle ne quitte jamais ce téléphone et n’apparaît sur aucun document.
        </span>
      </div>
    </section>
  )
}
