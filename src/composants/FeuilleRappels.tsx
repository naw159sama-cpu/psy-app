import Feuille from './Feuille'
import { useDonnees } from '../lib/store'
import { aujourdhui, dateBreve } from '../lib/dates'
import { da, initiales } from '../lib/format'
import { estDue } from '../lib/argent'
import { nomAffiche } from '../lib/affichage'
import { IconeAttente, IconeCheck, IconeNote } from './Icones'

interface Props {
  onFermer: () => void
  onOuvrirSeance: (seanceId: string) => void
}

/** Ce qui traîne : notes non écrites et séances non encaissées. */
export default function FeuilleRappels({ onFermer, onOuvrirSeance }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const today = aujourdhui()

  const notes = seances
    .filter((s) => s.date < today && s.statut === 'effectue' && !s.note.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const impayes = seances
    .filter((s) => s.date <= today && estDue(s.statut) && !s.paye)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const nom = (id: string) => nomAffiche(patients.find((p) => p.id === id), reglages.masquerNoms)
  const mono = (id: string) => {
    const p = patients.find((x) => x.id === id)
    return p ? initiales(p.prenom, p.nom) : '?'
  }

  const ouvrir = (id: string) => { onFermer(); onOuvrirSeance(id) }

  return (
    <Feuille
      titre="Rappels"
      sous={
        notes.length + impayes.length === 0
          ? 'Rien ne traîne, tout est à jour.'
          : `${notes.length + impayes.length} point${notes.length + impayes.length > 1 ? 's' : ''} à traiter`
      }
      onFermer={onFermer}
    >
      {notes.length + impayes.length === 0 && (
        <div className="vide">
          <span className="disque grand"><IconeCheck taille={22} /></span>
          <strong>Vous êtes à jour</strong>
          Aucune note en retard, aucune séance impayée.
        </div>
      )}

      {notes.length > 0 && (
        <section>
          <div className="entete-section">
            <h3>Notes à écrire <span className="pastille-date urgente">{notes.length}</span></h3>
          </div>
          <div className="pile">
            {notes.slice(0, 8).map((s) => (
              <button key={s.id} className="carte-ligne" onClick={() => ouvrir(s.id)}>
                <span className="disque grand"><IconeNote taille={19} /></span>
                <span className="ligne-corps">
                  <span className="ligne-titre">
                    <span className={`nom${reglages.masquerNoms ? ' flou' : ''}`}>
                      {nom(s.patientId)}
                    </span>
                  </span>
                  <span className="ligne-sous">Séance du {dateBreve(s.date)}</span>
                </span>
                <span className="puce attente">À noter</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {impayes.length > 0 && (
        <section style={{ marginTop: notes.length > 0 ? 22 : 0 }}>
          <div className="entete-section">
            <h3>À encaisser <span className="pastille-date urgente">{impayes.length}</span></h3>
            <span className="entete-note">
              Total : <strong>{da(impayes.reduce((t, s) => t + s.tarif, 0))}</strong>
            </span>
          </div>
          <div className="pile">
            {impayes.slice(0, 8).map((s) => (
              <button key={s.id} className="carte-ligne" onClick={() => ouvrir(s.id)}>
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
                    <span>{dateBreve(s.date)}</span>
                  </span>
                </span>
                <span className="disque"><IconeAttente taille={16} /></span>
              </button>
            ))}
          </div>
        </section>
      )}
    </Feuille>
  )
}
