import { useState } from 'react'
import { useDonnees, majSeance } from '../lib/store'
import {
  aujourdhui, ajouterMois, moisCourant, moisLibelle, dateCourte,
} from '../lib/dates'
import { da } from '../lib/format'
import { bilan, estDue } from '../lib/argent'
import { nomAffiche } from '../lib/affichage'
import { FlecheDroite, FlecheGauche } from '../composants/Icones'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
}

export default function Argent({ onOuvrirSeance }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const [mois, setMois] = useState(moisCourant())

  const duMois = seances.filter((s) => s.date.startsWith(mois))
  const b = bilan(duMois)

  // Tous les impayés, pas seulement ceux du mois affiché : c'est ce qu'elle doit relancer.
  const impayes = seances
    .filter((s) => estDue(s.statut) && !s.paye && s.date <= aujourdhui())
    .sort((a, c) => (a.date < c.date ? -1 : 1))
  const totalImpayes = impayes.reduce((t, s) => t + s.tarif, 0)

  const encaisser = (id: string) => {
    majSeance(id, { paye: true, modePaiement: 'especes', datePaiement: aujourdhui() })
  }

  return (
    <>
      <div className="periode">
        <button className="fleche" aria-label="Mois précédent" onClick={() => setMois(ajouterMois(mois, -1))}>
          <FlecheGauche />
        </button>
        <div className="periode-titre">{moisLibelle(mois)}</div>
        <button
          className="fleche"
          aria-label="Mois suivant"
          disabled={mois >= moisCourant()}
          onClick={() => setMois(ajouterMois(mois, 1))}
          style={mois >= moisCourant() ? { opacity: .4 } : undefined}
        >
          <FlecheDroite />
        </button>
      </div>

      <div className="chiffres">
        <div className="chiffre plein large">
          <div className="val" style={{ fontSize: '1.7rem' }}>{da(b.partPsy)}</div>
          <div className="lib">Ma part sur {moisLibelle(mois)}</div>
        </div>
        <div className="chiffre">
          <div className="val">{da(b.total)}</div>
          <div className="lib">Total facturé</div>
        </div>
        <div className="chiffre">
          <div className="val">{da(b.partCabinet)}</div>
          <div className="lib">Part du cabinet</div>
        </div>
      </div>

      <div className="section-titre">Détail du mois</div>
      <div className="carte">
        <div className="rang">
          <span className="rang-lib">Séances dues</span>
          <span className="rang-val">{b.nbDues}</span>
        </div>
        <div className="rang">
          <span className="rang-lib">dont absences facturées</span>
          <span className="rang-val">{b.nbAbsences}</span>
        </div>
        <div className="rang">
          <span className="rang-lib">Encaissé</span>
          <span className="rang-val" style={{ color: 'var(--ok)' }}>{da(b.encaisse)}</span>
        </div>
        <div className="rang">
          <span className="rang-lib">Reste dû</span>
          <span className="rang-val" style={{ color: b.impaye > 0 ? 'var(--alerte)' : undefined }}>
            {da(b.impaye)}
          </span>
        </div>
        <div className="rang">
          <span className="rang-lib">Répartition</span>
          <span className="rang-val">{reglages.partPsyPct} / {100 - reglages.partPsyPct}</span>
        </div>
      </div>

      <div className="section-titre">
        À encaisser ({impayes.length})
        {totalImpayes > 0 && <span style={{ float: 'right', textTransform: 'none', letterSpacing: 0 }}>{da(totalImpayes)}</span>}
      </div>
      {impayes.length === 0 ? (
        <div className="vide"><strong>Tout est encaissé</strong>Rien à relancer.</div>
      ) : (
        <div className="carte">
          {impayes.map((s) => {
            const p = patients.find((x) => x.id === s.patientId)
            return (
              <div key={s.id} className="ligne" style={{ cursor: 'default' }}>
                <span
                  className="ligne-corps"
                  onClick={() => onOuvrirSeance(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onOuvrirSeance(s.id) }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`ligne-titre${reglages.masquerNoms ? ' flou' : ''}`}>
                    {nomAffiche(p, false)}
                  </span>
                  <span className="ligne-sous">{dateCourte(s.date)} · {da(s.tarif)}</span>
                </span>
                <button className="btn petit principal" onClick={() => encaisser(s.id)}>
                  Encaissé
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
