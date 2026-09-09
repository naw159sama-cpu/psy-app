import { useEffect, useRef, useState } from 'react'
import Feuille from './Feuille'
import ChampDicte from './ChampDicte'
import { journaliserRappel, majSeance, marquerRappelEnvoye, useDonnees } from '../lib/store'
import { eligibilite, lienWhatsApp, messagePour } from '../lib/rappels'
import { dateLongue } from '../lib/dates'
import { initiales } from '../lib/format'
import { LIBELLE_STATUT, couleurStatut, nomAffiche } from '../lib/affichage'
import type { Patient, Seance } from '../lib/types'
import {
  Chevron, IconeBas, IconeCheck, IconeNote, IconePlus, IconeWhatsApp,
} from './Icones'

interface Props {
  date: string
  onFermer: () => void
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
}

/* ------------------------------------------------------------------ */

interface LigneProps {
  seance: Seance
  patient: Patient | undefined
  ouverte: boolean
  onBasculer: () => void
  onOuvrirSeance: (id: string) => void
}

function LigneRdv({ seance, patient, ouverte, onBasculer, onOuvrirSeance }: LigneProps) {
  const { reglages } = useDonnees()
  const [description, setDescription] = useState(seance.description)
  const [envoye, setEnvoye] = useState(false)
  const premierRendu = useRef(true)

  // Enregistrement automatique, un peu après la frappe.
  useEffect(() => {
    if (premierRendu.current) { premierRendu.current = false; return }
    const t = setTimeout(() => majSeance(seance.id, { description }), 500)
    return () => clearTimeout(t)
  }, [description, seance.id])

  const creneau = reglages.creneaux[seance.creneau]
  const e = eligibilite(patient, reglages)
  // Pour une confirmation, le modèle dédié ; sinon le premier actif.
  const modele = reglages.modelesRappel.find((m) => m.actif && m.id === 'confirmation')
    ?? reglages.modelesRappel.find((m) => m.actif)
  const message = patient && modele ? messagePour(seance, patient, reglages, modele) : ''
  const dejaEnvoye = !!seance.rappelEnvoyeLe

  return (
    <div className={`rdv-jour${ouverte ? ' ouverte' : ''}`}>
      <button className="rdv-tete" onClick={onBasculer} aria-expanded={ouverte}>
        <span className="rdv-heure">
          {creneau?.debut ?? ''}
          <small>{creneau?.fin ?? ''}</small>
        </span>
        <span className="monogramme petit">
          {patient ? initiales(patient.prenom, patient.nom) : '?'}
        </span>
        <span className="rdv-corps">
          <span className={`rdv-nom${reglages.masquerNoms ? ' flou' : ''}`}>
            {nomAffiche(patient, false)}
          </span>
          <span className="rdv-sous">
            {seance.description.trim() || patient?.motif || 'Rendez-vous'}
          </span>
        </span>
        <span className="rdv-fin">
          {seance.statut !== 'prevu' && (
            <span className={`puce ${couleurStatut(seance.statut)}`}>
              {LIBELLE_STATUT[seance.statut]}
            </span>
          )}
          {dejaEnvoye && <span className="puce ok">Confirmé</span>}
          <span className={`rdv-chevron${ouverte ? ' ouvert' : ''}`}><IconeBas taille={15} /></span>
        </span>
      </button>

      {ouverte && (
        <div className="rdv-details">
          <ChampDicte
            id={`desc-${seance.id}`}
            label="Description"
            valeur={description}
            onChange={setDescription}
            lignes={2}
            placeholder="Apporte ses résultats, vient accompagnée…"
            aide="Note pratique, visible dans l’agenda. Rien de clinique."
          />

          <div className="rdv-actions">
            {e.eligible && message ? (
              <a
                className={`btn ${dejaEnvoye ? '' : 'principal'}`}
                href={lienWhatsApp(e.destinataire.numero, message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  journaliserRappel(seance.patientId, seance.id, seance.date, modele!.id, 'prepare')
                  setEnvoye(true)
                }}
              >
                <IconeWhatsApp taille={16} />
                {dejaEnvoye ? 'Renvoyer' : 'Confirmer'}
              </a>
            ) : (
              <span className="rdv-impossible">
                {e.eligible ? 'Aucun modèle actif' : e.motif}
              </span>
            )}
            <button className="btn" onClick={() => onOuvrirSeance(seance.id)}>
              <IconeNote taille={15} />
              Dossier
            </button>
          </div>

          {envoye && !dejaEnvoye && (
            <button
              className="btn principal bloc"
              style={{ marginTop: 8 }}
              onClick={() => { marquerRappelEnvoye(seance.id, modele!.id); setEnvoye(false) }}
            >
              <IconeCheck taille={15} />
              Marquer comme envoyé
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

/** La journée entière dans une fenêtre, comme dans un agenda ordinaire. */
export default function FeuilleJour({
  date, onFermer, onOuvrirSeance, onCreneauLibre,
}: Props) {
  const { seances, patients, reglages } = useDonnees()
  const [ouverte, setOuverte] = useState<string | null>(null)

  const duJour = seances.filter((s) => s.date === date)
  const pris = duJour.length
  const libres = reglages.creneaux.length - pris

  const ouvrirSeance = (id: string) => { onFermer(); onOuvrirSeance(id) }
  const ajouter = (creneau: number) => { onFermer(); onCreneauLibre(date, creneau) }

  return (
    <Feuille
      titre={dateLongue(date)}
      sous={
        pris === 0
          ? 'Aucun rendez-vous'
          : `${pris} rendez-vous · ${libres} créneau${libres > 1 ? 'x' : ''} libre${libres > 1 ? 's' : ''}`
      }
      onFermer={onFermer}
    >
      <div className="pile-jour">
        {reglages.creneaux.map((c, i) => {
          const s = duJour.find((x) => x.creneau === i)
          if (!s) {
            return (
              <button key={i} className="rdv-libre" onClick={() => ajouter(i)}>
                <span className="rdv-heure">
                  {c.debut}
                  <small>{c.fin}</small>
                </span>
                <span className="rdv-corps">
                  <span className="rdv-sous">Créneau libre</span>
                </span>
                <span className="rdv-fin"><IconePlus taille={17} /></span>
              </button>
            )
          }
          return (
            <LigneRdv
              key={s.id}
              seance={s}
              patient={patients.find((p) => p.id === s.patientId)}
              ouverte={ouverte === s.id}
              onBasculer={() => setOuverte(ouverte === s.id ? null : s.id)}
              onOuvrirSeance={ouvrirSeance}
            />
          )
        })}
      </div>

      {pris > 0 && (
        <p className="aide" style={{ marginTop: 14 }}>
          Touchez un rendez-vous pour lui ajouter une description ou envoyer la
          confirmation. <Chevron taille={12} /> Le dossier complet s’ouvre avec « Dossier ».
        </p>
      )}
    </Feuille>
  )
}
