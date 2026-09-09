import { useState } from 'react'
import { majSeance, useDonnees } from '../lib/store'
import { estDue, partCabinet, partPsy } from '../lib/argent'
import { nomMoyenPaiement } from '../lib/affichage'
import { aujourdhui, dateBreve } from '../lib/dates'
import { da } from '../lib/format'
import type { Seance } from '../lib/types'
import { IconeCheck, IconeCrayon, IconePortefeuille } from './Icones'

interface Props {
  seance: Seance
  /** Version resserrée, pour l'intérieur d'une carte de rendez-vous. */
  compact?: boolean
}

/**
 * Encaisser en un geste, avec ses deux paramètres sous la main : par quel
 * moyen, et à quelle date. Le même bloc sert dans la fenêtre du jour et dans
 * la fiche de séance, pour que le geste soit partout le même.
 */
export default function BlocEncaissement({ seance, compact = false }: Props) {
  const { reglages } = useDonnees()
  const [ouvert, setOuvert] = useState(false)
  const [vientDePayer, setVientDePayer] = useState(false)

  const moyens = reglages.modesPaiement.filter((m) => m.actif)
  const due = estDue(seance.statut)

  if (!due) {
    return compact ? null : <p className="aide">Rien à encaisser pour cette séance.</p>
  }

  /** Encaisse d'un geste : moyen habituel, à la date du jour. */
  const encaisser = (moyenId: string) => {
    majSeance(seance.id, {
      paye: true,
      modePaiement: moyenId,
      datePaiement: seance.datePaiement ?? aujourdhui(),
    })
    setVientDePayer(true)
    setOuvert(false)
    setTimeout(() => setVientDePayer(false), 700)
  }

  const annuler = () => {
    majSeance(seance.id, { paye: false, modePaiement: null, datePaiement: null })
    setOuvert(false)
  }

  /* ---------- Déjà réglée ---------- */

  if (seance.paye) {
    return (
      <div className="encaissement fait">
        <button className="encaisse-resume" onClick={() => setOuvert(!ouvert)}>
          <span className="disque sauge"><IconeCheck taille={15} /></span>
          <span className="encaisse-textes">
            <span className="encaisse-titre">
              {da(seance.tarif)} · {nomMoyenPaiement(seance.modePaiement, reglages)}
            </span>
            <span className="encaisse-sous">
              Encaissé le {seance.datePaiement ? dateBreve(seance.datePaiement) : '—'}
            </span>
          </span>
          <span className="encaisse-crayon"><IconeCrayon taille={15} /></span>
        </button>

        {ouvert && (
          <div className="encaisse-detail">
            <div className="choix">
              {moyens.map((m) => (
                <button
                  key={m.id}
                  aria-pressed={seance.modePaiement === m.id}
                  onClick={() => majSeance(seance.id, { modePaiement: m.id })}
                >
                  {m.nom}
                </button>
              ))}
            </div>
            <div className="champ" style={{ marginTop: 12, marginBottom: 10 }}>
              <label htmlFor={`dp-${seance.id}`}>Date du règlement</label>
              <input
                id={`dp-${seance.id}`}
                type="date"
                value={seance.datePaiement ?? ''}
                onChange={(e) => majSeance(seance.id, { datePaiement: e.target.value || null })}
              />
              <p className="aide">
                À reculer si le virement est arrivé après la séance : c’est cette date
                qui compte dans les encaissements du mois.
              </p>
            </div>
            <button className="btn danger bloc" onClick={annuler}>
              Ce n’est pas réglé, annuler
            </button>
          </div>
        )}
      </div>
    )
  }

  /* ---------- À encaisser ---------- */

  return (
    <div className={`encaissement${vientDePayer ? ' valide' : ''}`}>
      {ouvert ? (
        <div className="encaisse-detail ouvert">
          <span className="encaisse-question">Réglé comment ?</span>
          <div className="choix">
            {moyens.map((m) => (
              <button key={m.id} onClick={() => encaisser(m.id)}>{m.nom}</button>
            ))}
          </div>
          <div className="champ" style={{ marginTop: 12, marginBottom: 0 }}>
            <label htmlFor={`dp-av-${seance.id}`}>Date du règlement</label>
            <input
              id={`dp-av-${seance.id}`}
              type="date"
              value={seance.datePaiement ?? aujourdhui()}
              onChange={(e) => majSeance(seance.id, { datePaiement: e.target.value || null })}
            />
          </div>
          <button className="btn bloc" style={{ marginTop: 10 }} onClick={() => setOuvert(false)}>
            Pas maintenant
          </button>
        </div>
      ) : (
        <button className="btn principal bloc" onClick={() => setOuvert(true)}>
          <IconePortefeuille />
          Encaisser {da(seance.tarif)}
        </button>
      )}

      {!compact && !ouvert && (
        <p className="aide">
          Ma part {da(partPsy(seance))} · cabinet {da(partCabinet(seance))}
        </p>
      )}
    </div>
  )
}
