import { useMemo, useState } from 'react'
import CarteRappel from '../composants/CarteRappel'
import { majReglages, useDonnees } from '../lib/store'
import { eligibilite } from '../lib/rappels'
import { ajouterJours, aujourdhui, dateLongue } from '../lib/dates'
import {
  FlecheDroite, FlecheGauche, IconeCadenas, IconeCheck, IconeCloche, IconeMessage,
} from '../composants/Icones'

interface Props {
  /** Jour proposé à l’ouverture : le prochain qui porte des rendez-vous. */
  jourInitial: string | null
  onOuvrirPatient: (id: string) => void
}

export default function Rappels({ jourInitial, onOuvrirPatient }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const today = aujourdhui()
  const [date, setDate] = useState(() => jourInitial ?? ajouterJours(today, 1))
  const [modeleId, setModeleId] = useState(reglages.modelesRappel[0]?.id ?? 'veille')

  const modeles = reglages.modelesRappel.filter((m) => m.actif)
  const modele = modeles.find((m) => m.id === modeleId) ?? modeles[0]

  const { aEnvoyer, exclus } = useMemo(() => {
    const duJour = seances
      .filter((s) => s.date === date && s.statut === 'prevu')
      .sort((a, b) => a.creneau - b.creneau)
    const ok: typeof duJour = []
    const ko: Array<{ seance: (typeof duJour)[number]; nom: string; motif: string }> = []
    for (const s of duJour) {
      const p = patients.find((x) => x.id === s.patientId)
      const e = eligibilite(p, reglages)
      if (e.eligible) ok.push(s)
      else {
        ko.push({
          seance: s,
          nom: p ? `${p.prenom} ${p.nom}`.trim() : 'Dossier introuvable',
          motif: e.motif,
        })
      }
    }
    return { aEnvoyer: ok, exclus: ko }
  }, [seances, patients, reglages, date])

  const envoyes = aEnvoyer.filter((s) => s.rappelEnvoyeLe).length

  if (!reglages.avertissementRappelsVu) {
    return (
      <section className="carte-avertissement">
        <span className="disque grand"><IconeCadenas taille={22} /></span>
        <h3>Avant d’utiliser les rappels</h3>
        <p>
          WhatsApp appartient à Meta. Le contenu des messages est chiffré, mais
          les <strong>métadonnées</strong> ne le sont pas : qui écrit à qui, et
          quand. Un rappel régulier envoyé à un même numéro révèle une relation
          suivie, même si le message ne dit rien.
        </p>
        <p>
          Ce canal ne doit <strong>jamais</strong> servir à échanger du contenu
          clinique. Les modèles fournis ne mentionnent ni votre profession, ni le
          motif, ni le mot « séance ».
        </p>
        <p>
          Le SMS n’expose pas les mêmes métadonnées à un tiers. Il est proposé
          patient par patient, dans chaque dossier.
        </p>
        <button
          className="btn principal bloc"
          onClick={() => majReglages({ avertissementRappelsVu: true })}
        >
          J’ai compris
        </button>
      </section>
    )
  }

  return (
    <>
      <div className="periode">
        <button className="fleche" aria-label="Jour précédent" onClick={() => setDate(ajouterJours(date, -1))}>
          <FlecheGauche />
        </button>
        <span className="periode-titre">
          {date === today ? 'Aujourd’hui' : date === ajouterJours(today, 1) ? 'Demain' : dateLongue(date)}
        </span>
        <button className="fleche" aria-label="Jour suivant" onClick={() => setDate(ajouterJours(date, 1))}>
          <FlecheDroite />
        </button>
      </div>

      <div className="choix">
        <button aria-pressed={date === ajouterJours(today, 1)} onClick={() => setDate(ajouterJours(today, 1))}>
          Demain
        </button>
        <button aria-pressed={date === today} onClick={() => setDate(today)}>
          Aujourd’hui
        </button>
        <label className="choix-date">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      {aEnvoyer.length > 0 && (
        <div className="compteur-envois">
          <span className="compteur-chiffre">{envoyes} sur {aEnvoyer.length}</span>
          <span className="compteur-texte">
            {envoyes === aEnvoyer.length ? 'tout est envoyé' : 'envoyés'}
          </span>
          <span className="compteur-jauge">
            <span style={{ width: `${aEnvoyer.length ? (envoyes / aEnvoyer.length) * 100 : 0}%` }} />
          </span>
        </div>
      )}

      {modeles.length > 1 && (
        <section>
          <div className="entete-section"><h3>Modèle utilisé</h3></div>
          <div className="choix">
            {modeles.map((m) => (
              <button key={m.id} aria-pressed={m.id === modele?.id} onClick={() => setModeleId(m.id)}>
                {m.nom}
              </button>
            ))}
          </div>
        </section>
      )}

      {aEnvoyer.length === 0 && exclus.length === 0 ? (
        <div className="vide">
          <span className="disque grand sauge"><IconeCheck taille={22} /></span>
          <strong>Aucun rendez-vous ce jour-là</strong>
          Rien à rappeler pour le {dateLongue(date)}.
        </div>
      ) : (
        <section>
          <div className="entete-section">
            <h3>
              À envoyer
              {aEnvoyer.length > 0 && <span className="pastille-date">{aEnvoyer.length}</span>}
            </h3>
            <span className="entete-note">un envoi à la fois</span>
          </div>
          {aEnvoyer.length === 0 ? (
            <div className="vide">
              <span className="disque grand"><IconeCloche taille={22} /></span>
              <strong>Personne à rappeler</strong>
              Les rendez-vous de ce jour sont tous exclus, voir ci-dessous.
            </div>
          ) : (
            <div className="pile">
              {aEnvoyer.map((s) => {
                const p = patients.find((x) => x.id === s.patientId)!
                return modele ? (
                  <CarteRappel
                    key={s.id}
                    seance={s}
                    patient={p}
                    modele={modele}
                    onOuvrirPatient={onOuvrirPatient}
                  />
                ) : null
              })}
            </div>
          )}
        </section>
      )}

      {exclus.length > 0 && (
        <section>
          <div className="entete-section">
            <h3>Non rappelés <span className="pastille-date">{exclus.length}</span></h3>
          </div>
          <div className="carte">
            {exclus.map(({ seance, nom, motif }) => (
              <button
                key={seance.id}
                className="rang rang-cliquable"
                onClick={() => onOuvrirPatient(seance.patientId)}
              >
                <span className="rang-lib">
                  <span className="disque"><IconeMessage taille={15} /></span>
                  <span className="exclusion-textes">
                    <span className={`exclusion-nom${reglages.masquerNoms ? ' flou' : ''}`}>{nom}</span>
                    <span className="exclusion-motif">{motif}</span>
                  </span>
                </span>
                <span className="rang-val">{reglages.creneaux[seance.creneau]?.debut}</span>
              </button>
            ))}
          </div>
          <p className="aide">
            Ouvrez le dossier pour recueillir le consentement ou corriger le numéro.
          </p>
        </section>
      )}
    </>
  )
}
