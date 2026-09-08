import { useMemo } from 'react'
import { useDonnees } from '../lib/store'
import {
  aujourdhui, ajouterMois, dateDeIso, jourDeIso, moisCourant, moisLibelle, MOIS_COURTS,
} from '../lib/dates'
import { da } from '../lib/format'
import { bilan, estDue, partPsy } from '../lib/argent'
import type { Seance } from '../lib/types'

/**
 * Créneaux ouvrables d'un mois "YYYY-MM". Pour le mois en cours, on s'arrête
 * au jour du jour : sinon un mois à peine commencé paraît toujours vide.
 */
function capaciteDuMois(
  mois: string, joursTravail: number[], nbCreneaux: number, jusquAu?: string,
): number {
  const [a, m] = mois.split('-').map(Number)
  const nbJours = new Date(a, m, 0).getDate()
  const dernier = jusquAu && jusquAu.startsWith(mois) ? Number(jusquAu.slice(8)) : nbJours
  let jours = 0
  for (let j = 1; j <= Math.min(nbJours, dernier); j++) {
    if (joursTravail.includes(new Date(a, m - 1, j).getDay())) jours++
  }
  return jours * nbCreneaux
}

export default function Stats() {
  const { seances, patients, reglages } = useDonnees()
  const mois = moisCourant()
  const today = aujourdhui()

  const duMois = seances.filter((s) => s.date.startsWith(mois))
  const duMoisEcoule = duMois.filter((s) => s.date <= today)
  const b = bilan(duMois)
  const capacite = capaciteDuMois(mois, reglages.joursTravail, reglages.creneaux.length, today)
  const remplissage = capacite > 0 ? Math.round((duMoisEcoule.length / capacite) * 100) : 0

  const passees = seances.filter((s) => s.date <= today && s.statut !== 'prevu')
  const tauxAbsence = passees.length > 0
    ? Math.round((passees.filter((s) => s.statut === 'absent').length / passees.length) * 100)
    : 0
  const tauxAnnulation = passees.length > 0
    ? Math.round(
        (passees.filter((s) => s.statut === 'annule_delai' || s.statut === 'annule_hors_delai').length
          / passees.length) * 100,
      )
    : 0

  // File active : patients vus au moins une fois dans les 3 derniers mois.
  const limite = ajouterMois(mois, -2) + '-01'
  const fileActive = new Set(
    seances.filter((s) => s.date >= limite && s.date <= today && s.statut === 'effectue')
      .map((s) => s.patientId),
  ).size

  const nouveauxCeMois = patients.filter((p) => p.creeLe.slice(0, 7) === mois).length

  const effectuees = seances.filter((s) => s.statut === 'effectue')
  const parPatient = patients.length > 0
    ? (effectuees.length / new Set(effectuees.map((s) => s.patientId)).size)
    : 0

  const revenuMoyen = b.nbDues > 0 ? Math.round(b.partPsy / b.nbDues) : 0

  const derniersMois = useMemo(() => {
    const out: Array<{ mois: string; part: number; nb: number }> = []
    for (let i = 5; i >= 0; i--) {
      const m = ajouterMois(mois, -i)
      const lot: Seance[] = seances.filter((s) => s.date.startsWith(m))
      out.push({
        mois: m,
        part: lot.reduce((t, s) => t + partPsy(s), 0),
        nb: lot.filter((s) => estDue(s.statut)).length,
      })
    }
    return out
  }, [seances, mois])

  const maxPart = Math.max(1, ...derniersMois.map((m) => m.part))

  if (seances.length === 0) {
    return (
      <div className="vide">
        <strong>Pas encore de chiffres</strong>
        Ils apparaîtront dès que vous aurez enregistré des séances.
      </div>
    )
  }

  return (
    <>
      <div className="section-titre">Six derniers mois — ma part</div>
      <div className="carte">
        <div className="barres">
          {derniersMois.map((m) => (
            <div className="barre-col" key={m.mois} title={`${moisLibelle(m.mois)} : ${da(m.part)}`}>
              <div
                className="barre"
                style={{
                  height: `${Math.max(3, (m.part / maxPart) * 100)}%`,
                  opacity: m.mois === mois ? 1 : .55,
                }}
              />
            </div>
          ))}
        </div>
        <div className="barre-libs">
          {derniersMois.map((m) => (
            <div className="barre-lib" key={m.mois}>
              {MOIS_COURTS[Number(m.mois.split('-')[1]) - 1]}
            </div>
          ))}
        </div>
        <div className="rang">
          <span className="rang-lib">Meilleur mois affiché</span>
          <span className="rang-val">{da(maxPart)}</span>
        </div>
      </div>

      <div className="section-titre">{moisLibelle(mois)}</div>
      <div className="chiffres">
        <div className="chiffre">
          <div className="val">{remplissage} %</div>
          <div className="lib">Agenda rempli ({duMoisEcoule.length} / {capacite})</div>
        </div>
        <div className="chiffre">
          <div className="val">{b.nbDues}</div>
          <div className="lib">Séances dues</div>
        </div>
        <div className="chiffre">
          <div className="val">{fileActive}</div>
          <div className="lib">Patients suivis (3 mois)</div>
        </div>
        <div className="chiffre">
          <div className="val">{nouveauxCeMois}</div>
          <div className="lib">Nouveaux dossiers</div>
        </div>
      </div>

      <div className="section-titre">Régularité</div>
      <div className="carte">
        <div className="rang">
          <span className="rang-lib">Absences non excusées</span>
          <span className="rang-val">{tauxAbsence} %</span>
        </div>
        <div className="rang">
          <span className="rang-lib">Annulations</span>
          <span className="rang-val">{tauxAnnulation} %</span>
        </div>
        <div className="rang">
          <span className="rang-lib">Séances par patient (moyenne)</span>
          <span className="rang-val">{parPatient.toFixed(1)}</span>
        </div>
        <div className="rang">
          <span className="rang-lib">Ma part par séance (moyenne)</span>
          <span className="rang-val">{da(revenuMoyen)}</span>
        </div>
      </div>

      <div className="section-titre">Répartition de la semaine type</div>
      <div className="carte">
        {reglages.joursTravail.map((j) => {
          const nb = seances.filter((s) => jourDeIso(s.date) === j && s.date.startsWith(mois)).length
          return (
            <div className="rang" key={j}>
              <span className="rang-lib" style={{ textTransform: 'capitalize' }}>
                {['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][j]}
              </span>
              <span className="rang-val">{nb} séance{nb > 1 ? 's' : ''}</span>
            </div>
          )
        })}
      </div>

      <p style={{ color: 'var(--doux)', fontSize: '.8rem', margin: '18px 2px 0' }}>
        Calculé sur {seances.length} séance{seances.length > 1 ? 's' : ''} enregistrée
        {seances.length > 1 ? 's' : ''}, depuis {dateDeIso(seances.reduce((min, s) => (s.date < min ? s.date : min), seances[0].date)).getFullYear()}.
      </p>
    </>
  )
}
