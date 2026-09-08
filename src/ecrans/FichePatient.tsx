import { useState } from 'react'
import { useDonnees, majPatient, supprimerPatient } from '../lib/store'
import { dateCourte, age } from '../lib/dates'
import { da, montantSeul } from '../lib/format'
import { bilan, partPsy } from '../lib/argent'
import { LIBELLE_STATUT, couleurStatut } from '../lib/affichage'
import { useCompteur } from '../composants/Compteur'
import {
  IconeAttente, IconeCadenas, IconeNote, IconePortefeuille, IconeRecu,
} from '../composants/Icones'
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

  const siennes = seances
    .filter((s) => s.patientId === patientId)
    .sort((a, b) => (a.date === b.date ? b.creneau - a.creneau : (a.date < b.date ? 1 : -1)))
  const b = bilan(siennes)
  const totalPart = siennes.reduce((t, s) => t + partPsy(s), 0)
  const partAnimee = useCompteur(totalPart)

  if (!p) {
    return (
      <div className="vide">
        <strong>Dossier introuvable</strong>
        Il a peut-être été supprimé.
      </div>
    )
  }

  const anAge = age(p.dateNaissance)
  const maj = (champs: Partial<typeof p>) => majPatient(patientId, champs)

  return (
    <>
      <section className="duo-cartes">
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconeRecu /></span>
            <span className="stat-libelle">Séances effectuées</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{b.nbEffectuees}</span>
          </div>
          <p className="stat-detail">
            {siennes.length} rendez-vous au total
          </p>
        </div>
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconePortefeuille /></span>
            <span className="stat-libelle">Ma part cumulée</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{montantSeul(partAnimee)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="stat-detail">
            {b.impaye > 0 ? `${da(b.impaye)} en attente` : 'Aucun impayé'}
          </p>
        </div>
      </section>

      {b.impaye > 0 && (
        <div className="note-confidentielle">
          <IconeAttente taille={17} />
          <span>
            <strong>{da(b.impaye)} restent à encaisser</strong>
            Répartis sur {siennes.filter((s) => !s.paye && s.statut !== 'prevu' && s.statut !== 'annule_delai').length} séance(s).
          </span>
        </div>
      )}

      <section>
        <div className="entete-section"><h3>Suivi</h3></div>
        <div className="choix">
          {STATUTS.map((s) => (
            <button key={s.cle} aria-pressed={p.statut === s.cle} onClick={() => maj({ statut: s.cle })}>
              {s.libelle}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="entete-section"><h3>Coordonnées</h3></div>
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
          {anAge !== null && (
            <p className="aide">
              {anAge} ans{anAge < 18 ? ' — mineur, accord des parents nécessaire' : ''}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="entete-section"><h3>Suivi clinique</h3></div>
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
      </section>

      <section>
        <div className="entete-section"><h3>Tarif</h3></div>
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
      </section>

      <section>
        <div className="entete-section">
          <h3>Historique <span className="compteur calme">{siennes.length}</span></h3>
        </div>
        {siennes.length === 0 ? (
          <div className="vide">
            <span className="disque grand"><IconeNote taille={22} /></span>
            Aucune séance enregistrée.
          </div>
        ) : (
          <div className="pile">
            {siennes.map((s) => (
              <button key={s.id} className="carte-ligne" onClick={() => onOuvrirSeance(s.id)}>
                <span className="disque grand">
                  {s.note.trim() ? <IconeNote taille={18} /> : <IconeAttente taille={18} />}
                </span>
                <span className="ligne-corps">
                  <span className="ligne-titre">
                    <span className="nom">{dateCourte(s.date)}</span>
                  </span>
                  <span className="ligne-sous">
                    <span>{reglages.creneaux[s.creneau]?.debut ?? '—'}</span>
                    <span>·</span>
                    <span>{s.note.trim() ? 'note écrite' : 'pas de note'}</span>
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
      </section>

      <section>
        {confirmeSuppr ? (
          <>
            <div className="note-confidentielle" style={{ marginBottom: 12 }}>
              <IconeCadenas taille={17} />
              <span>
                <strong>Suppression définitive</strong>
                Le dossier et ses {siennes.length} séance{siennes.length > 1 ? 's' : ''} seront
                effacés. Faites d’abord une sauvegarde si vous hésitez.
              </span>
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
      </section>
    </>
  )
}
