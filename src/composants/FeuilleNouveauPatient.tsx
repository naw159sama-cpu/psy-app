import { useState } from 'react'
import Feuille from './Feuille'
import ChampDicte from './ChampDicte'
import ChampThemes from './ChampThemes'
import { ajouterPatient } from '../lib/store'
import { cleTheme } from '../lib/themes'

interface Props {
  onFermer: () => void
  onCree: (patientId: string) => void
}

export default function FeuilleNouveauPatient({ onFermer, onCree }: Props) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [motif, setMotif] = useState('')
  const [themes, setThemes] = useState<string[]>([])

  const valide = prenom.trim().length > 0 || nom.trim().length > 0

  const basculerTheme = (t: string) => {
    const cle = cleTheme(t)
    setThemes((liste) => (liste.some((x) => cleTheme(x) === cle)
      ? liste.filter((x) => cleTheme(x) !== cle)
      : [...liste, t.trim()]))
  }

  const creer = () => {
    if (!valide) return
    const p = ajouterPatient({
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
      dateNaissance: '',
      motif: motif.trim(),
      themes,
      adressePar: '',
      statut: 'actif',
      anamnese: '',
      objectifs: [],
      canalRappel: 'aucun',
      consentementLe: null,
      messageNeutreRenforce: false,
      representant: null,
      tarifPerso: null,
    })
    onCree(p.id)
  }

  return (
    <Feuille
      titre="Nouveau patient"
      sous="Le strict nécessaire, le reste se complète plus tard."
      onFermer={onFermer}
    >
      <div className="duo">
        <div className="champ">
          <label htmlFor="n-prenom">Prénom</label>
          <input id="n-prenom" autoFocus value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <div className="champ">
          <label htmlFor="n-nom">Nom</label>
          <input id="n-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
      </div>
      <div className="champ">
        <label htmlFor="n-tel">Téléphone</label>
        <input id="n-tel" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      </div>
      <ChampDicte
        id="n-motif"
        label="Motif de consultation"
        valeur={motif}
        onChange={setMotif}
        placeholder="Anxiété, deuil, suivi de l’enfant…"
      />
      <ChampThemes themes={themes} motif={motif} onBasculer={basculerTheme} />
      <div className="btn-rang">
        <button className="btn" onClick={onFermer}>Annuler</button>
        <button className="btn corail" disabled={!valide} onClick={creer}>Créer le dossier</button>
      </div>
    </Feuille>
  )
}
