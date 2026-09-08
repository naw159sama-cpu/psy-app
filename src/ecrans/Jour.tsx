import { useMemo } from 'react'
import ListeCreneaux from '../composants/ListeCreneaux'
import { useDonnees } from '../lib/store'
import { aujourdhui, ajouterJours, dateLongue, jourDeIso, JOURS } from '../lib/dates'
import { da } from '../lib/format'
import { bilan, estDue, partPsy } from '../lib/argent'
import { nomAffiche } from '../lib/affichage'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
}

/** Trouve le prochain jour travaillé, aujourd'hui compris. */
function prochainJourTravaille(jours: number[]): string {
  let d = aujourdhui()
  for (let i = 0; i < 14; i++) {
    if (jours.includes(jourDeIso(d))) return d
    d = ajouterJours(d, 1)
  }
  return aujourdhui()
}

export default function Jour({ onOuvrirSeance, onCreneauLibre }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const today = aujourdhui()
  const date = useMemo(
    () => prochainJourTravaille(reglages.joursTravail),
    [reglages.joursTravail],
  )
  const estAujourdhui = date === today

  const duJour = seances.filter((s) => s.date === date)
  const b = bilan(duJour)
  const aEncaisser = duJour.filter((s) => estDue(s.statut) && !s.paye)
  // Ce que la journée rapporte si tout se déroule comme prévu : les séances encore
  // « prévues » comptent, sinon le matin l'écran affiche toujours 0.
  const partDuJour = duJour.reduce(
    (t, s) => t + (s.statut === 'prevu'
      ? Math.round((s.tarif * s.partPsyPct) / 100)
      : partPsy(s)),
    0,
  )
  const toutJoue = duJour.every((s) => s.statut !== 'prevu')

  // Ce qui traîne : séances passées effectuées sans note, et impayés d'avant aujourd'hui.
  const notesEnRetard = seances
    .filter((s) => s.date < today && s.statut === 'effectue' && !s.note.trim())
    .sort((a, b2) => (a.date < b2.date ? 1 : -1))
  const impayesAnciens = seances
    .filter((s) => s.date < date && estDue(s.statut) && !s.paye)

  return (
    <>
      {!estAujourdhui && (
        <div className="avert" style={{ marginBottom: 14 }}>
          <strong>Vous ne travaillez pas aujourd’hui.</strong>
          Voici votre prochaine journée, {JOURS[jourDeIso(date)]}.
        </div>
      )}

      <ListeCreneaux date={date} onOuvrirSeance={onOuvrirSeance} onCreneauLibre={onCreneauLibre} />

      <div className="section-titre">Cette journée</div>
      <div className="chiffres">
        <div className="chiffre">
          <div className="val">{duJour.length}<span style={{ fontSize: '.9rem', fontWeight: 500, color: 'var(--doux)' }}> / {reglages.creneaux.length}</span></div>
          <div className="lib">Créneaux pris</div>
        </div>
        <div className="chiffre plein">
          <div className="val">{da(partDuJour)}</div>
          <div className="lib">{toutJoue ? 'Ma part' : 'Ma part si tout se fait'}</div>
        </div>
        {b.impaye > 0 && (
          <div className="chiffre large">
            <div className="val">{da(b.impaye)}</div>
            <div className="lib">
              Reste à encaisser aujourd’hui ({aEncaisser.length} séance{aEncaisser.length > 1 ? 's' : ''})
            </div>
          </div>
        )}
      </div>

      {notesEnRetard.length > 0 && (
        <>
          <div className="section-titre">Notes à écrire ({notesEnRetard.length})</div>
          <div className="carte">
            {notesEnRetard.slice(0, 5).map((s) => {
              const p = patients.find((x) => x.id === s.patientId)
              return (
                <button key={s.id} className="ligne" onClick={() => onOuvrirSeance(s.id)}>
                  <span className="ligne-corps">
                    <span className={`ligne-titre${reglages.masquerNoms ? ' flou' : ''}`}>
                      {nomAffiche(p, false)}
                    </span>
                    <span className="ligne-sous">{dateLongue(s.date)}</span>
                  </span>
                  <span className="puce attente">À noter</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {impayesAnciens.length > 0 && (
        <>
          <div className="section-titre">Impayés plus anciens ({impayesAnciens.length})</div>
          <div className="carte">
            {impayesAnciens.slice(0, 5).map((s) => {
              const p = patients.find((x) => x.id === s.patientId)
              return (
                <button key={s.id} className="ligne" onClick={() => onOuvrirSeance(s.id)}>
                  <span className="ligne-corps">
                    <span className={`ligne-titre${reglages.masquerNoms ? ' flou' : ''}`}>
                      {nomAffiche(p, false)}
                    </span>
                    <span className="ligne-sous">{dateLongue(s.date)}</span>
                  </span>
                  <span className="rang-val">{da(s.tarif)}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
