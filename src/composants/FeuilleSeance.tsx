import { useState } from 'react'
import Feuille from './Feuille'
import BriefSeance from './BriefSeance'
import BoutonRappel from './BoutonRappel'
import BlocEncaissement from './BlocEncaissement'
import ClotureSeance from './ClotureSeance'
import ChampDicte from './ChampDicte'
import type { ModePresence, Seance, StatutSeance } from '../lib/types'
import { useDonnees, majSeance, supprimerSeance, deplacerSeance, patient } from '../lib/store'
import { dateLongue } from '../lib/dates'
import { da, initiales } from '../lib/format'
import { estDue, partPsy, partCabinet } from '../lib/argent'
import {
  AIDE_STATUT, LIBELLE_STATUT, nomAffiche,
} from '../lib/affichage'
import {
  Chevron, IconeCabinet, IconePortefeuille, IconeRecu, IconeVisio,
} from './Icones'

const STATUTS: StatutSeance[] = [
  'prevu', 'retard', 'effectue', 'absent', 'annule_delai', 'annule_hors_delai',
]

const PRESENCES: Array<{ cle: ModePresence; libelle: string }> = [
  { cle: 'presentiel', libelle: 'Au cabinet' },
  { cle: 'visio', libelle: 'À distance' },
]

interface Props {
  seanceId: string
  onFermer: () => void
  onOuvrirPatient: (id: string) => void
}

export default function FeuilleSeance({ seanceId, onFermer, onOuvrirPatient }: Props) {
  const { seances, reglages } = useDonnees()
  const seance = seances.find((s) => s.id === seanceId)
  const [confirmeSuppr, setConfirmeSuppr] = useState(false)
  const [erreurDeplacement, setErreurDeplacement] = useState('')
  if (!seance) return null

  const p = patient(seance.patientId)
  const creneau = reglages.creneaux[seance.creneau]
  const due = estDue(seance.statut)
  const annulee = seance.statut === 'annule_delai' || seance.statut === 'annule_hors_delai'

  const changerStatut = (statut: StatutSeance) => {
    const champs: Partial<Seance> = { statut }
    // Une séance qui n'est plus due ne peut pas rester marquée payée.
    if (!estDue(statut)) { champs.paye = false; champs.modePaiement = null; champs.datePaiement = null }
    majSeance(seanceId, champs)
  }

  const changerCreneau = (index: number) => {
    setErreurDeplacement('')
    if (!deplacerSeance(seanceId, seance.date, index)) {
      setErreurDeplacement('Ce créneau est déjà pris ce jour-là.')
    }
  }

  const changerDate = (date: string) => {
    setErreurDeplacement('')
    if (!date) return
    if (!deplacerSeance(seanceId, date, seance.creneau)) {
      setErreurDeplacement('Ce créneau est déjà pris à cette date.')
    }
  }

  return (
    <Feuille
      titre={nomAffiche(p, reglages.masquerNoms)}
      sous={`${dateLongue(seance.date)} · ${creneau?.debut ?? ''} – ${creneau?.fin ?? ''}`}
      onFermer={onFermer}
    >
      <BriefSeance seance={seance} />

      {p && (
        <button className="carte-ligne" style={{ marginBottom: 18 }} onClick={() => onOuvrirPatient(p.id)}>
          <span className="monogramme">{initiales(p.prenom, p.nom)}</span>
          <span className="ligne-corps">
            <span className="ligne-titre">
              <span className="nom">Ouvrir le dossier</span>
            </span>
            <span className="ligne-sous">{p.motif || 'Fiche patient et historique'}</span>
          </span>
          <Chevron />
        </button>
      )}

      <section style={{ marginBottom: 16 }}>
        <div className="entete-section"><h3>Où se passe la séance</h3></div>
        <div className="choix">
          {PRESENCES.map((m) => (
            <button
              key={m.cle}
              aria-pressed={seance.modePresence === m.cle}
              onClick={() => majSeance(seanceId, { modePresence: m.cle })}
            >
              {m.cle === 'visio' ? <IconeVisio taille={14} /> : <IconeCabinet />}
              {m.libelle}
            </button>
          ))}
        </div>
        {seance.modePresence === 'visio' && reglages.lienVisioParDefaut.trim() && (
          <a
            className="btn bloc"
            style={{ marginTop: 10 }}
            href={reglages.lienVisioParDefaut}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconeVisio taille={16} />
            Ouvrir la salle
          </a>
        )}
      </section>

      <ChampDicte
        id="seance-description"
        label="Description du rendez-vous"
        valeur={seance.description}
        onChange={(v) => majSeance(seanceId, { description: v })}
        placeholder="Apporte ses résultats, vient accompagnée…"
        aide="Note pratique, visible dans l’agenda. Rien de clinique."
      />

      {p && (seance.statut === 'prevu' || seance.statut === 'retard')
        && <BoutonRappel seance={seance} patient={p} />}

      <section>
        <div className="entete-section"><h3>Comment s’est passée la séance</h3></div>
        <div className="choix">
          {STATUTS.map((s) => (
            <button key={s} aria-pressed={seance.statut === s} onClick={() => changerStatut(s)}>
              {LIBELLE_STATUT[s]}
            </button>
          ))}
        </div>
        <p className="aide">{AIDE_STATUT[seance.statut]}</p>
      </section>

      {annulee && (
        <div style={{ marginTop: 12 }}>
          <ChampDicte
            id="motif"
            label="Motif de l’annulation"
            valeur={seance.motifAnnulation}
            onChange={(v) => majSeance(seanceId, { motifAnnulation: v })}
            placeholder="Ex. : malade, prévenue la veille"
          />
        </div>
      )}

      <ClotureSeance seance={seance} />

      <section style={{ marginTop: 20 }}>
        <div className="entete-section"><h3>Argent</h3></div>
        <div className="carte">
          <div className="rang">
            <span className="rang-lib"><span className="disque"><IconeRecu /></span> Prix de la séance</span>
            <span className="rang-val">{da(seance.tarif)}</span>
          </div>
          <div className="rang">
            <span className="rang-lib"><span className="disque"><IconePortefeuille /></span> Ma part</span>
            <span className="rang-val fort">{due ? da(partPsy(seance)) : '—'}</span>
          </div>
          <div className="rang">
            <span className="rang-lib"><span className="disque"><IconeCabinet /></span> Part du cabinet</span>
            <span className="rang-val">{due ? da(partCabinet(seance)) : '—'}</span>
          </div>
        </div>

        <BlocEncaissement seance={seance} />

      </section>

      <section style={{ marginTop: 20 }}>
        <div className="entete-section"><h3>Déplacer</h3></div>
        <div className="duo">
          <div className="champ">
            <label htmlFor="date-seance">Jour</label>
            <input
              id="date-seance"
              type="date"
              value={seance.date}
              onChange={(e) => changerDate(e.target.value)}
            />
          </div>
          <div className="champ">
            <label htmlFor="creneau-seance">Heure</label>
            <select
              id="creneau-seance"
              value={seance.creneau}
              onChange={(e) => changerCreneau(Number(e.target.value))}
            >
              {reglages.creneaux.map((c, i) => (
                <option key={i} value={i}>{c.debut} – {c.fin}</option>
              ))}
            </select>
          </div>
        </div>
        {erreurDeplacement && (
          <p style={{ color: 'var(--corail)', fontSize: '.82rem', margin: '0 2px 12px', fontWeight: 600 }}>
            {erreurDeplacement}
          </p>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        {confirmeSuppr ? (
          <div className="btn-rang">
            <button className="btn" onClick={() => setConfirmeSuppr(false)}>Non, garder</button>
            <button className="btn danger" onClick={() => { supprimerSeance(seanceId); onFermer() }}>
              Oui, supprimer
            </button>
          </div>
        ) : (
          <button className="btn danger bloc" onClick={() => setConfirmeSuppr(true)}>
            Supprimer ce rendez-vous
          </button>
        )}
      </section>
    </Feuille>
  )
}
