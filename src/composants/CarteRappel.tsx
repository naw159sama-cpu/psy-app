import { useEffect, useState } from 'react'
import type { Modele, Patient, Seance } from '../lib/types'
import {
  annulerRappelEnvoye, journaliserRappel, marquerRappelEnvoye, useDonnees,
} from '../lib/store'
import {
  LONGUEUR_ALERTE, estIOS, eligibilite, lienSms, lienWhatsApp, messagePour,
} from '../lib/rappels'
import { lisible } from '../lib/telephone'
import { initiales } from '../lib/format'
import {
  Chevron, IconeCheck, IconeCopier, IconeCrayon, IconeWhatsApp,
} from './Icones'

interface Props {
  seance: Seance
  patient: Patient
  modele: Modele
  onOuvrirPatient: (id: string) => void
}

/** Combien de temps l'annulation reste offerte après un marquage. */
const FENETRE_ANNULATION = 8000

export default function CarteRappel({ seance, patient, modele, onOuvrirPatient }: Props) {
  const { reglages } = useDonnees()
  const [edition, setEdition] = useState(false)
  const [texte, setTexte] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)
  const [annulable, setAnnulable] = useState(false)

  const e = eligibilite(patient, reglages)
  const messageAuto = messagePour(seance, patient, reglages, modele)
  const message = edition || texte ? texte : messageAuto
  const creneau = reglages.creneaux[seance.creneau]
  const envoye = !!seance.rappelEnvoyeLe

  // Le message revient au modèle si l'on change de modèle sans avoir édité.
  useEffect(() => { if (!edition) setTexte('') }, [modele.id, edition])

  useEffect(() => {
    if (!annulable) return
    const t = setTimeout(() => setAnnulable(false), FENETRE_ANNULATION)
    return () => clearTimeout(t)
  }, [annulable])

  if (!e.eligible) return null

  const { destinataire } = e
  // Les liens sont calculés au rendu : au clic, il ne reste plus qu'à suivre le
  // lien. Toute préparation asynchrone ferait perdre le geste de l'utilisatrice
  // et déclencherait le blocage de fenêtre.
  const versWhatsApp = lienWhatsApp(destinataire.numero, message)
  const versSms = lienSms(destinataire.numero, message, estIOS())
  const trop = message.length > LONGUEUR_ALERTE

  const copier = () => {
    navigator.clipboard?.writeText(message).then(
      () => { setCopie(true); setTimeout(() => setCopie(false), 2000) },
      () => setCopie(false),
    )
  }

  const noterOuverture = () => {
    journaliserRappel(patient.id, seance.id, seance.date, modele.id, 'prepare')
    setOuvert(true)
  }

  return (
    <article className={`carte-rappel${envoye ? ' fait' : ''}`}>
      <div className="rappel-haut">
        <button
          className="monogramme"
          onClick={() => onOuvrirPatient(patient.id)}
          aria-label={`Ouvrir le dossier de ${patient.prenom}`}
        >
          {initiales(patient.prenom, patient.nom)}
        </button>
        <div className="rappel-identite">
          <button className="rappel-nom" onClick={() => onOuvrirPatient(patient.id)}>
            <span className={reglages.masquerNoms ? 'flou' : undefined}>
              {patient.prenom} {patient.nom}
            </span>
            <Chevron taille={14} />
          </button>
          <p className="rappel-sous">
            {creneau?.debut ?? ''} – {creneau?.fin ?? ''}
            {patient.motif ? ` · ${patient.motif}` : ''}
          </p>
          <p className="rappel-numero">
            {destinataire.viaRepresentant && (
              <span className="etiquette petite">via {destinataire.nom}</span>
            )}
            {lisible(destinataire.numero)}
          </p>
        </div>
        <span className={`puce ${envoye ? 'ok' : 'attente'}`}>
          {envoye ? 'Envoyé' : 'À envoyer'}
        </span>
      </div>

      {edition ? (
        <div className="champ" style={{ marginBottom: 10 }}>
          <textarea
            rows={4}
            value={message}
            autoFocus
            onChange={(ev) => setTexte(ev.target.value)}
          />
          <div className="rappel-edition-pied">
            <span className={`compte-car${trop ? ' trop' : ''}`}>
              {message.length} caractères
              {trop && ' — au-delà de 1000, certains navigateurs coupent le lien'}
            </span>
            <div className="btn-rang" style={{ flex: '0 0 auto' }}>
              <button className="btn petit" onClick={() => { setTexte(''); setEdition(false) }}>
                Revenir au modèle
              </button>
              <button className="btn petit principal" onClick={() => setEdition(false)}>
                Garder
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="rappel-apercu" onClick={() => { setTexte(message); setEdition(true) }}>
          <span className="rappel-texte">{message}</span>
          <span className="rappel-crayon"><IconeCrayon taille={15} /></span>
        </button>
      )}

      <div className="rappel-actions">
        <a
          className="btn principal"
          href={versWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={noterOuverture}
        >
          <IconeWhatsApp taille={17} />
          Ouvrir WhatsApp
        </a>
        <a className="btn" href={versSms} onClick={noterOuverture}>
          Par SMS
        </a>
        <button className="btn" onClick={copier} aria-label="Copier le message">
          <IconeCopier taille={16} />
          {copie ? 'Copié' : 'Copier'}
        </button>
      </div>

      {ouvert && !envoye && (
        <div className="rappel-retour">
          <p>
            L’application ne peut pas savoir si le message est parti.
            Confirmez vous-même une fois envoyé.
          </p>
          <button
            className="btn principal bloc"
            onClick={() => { marquerRappelEnvoye(seance.id, modele.id); setAnnulable(true); setOuvert(false) }}
          >
            <IconeCheck taille={16} />
            Marquer comme envoyé
          </button>
        </div>
      )}

      {envoye && annulable && (
        <div className="rappel-retour">
          <button
            className="btn bloc"
            onClick={() => { annulerRappelEnvoye(seance.id); setAnnulable(false) }}
          >
            Annuler — ce n’était pas envoyé
          </button>
        </div>
      )}
    </article>
  )
}
