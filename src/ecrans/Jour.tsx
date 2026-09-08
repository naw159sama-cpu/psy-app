import { useMemo } from 'react'
import ListeCreneaux from '../composants/ListeCreneaux'
import { useCompteur } from '../composants/Compteur'
import { useDonnees } from '../lib/store'
import { aujourdhui, ajouterJours, dateLongue, jourDeIso, JOURS } from '../lib/dates'
import { da, initiales, montantSeul } from '../lib/format'
import { estDue, partPsy } from '../lib/argent'
import { nomAffiche } from '../lib/affichage'
import {
  IconeAttente, IconeCadenas, IconeNote, IconePortefeuille, IconeAgenda,
} from '../composants/Icones'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
}

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
  // Ce que la journée rapporte si tout se déroule comme prévu : les séances encore
  // « prévues » comptent, sinon le matin l'écran affiche toujours zéro.
  const partDuJour = duJour.reduce(
    (t, s) => t + (s.statut === 'prevu' ? Math.round((s.tarif * s.partPsyPct) / 100) : partPsy(s)),
    0,
  )
  const partAnimee = useCompteur(partDuJour)
  const toutJoue = duJour.length > 0 && duJour.every((s) => s.statut !== 'prevu')
  const impayesDuJour = duJour.filter((s) => estDue(s.statut) && !s.paye)

  const notesEnRetard = seances
    .filter((s) => s.date < today && s.statut === 'effectue' && !s.note.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const impayesAnciens = seances.filter((s) => s.date < date && estDue(s.statut) && !s.paye)

  const nom = (id: string) => nomAffiche(patients.find((p) => p.id === id), false)
  const mono = (id: string) => {
    const p = patients.find((x) => x.id === id)
    return p ? initiales(p.prenom, p.nom) : '?'
  }

  return (
    <>
      {!estAujourdhui && (
        <div className="note-confidentielle">
          <IconeAgenda taille={18} />
          <span>
            <strong>Vous ne travaillez pas aujourd’hui.</strong>
            Voici votre prochaine journée, {JOURS[jourDeIso(date)]} — {dateLongue(date)}.
          </span>
        </div>
      )}

      <ListeCreneaux date={date} onOuvrirSeance={onOuvrirSeance} onCreneauLibre={onCreneauLibre} />

      <section className="duo-cartes">
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconeAgenda taille={16} /></span>
            <span className="stat-libelle">Créneaux pris</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{duJour.length}</span>
            <span className="unite">/ {reglages.creneaux.length}</span>
          </div>
          <p className="stat-detail">
            {reglages.creneaux.length - duJour.length === 0
              ? 'Journée complète'
              : `${reglages.creneaux.length - duJour.length} encore libre${
                  reglages.creneaux.length - duJour.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconePortefeuille /></span>
            <span className="stat-libelle">Ma part</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{montantSeul(partAnimee)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="stat-detail">
            {impayesDuJour.length > 0
              ? `${da(impayesDuJour.reduce((t, s) => t + s.tarif, 0))} à encaisser`
              : toutJoue ? 'Journée soldée' : 'Si tout se fait'}
          </p>
        </div>
      </section>

      {notesEnRetard.length > 0 && (
        <section>
          <div className="entete-section">
            <h3>Notes à écrire <span className="compteur">{notesEnRetard.length}</span></h3>
          </div>
          <div className="pile">
            {notesEnRetard.slice(0, 4).map((s) => (
              <button key={s.id} className="carte-ligne" onClick={() => onOuvrirSeance(s.id)}>
                <span className="disque grand"><IconeNote taille={19} /></span>
                <span className="ligne-corps">
                  <span className="ligne-titre">
                    <span className={`nom${reglages.masquerNoms ? ' flou' : ''}`}>
                      {nom(s.patientId)}
                    </span>
                  </span>
                  <span className="ligne-sous">{dateLongue(s.date)}</span>
                </span>
                <span className="puce attente">À noter</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {impayesAnciens.length > 0 && (
        <section>
          <div className="entete-section">
            <h3>Impayés plus anciens <span className="compteur">{impayesAnciens.length}</span></h3>
            <span className="entete-note">
              Total : <strong>{da(impayesAnciens.reduce((t, s) => t + s.tarif, 0))}</strong>
            </span>
          </div>
          <div className="pile">
            {impayesAnciens.slice(0, 4).map((s) => (
              <button key={s.id} className="carte-ligne" onClick={() => onOuvrirSeance(s.id)}>
                <span className="monogramme">{mono(s.patientId)}</span>
                <span className="ligne-corps">
                  <span className="ligne-titre">
                    <span className={`nom${reglages.masquerNoms ? ' flou' : ''}`}>
                      {nom(s.patientId)}
                    </span>
                  </span>
                  <span className="ligne-sous">
                    <span className="accent">{da(s.tarif)}</span>
                    <span>·</span>
                    <span>{dateLongue(s.date)}</span>
                  </span>
                </span>
                <span className="disque"><IconeAttente taille={16} /></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {reglages.masquerNoms && (
        <div className="note-confidentielle">
          <IconeCadenas taille={17} />
          <span>
            <strong>Écran de confidentialité actif</strong>
            Les noms des patients sont masqués. Touchez l’œil en haut pour les réafficher.
          </span>
        </div>
      )}
    </>
  )
}
