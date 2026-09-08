import { useMemo, useState } from 'react'
import { useDonnees } from '../lib/store'
import { initiales, normaliser } from '../lib/format'
import { LIBELLE_STATUT_PATIENT, nomAffiche } from '../lib/affichage'
import { Chevron, IconePatients } from '../composants/Icones'
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

      <div className="choix">
        {FILTRES.map((f) => (
          <button key={f.cle} aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}>
            {f.libelle} · {compte(f.cle)}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <div className="vide">
          <span className="disque grand"><IconePatients taille={22} /></span>
          <strong>Aucun dossier à afficher</strong>
          {patients.length === 0 ? (
            <>
              Créez le premier avec le bouton « Nouveau patient ».
              <div style={{ marginTop: 16 }}>
                <button className="btn principal" onClick={onNouveauPatient}>Nouveau patient</button>
              </div>
            </>
          ) : (
            'Essayez un autre filtre ou une autre recherche.'
          )}
        </div>
      ) : (
        <div className="pile">
          {liste.map((p) => {
            const siennes = seances.filter((s) => s.patientId === p.id)
            const nb = siennes.filter((s) => s.statut === 'effectue').length
            const impaye = siennes.some((s) => !s.paye && (s.statut === 'effectue' || s.statut === 'absent' || s.statut === 'annule_hors_delai'))
            return (
              <button key={p.id} className="carte-ligne" onClick={() => onOuvrirPatient(p.id)}>
                <span className={`monogramme ${p.statut === 'actif' ? '' : p.statut}`}>
                  {initiales(p.prenom, p.nom)}
                </span>
                <span className="ligne-corps">
                  <span className="ligne-titre">
                    <span className={`nom${reglages.masquerNoms ? ' flou' : ''}`}>
                      {nomAffiche(p, false)}
                    </span>
                    {p.statut !== 'actif' && (
                      <span className="puce gris">{LIBELLE_STATUT_PATIENT[p.statut]}</span>
                    )}
                    {impaye && <span className="puce attente">Impayé</span>}
                  </span>
                  <span className="ligne-sous">
                    <span>{nb} séance{nb > 1 ? 's' : ''}</span>
                    {p.motif && <><span>·</span><span>{p.motif}</span></>}
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
