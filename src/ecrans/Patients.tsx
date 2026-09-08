import { useMemo, useState } from 'react'
import { useDonnees } from '../lib/store'
import { initiales, normaliser } from '../lib/format'
import { LIBELLE_STATUT_PATIENT, nomAffiche } from '../lib/affichage'
import { Chevron } from '../composants/Icones'
import type { StatutPatient } from '../lib/types'

interface Props {
  onOuvrirPatient: (id: string) => void
  onNouveauPatient: () => void
}

const FILTRES: Array<{ cle: StatutPatient | 'tous'; libelle: string }> = [
  { cle: 'actif', libelle: 'En suivi' },
  { cle: 'pause', libelle: 'En pause' },
  { cle: 'cloture', libelle: 'Terminés' },
  { cle: 'tous', libelle: 'Tous' },
]

export default function Patients({ onOuvrirPatient, onNouveauPatient }: Props) {
  const { patients, seances, reglages } = useDonnees()
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<StatutPatient | 'tous'>('actif')

  const liste = useMemo(() => {
    const q = normaliser(recherche)
    return patients
      .filter((p) => (filtre === 'tous' ? true : p.statut === filtre))
      .filter((p) => !q || normaliser(`${p.prenom} ${p.nom} ${p.telephone} ${p.motif}`).includes(q))
      .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr'))
  }, [patients, recherche, filtre])

  const compte = (cle: StatutPatient | 'tous') =>
    cle === 'tous' ? patients.length : patients.filter((p) => p.statut === cle).length

  return (
    <>
      <input
        className="recherche"
        placeholder="Rechercher un nom, un téléphone…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />

      <div className="choix" style={{ marginTop: 12 }}>
        {FILTRES.map((f) => (
          <button key={f.cle} aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}>
            {f.libelle} ({compte(f.cle)})
          </button>
        ))}
      </div>

      <button className="btn principal bloc" style={{ marginTop: 12 }} onClick={onNouveauPatient}>
        Nouveau patient
      </button>

      {liste.length === 0 ? (
        <div className="vide">
          <strong>Aucun patient à afficher</strong>
          {patients.length === 0
            ? 'Ajoutez votre premier dossier avec le bouton ci-dessus.'
            : 'Essayez un autre filtre ou une autre recherche.'}
        </div>
      ) : (
        <div className="carte" style={{ marginTop: 14 }}>
          {liste.map((p) => {
            const nb = seances.filter((s) => s.patientId === p.id && s.statut === 'effectue').length
            return (
              <button key={p.id} className="ligne" onClick={() => onOuvrirPatient(p.id)}>
                <span className={`pastille ${p.statut === 'actif' ? '' : p.statut}`}>
                  {initiales(p.prenom, p.nom)}
                </span>
                <span className="ligne-corps">
                  <span className={`ligne-titre${reglages.masquerNoms ? ' flou' : ''}`}>
                    {nomAffiche(p, false)}
                  </span>
                  <span className="ligne-sous">
                    {nb} séance{nb > 1 ? 's' : ''}
                    {p.motif ? ` · ${p.motif}` : ''}
                    {p.statut !== 'actif' ? ` · ${LIBELLE_STATUT_PATIENT[p.statut]}` : ''}
                  </span>
                </span>
                <Chevron />
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
