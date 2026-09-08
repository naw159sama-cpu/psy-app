import { useState } from 'react'
import { useDonnees, majSeance } from '../lib/store'
import { aujourdhui, ajouterMois, moisCourant, moisLibelle, dateBreve } from '../lib/dates'
import { da, initiales, montantSeul, pourcent } from '../lib/format'
import { bilan, estDue } from '../lib/argent'
import { LIBELLE_STATUT, nomAffiche } from '../lib/affichage'
import { useCompteur } from '../composants/Compteur'
import {
  FlecheDroite, FlecheGauche, IconeAbsence, IconeAttente, IconeBas, IconeCabinet,
  IconeCheck, IconePortefeuille, IconeRecu, IconeVerifie,
} from '../composants/Icones'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
}

export default function Argent({ onOuvrirSeance }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const [mois, setMois] = useState(moisCourant())
  const [voirTout, setVoirTout] = useState(false)
  const [encaisseA, setEncaisseA] = useState<string | null>(null)

  const duMois = seances.filter((s) => s.date.startsWith(mois))
  const b = bilan(duMois)
  const partAnimee = useCompteur(b.partPsy)
  const partEncaissee = b.total > 0 ? Math.round((b.encaisse / b.total) * 100) : 0

  // Tous les impayés, pas seulement ceux du mois affiché : c'est ce qu'elle doit relancer.
  const impayes = seances
    .filter((s) => estDue(s.statut) && !s.paye && s.date <= aujourdhui())
    .sort((a, c) => (a.date < c.date ? -1 : 1))
  const totalImpayes = impayes.reduce((t, s) => t + s.tarif, 0)
  const visibles = voirTout ? impayes : impayes.slice(0, 3)
  const restants = impayes.length - visibles.length

  const encaisser = (id: string) => {
    setEncaisseA(id)
    majSeance(id, { paye: true, modePaiement: 'especes', datePaiement: aujourdhui() })
    setTimeout(() => setEncaisseA(null), 600)
  }

  return (
    <>
      <div className="periode">
        <button className="fleche" aria-label="Mois précédent" onClick={() => setMois(ajouterMois(mois, -1))}>
          <FlecheGauche />
        </button>
        <span className="periode-titre">{moisLibelle(mois)}</span>
        <button
          className="fleche"
          aria-label="Mois suivant"
          disabled={mois >= moisCourant()}
          onClick={() => setMois(ajouterMois(mois, 1))}
        >
          <FlecheDroite />
        </button>
      </div>

      <section className="carte-hero">
        <span className="bulle bulle-1" />
        <span className="bulle bulle-2" />
        <div className="hero-interieur">
          <div className="hero-ligne">
            <span className="hero-badge">
              <IconePortefeuille />
              Honoraires praticienne
            </span>
            <span className="hero-note">
              <IconeVerifie />
              {mois === moisCourant() ? 'Mois en cours' : 'Mois clos'}
            </span>
          </div>
          <div className="hero-montant">
            <span className="nombre">{montantSeul(partAnimee)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="hero-legende">Ma part sur {moisLibelle(mois)}</p>
          <div className="hero-pied">
            <span className="clef">Déjà encaissé</span>
            <span className="valeur">{pourcent(partEncaissee)} du facturé</span>
          </div>
          <div className="hero-jauge">
            <span style={{ width: `${partEncaissee}%` }} />
          </div>
        </div>
      </section>

      <section className="duo-cartes">
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconeRecu /></span>
            <span className="stat-libelle">Total facturé</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{montantSeul(b.total)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="stat-detail">{b.nbDues} séance{b.nbDues > 1 ? 's' : ''} générée{b.nbDues > 1 ? 's' : ''}</p>
        </div>
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconeCabinet /></span>
            <span className="stat-libelle">Part du cabinet</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{montantSeul(b.partCabinet)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="stat-detail">Mise à disposition {pourcent(100 - reglages.partPsyPct)}</p>
        </div>
      </section>

      <section>
        <div className="entete-section">
          <h3>Détail du mois</h3>
        </div>
        <div className="carte">
          <div className="rang">
            <span className="rang-lib">Séances dues</span>
            <span className="rang-val">{b.nbDues}</span>
          </div>
          <div className="rang">
            <span className="rang-lib doux"><IconeAbsence taille={16} /> dont absences facturées</span>
            <span className="etiquette">{b.nbAbsences}</span>
          </div>
          <div className="rang">
            <span className="rang-lib"><span className="pastille-point" /> Encaissé</span>
            <span className="rang-val fort">{da(b.encaisse)}</span>
          </div>
          <div className={`rang${b.impaye > 0 ? ' corail' : ''}`}>
            <span className="rang-lib">
              <IconeAttente taille={16} /> Reste dû
            </span>
            {b.impaye > 0
              ? <span className="etiquette corail">{da(b.impaye)}</span>
              : <span className="rang-val fort">{da(0)}</span>}
          </div>
          <div className="rang">
            <span className="rang-lib doux">Répartition conventionnelle</span>
            <span className="etiquette">{reglages.partPsyPct} / {100 - reglages.partPsyPct}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="entete-section">
          <h3>
            À encaisser
            {impayes.length > 0 && <span className="compteur">{impayes.length}</span>}
          </h3>
          {totalImpayes > 0 && (
            <span className="entete-note">Total : <strong>{da(totalImpayes)}</strong></span>
          )}
        </div>

        {impayes.length === 0 ? (
          <div className="vide">
            <span className="disque grand"><IconeCheck taille={22} /></span>
            <strong>Tout est encaissé</strong>
            Rien à relancer pour le moment.
          </div>
        ) : (
          <>
            <div className="pile">
              {visibles.map((s) => {
                const p = patients.find((x) => x.id === s.patientId)
                return (
                  <div key={s.id} className="carte-ligne" style={{ cursor: 'default' }}>
                    <span
                      className="monogramme"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOuvrirSeance(s.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onOuvrirSeance(s.id) }}
                    >
                      {p ? initiales(p.prenom, p.nom) : '?'}
                    </span>
                    <span
                      className="ligne-corps"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOuvrirSeance(s.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onOuvrirSeance(s.id) }}
                    >
                      <span className="ligne-titre">
                        <span className={`nom${reglages.masquerNoms ? ' flou' : ''}`}>
                          {nomAffiche(p, false)}
                        </span>
                        {s.statut !== 'effectue' && (
                          <span className="puce attente">{LIBELLE_STATUT[s.statut]}</span>
                        )}
                      </span>
                      <span className="ligne-sous">
                        <span className="accent">{da(s.tarif)}</span>
                        <span>·</span>
                        <span>{dateBreve(s.date)}</span>
                      </span>
                    </span>
                    <button
                      className={`btn principal petit${encaisseA === s.id ? ' valide' : ''}`}
                      onClick={() => encaisser(s.id)}
                    >
                      <IconeCheck taille={15} />
                      Encaisser
                    </button>
                  </div>
                )
              })}
            </div>

            {(restants > 0 || voirTout) && (
              <div style={{ textAlign: 'center', paddingTop: 12 }}>
                <button className="lien" onClick={() => setVoirTout(!voirTout)}>
                  {voirTout
                    ? 'Réduire la liste'
                    : `Voir les ${restants} autres séances en attente`}
                  <IconeBas />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
