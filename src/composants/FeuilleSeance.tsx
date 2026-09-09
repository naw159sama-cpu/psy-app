import { useState } from 'react'
import Feuille from './Feuille'
import BriefSeance from './BriefSeance'
import BoutonRappel from './BoutonRappel'
import ClotureSeance from './ClotureSeance'
import ChampDicte from './ChampDicte'
import type { ModePaiement, Seance, StatutSeance } from '../lib/types'
import { useDonnees, majSeance, supprimerSeance, deplacerSeance, patient } from '../lib/store'
import { aujourdhui, dateLongue } from '../lib/dates'
import { da, initiales } from '../lib/format'
import { estDue, partPsy, partCabinet } from '../lib/argent'
import {
  AIDE_STATUT, LIBELLE_PAIEMENT, LIBELLE_STATUT, MODES_PAIEMENT, nomAffiche,
} from '../lib/affichage'
import {
  Chevron, IconeCabinet, IconeCheck, IconePortefeuille, IconeRecu,
} from './Icones'

const STATUTS: StatutSeance[] = ['prevu', 'effectue', 'absent', 'annule_delai', 'annule_hors_delai']

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
  const [vientDePayer, setVientDePayer] = useState(false)
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

  const basculerPaiement = () => {
    if (seance.paye) {
      majSeance(seanceId, { paye: false, modePaiement: null, datePaiement: null })
    } else {
      majSeance(seanceId, {
        paye: true,
        modePaiement: seance.modePaiement ?? 'especes',
        datePaiement: aujourdhui(),
      })
      setVientDePayer(true)
      setTimeout(() => setVientDePayer(false), 600)
    }
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

      <ChampDicte
        id="seance-description"
        label="Description du rendez-vous"
        valeur={seance.description}
        onChange={(v) => majSeance(seanceId, { description: v })}
        placeholder="Apporte ses résultats, vient accompagnée…"
        aide="Note pratique, visible dans l’agenda. Rien de clinique."
      />

      {p && seance.statut === 'prevu' && <BoutonRappel seance={seance} patient={p} />}

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

        {due ? (
          <>
            <button
              className={`btn ${seance.paye ? '' : 'principal'} bloc${vientDePayer ? ' valide' : ''}`}
              style={{ marginTop: 12 }}
              onClick={basculerPaiement}
            >
              {!seance.paye && <IconeCheck taille={16} />}
              {seance.paye ? 'Annuler l’encaissement' : 'Marquer comme payée'}
            </button>
            {seance.paye && (
              <>
                <div className="entete-section" style={{ marginTop: 18 }}><h3>Réglé par</h3></div>
                <div className="choix">
                  {MODES_PAIEMENT.map((m: ModePaiement) => (
                    <button
                      key={m}
                      aria-pressed={seance.modePaiement === m}
                      onClick={() => majSeance(seanceId, { modePaiement: m })}
                    >
                      {LIBELLE_PAIEMENT[m]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="aide">Rien à encaisser pour cette séance.</p>
        )}
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
