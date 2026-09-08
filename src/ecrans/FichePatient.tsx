import { useState } from 'react'
import { useDonnees, majPatient, supprimerPatient } from '../lib/store'
import { dateCourte, age } from '../lib/dates'
import { da } from '../lib/format'
import { bilan, partPsy } from '../lib/argent'
import { LIBELLE_STATUT, couleurStatut } from '../lib/affichage'
import type { StatutPatient } from '../lib/types'

interface Props {
  patientId: string
  onOuvrirSeance: (seanceId: string) => void
  onSupprime: () => void
}

const STATUTS: Array<{ cle: StatutPatient; libelle: string }> = [
  { cle: 'actif', libelle: 'En suivi' },
  { cle: 'pause', libelle: 'En pause' },
  { cle: 'cloture', libelle: 'Terminé' },
]

export default function FichePatient({ patientId, onOuvrirSeance, onSupprime }: Props) {
  const { patients, seances, reglages } = useDonnees()
  const p = patients.find((x) => x.id === patientId)
  const [confirmeSuppr, setConfirmeSuppr] = useState(false)

  if (!p) {
    return <div className="vide"><strong>Dossier introuvable</strong>Il a peut-être été supprimé.</div>
  }

  const siennes = seances
    .filter((s) => s.patientId === patientId)
    .sort((a, b) => (a.date === b.date ? b.creneau - a.creneau : (a.date < b.date ? 1 : -1)))
  const b = bilan(siennes)
  const anAge = age(p.dateNaissance)
  const maj = (champs: Partial<typeof p>) => majPatient(patientId, champs)

  return (
    <>
      <div className="chiffres">
        <div className="chiffre">
          <div className="val">{b.nbEffectuees}</div>
          <div className="lib">Séances effectuées</div>
        </div>
        <div className="chiffre plein">
          <div className="val">{da(siennes.reduce((t, s) => t + partPsy(s), 0))}</div>
          <div className="lib">Ma part au total</div>
        </div>
        {b.impaye > 0 && (
          <div className="chiffre large">
            <div className="val" style={{ color: 'var(--alerte)' }}>{da(b.impaye)}</div>
            <div className="lib">Reste à encaisser</div>
          </div>
        )}
      </div>

      <div className="section-titre">Suivi</div>
      <div className="choix">
        {STATUTS.map((s) => (
          <button key={s.cle} aria-pressed={p.statut === s.cle} onClick={() => maj({ statut: s.cle })}>
            {s.libelle}
          </button>
        ))}
      </div>

      <div className="section-titre">Coordonnées</div>
      <div className="duo">
        <div className="champ">
          <label htmlFor="fp-prenom">Prénom</label>
          <input id="fp-prenom" value={p.prenom} onChange={(e) => maj({ prenom: e.target.value })} />
        </div>
        <div className="champ">
          <label htmlFor="fp-nom">Nom</label>
          <input id="fp-nom" value={p.nom} onChange={(e) => maj({ nom: e.target.value })} />
        </div>
      </div>
      <div className="champ">
        <label htmlFor="fp-tel">Téléphone</label>
        <input id="fp-tel" type="tel" value={p.telephone} onChange={(e) => maj({ telephone: e.target.value })} />
      </div>
      <div className="champ">
        <label htmlFor="fp-naissance">Date de naissance</label>
        <input
          id="fp-naissance"
          type="date"
          value={p.dateNaissance}
          onChange={(e) => maj({ dateNaissance: e.target.value })}
        />
        {anAge !== null && <p className="aide">{anAge} ans{anAge < 18 ? ' — mineur, accord des parents nécessaire' : ''}</p>}
      </div>

      <div className="section-titre">Suivi clinique</div>
      <div className="champ">
        <label htmlFor="fp-motif">Motif de consultation</label>
        <input id="fp-motif" value={p.motif} onChange={(e) => maj({ motif: e.target.value })} />
      </div>
      <div className="champ">
        <label htmlFor="fp-adresse">Adressé par</label>
        <input
          id="fp-adresse"
          value={p.adressePar}
          placeholder="Médecin, bouche à oreille, Instagram…"
          onChange={(e) => maj({ adressePar: e.target.value })}
        />
      </div>
      <div className="champ">
        <label htmlFor="fp-anamnese">Anamnèse et éléments de contexte</label>
        <textarea
          id="fp-anamnese"
          rows={6}
          value={p.anamnese}
          onChange={(e) => maj({ anamnese: e.target.value })}
        />
      </div>

      <div className="section-titre">Tarif</div>
      <div className="champ">
        <label htmlFor="fp-tarif">Prix de la séance pour ce patient</label>
        <input
          id="fp-tarif"
          type="number"
          inputMode="numeric"
          value={p.tarifPerso ?? ''}
          placeholder={String(reglages.tarifDefaut)}
          onChange={(e) => maj({ tarifPerso: e.target.value === '' ? null : Number(e.target.value) })}
        />
        <p className="aide">
          Laissez vide pour le tarif habituel ({da(reglages.tarifDefaut)}). Ne change que les
          prochaines séances.
        </p>
      </div>

      <div className="section-titre">Historique ({siennes.length})</div>
      {siennes.length === 0 ? (
        <div className="vide">Aucune séance enregistrée.</div>
      ) : (
        <div className="carte">
          {siennes.map((s) => (
            <button key={s.id} className="ligne" onClick={() => onOuvrirSeance(s.id)}>
              <span className="ligne-corps">
                <span className="ligne-titre">{dateCourte(s.date)}</span>
                <span className="ligne-sous">
                  {reglages.creneaux[s.creneau]?.debut ?? ''}
                  {s.note.trim() ? ' · note écrite' : ' · pas de note'}
                </span>
              </span>
              <span className="creneau-fin">
                <span className={`puce ${couleurStatut(s.statut)}`}>{LIBELLE_STATUT[s.statut]}</span>
                {!s.paye && s.statut !== 'annule_delai' && s.statut !== 'prevu' && (
                  <span className="puce attente">Impayée</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {confirmeSuppr ? (
          <>
            <div className="avert" style={{ marginBottom: 10 }}>
              <strong>Suppression définitive</strong>
              Le dossier et ses {siennes.length} séance{siennes.length > 1 ? 's' : ''} seront effacés.
              Faites d’abord une sauvegarde si vous hésitez.
            </div>
            <div className="btn-rang">
              <button className="btn" onClick={() => setConfirmeSuppr(false)}>Annuler</button>
              <button
                className="btn danger"
                onClick={() => { supprimerPatient(patientId); onSupprime() }}
              >
                Supprimer
              </button>
            </div>
          </>
        ) : (
          <button className="btn danger bloc" onClick={() => setConfirmeSuppr(true)}>
            Supprimer ce dossier
          </button>
        )}
      </div>
    </>
  )
}
