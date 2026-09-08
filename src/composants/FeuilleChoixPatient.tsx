import { useMemo, useState } from 'react'
import Feuille from './Feuille'
import { useDonnees, ajouterPatient, ajouterSeance } from '../lib/store'
import { dateLongue } from '../lib/dates'
import { initiales, normaliser } from '../lib/format'
import { nomAffiche } from '../lib/affichage'

interface Props {
  date: string
  creneau: number
  onFermer: () => void
  onSeanceCreee: (seanceId: string) => void
}

export default function FeuilleChoixPatient({ date, creneau, onFermer, onSeanceCreee }: Props) {
  const { patients, reglages } = useDonnees()
  const [recherche, setRecherche] = useState('')
  const [creation, setCreation] = useState(false)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')

  const c = reglages.creneaux[creneau]

  const listeTriee = useMemo(() => {
    const q = normaliser(recherche)
    return patients
      .filter((p) => p.statut !== 'cloture' || q.length > 0)
      .filter((p) => !q || normaliser(`${p.prenom} ${p.nom} ${p.telephone}`).includes(q))
      .sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'))
  }, [patients, recherche])

  const placer = (patientId: string) => {
    const s = ajouterSeance(patientId, date, creneau)
    onSeanceCreee(s.id)
  }

  const creer = () => {
    if (!prenom.trim() && !nom.trim()) return
    const p = ajouterPatient({
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
      dateNaissance: '',
      motif: '',
      adressePar: '',
      statut: 'actif',
      anamnese: '',
      tarifPerso: null,
    })
    placer(p.id)
  }

  return (
    <Feuille
      titre="Qui vient ?"
      sous={`${dateLongue(date)} · ${c?.debut ?? ''} – ${c?.fin ?? ''}`}
      onFermer={onFermer}
    >
      {creation ? (
        <>
          <div className="duo">
            <div className="champ">
              <label htmlFor="np-prenom">Prénom</label>
              <input id="np-prenom" value={prenom} autoFocus onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div className="champ">
              <label htmlFor="np-nom">Nom</label>
              <input id="np-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
          </div>
          <div className="champ">
            <label htmlFor="np-tel">Téléphone</label>
            <input id="np-tel" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <p className="aide" style={{ color: 'var(--doux)', fontSize: '.82rem', marginBottom: 14 }}>
            Le reste du dossier pourra être complété plus tard.
          </p>
          <div className="btn-rang">
            <button className="btn" onClick={() => setCreation(false)}>Retour</button>
            <button
              className="btn principal"
              disabled={!prenom.trim() && !nom.trim()}
              onClick={creer}
            >
              Créer et placer
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            className="recherche"
            placeholder="Rechercher un patient…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <button
            className="btn principal bloc"
            style={{ marginTop: 12 }}
            onClick={() => setCreation(true)}
          >
            Nouveau patient
          </button>

          {listeTriee.length === 0 ? (
            <div className="vide">
              {patients.length === 0
                ? <><strong>Aucun patient pour l’instant</strong>Créez le premier ci-dessus.</>
                : <>Aucun patient ne correspond.</>}
            </div>
          ) : (
            <div className="carte" style={{ marginTop: 14 }}>
              {listeTriee.map((p) => (
                <button key={p.id} className="ligne" onClick={() => placer(p.id)}>
                  <span className={`pastille ${p.statut === 'actif' ? '' : p.statut}`}>
                    {initiales(p.prenom, p.nom)}
                  </span>
                  <span className="ligne-corps">
                    <span className="ligne-titre">{nomAffiche(p, reglages.masquerNoms)}</span>
                    <span className="ligne-sous">{p.motif || p.telephone || 'Dossier à compléter'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Feuille>
  )
}
