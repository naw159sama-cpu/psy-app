import { useState } from 'react'
import type { Patient, Seance } from '../lib/types'
import { journaliserRappel, marquerRappelEnvoye, useDonnees } from '../lib/store'
import { eligibilite, lienWhatsApp, messagePour } from '../lib/rappels'
import { IconeCheck, IconeWhatsApp } from './Icones'

interface Props {
  seance: Seance
  patient: Patient
}

/**
 * Rappel ponctuel depuis une séance, hors du flux quotidien.
 * Le lien est prêt avant le clic : l'ouverture reste synchrone.
 */
export default function BoutonRappel({ seance, patient }: Props) {
  const { reglages } = useDonnees()
  const [ouvert, setOuvert] = useState(false)

  const e = eligibilite(patient, reglages)
  const modele = reglages.modelesRappel.find((m) => m.actif) ?? reglages.modelesRappel[0]
  if (!e.eligible || !modele) {
    return (
      <p className="aide" style={{ margin: '0 2px 16px' }}>
        {e.eligible ? 'Aucun modèle de message actif.' : `Rappel impossible : ${e.motif.toLowerCase()}.`}
      </p>
    )
  }

  const message = messagePour(seance, patient, reglages, modele)

  if (seance.rappelEnvoyeLe) {
    return (
      <p className="aide sauge" style={{ margin: '0 2px 16px' }}>
        Rappel marqué comme envoyé.
      </p>
    )
  }

  return (
    <div className="rappel-ponctuel">
      <a
        className="btn bloc"
        href={lienWhatsApp(e.destinataire.numero, message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          journaliserRappel(patient.id, seance.id, seance.date, modele.id, 'prepare')
          setOuvert(true)
        }}
      >
        <IconeWhatsApp taille={17} />
        Envoyer un rappel
      </a>
      {ouvert && (
        <button
          className="btn principal bloc"
          style={{ marginTop: 8 }}
          onClick={() => { marquerRappelEnvoye(seance.id, modele.id); setOuvert(false) }}
        >
          <IconeCheck taille={16} />
          Marquer comme envoyé
        </button>
      )}
    </div>
  )
}
