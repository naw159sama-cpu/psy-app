import { useMemo } from 'react'
import { useDonnees } from '../lib/store'
import {
  aujourdhui, ajouterMois, jourDeIso, moisCourant, moisLibelle, MOIS_COURTS, JOURS,
} from '../lib/dates'
import { da, montantSeul, pourcent } from '../lib/format'
import { bilan, estDue, partPsy } from '../lib/argent'
import { useCompteur } from '../composants/Compteur'
import {
  IconeAbsence, IconeAgenda, IconePatients, IconePortefeuille, IconeStats,
} from '../composants/Icones'
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

  const limite = ajouterMois(mois, -2) + '-01'
  const fileActive = new Set(
    seances.filter((s) => s.date >= limite && s.date <= today && s.statut === 'effectue')
      .map((s) => s.patientId),
  ).size

  const nouveauxCeMois = patients.filter((p) => p.creeLe.slice(0, 7) === mois).length

  const effectuees = seances.filter((s) => s.statut === 'effectue')
  const parPatient = effectuees.length > 0
    ? effectuees.length / new Set(effectuees.map((s) => s.patientId)).size
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
  const partAnimee = useCompteur(b.partPsy)

  if (seances.length === 0) {
    return (
      <div className="vide">
        <span className="disque grand"><IconeStats taille={22} /></span>
        <strong>Pas encore de chiffres</strong>
        Ils apparaîtront dès que vous aurez enregistré des séances.
      </div>
    )
  }

  return (
    <>
      <section className="carte-hero">
        <span className="bulle bulle-1" />
        <span className="bulle bulle-2" />
        <div className="hero-interieur">
          <div className="hero-ligne">
            <span className="hero-badge"><IconePortefeuille /> Mois en cours</span>
            <span className="hero-note">{moisLibelle(mois)}</span>
          </div>
          <div className="hero-montant">
            <span className="nombre">{montantSeul(partAnimee)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="hero-legende">
            {b.nbDues} séance{b.nbDues > 1 ? 's' : ''} due{b.nbDues > 1 ? 's' : ''} ce mois-ci
          </p>
          <div className="hero-pied">
            <span className="clef">Agenda rempli</span>
            <span className="valeur">{pourcent(remplissage)} · {duMoisEcoule.length} / {capacite}</span>
          </div>
          <div className="hero-jauge">
            <span style={{ width: `${Math.min(100, remplissage)}%` }} />
          </div>
        </div>
      </section>

      <section>
        <div className="entete-section">
          <h3>Six derniers mois — ma part</h3>
          <span className="entete-note">Sommet : <strong>{da(maxPart)}</strong></span>
        </div>
        <div className="carte">
          <div className="barres">
            {derniersMois.map((m) => (
              <div className="barre-col" key={m.mois} title={`${moisLibelle(m.mois)} : ${da(m.part)}`}>
                <div
                  className={`barre${m.mois === mois ? ' actuelle' : ''}`}
                  style={{ height: `${Math.max(4, (m.part / maxPart) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="barre-libs">
            {derniersMois.map((m) => (
              <div className={`barre-lib${m.mois === mois ? ' actuelle' : ''}`} key={m.mois}>
                {MOIS_COURTS[Number(m.mois.split('-')[1]) - 1]}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="duo-cartes">
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconePatients taille={16} /></span>
            <span className="stat-libelle">Patients suivis</span>
          </div>
          <div className="stat-valeur"><span className="nombre">{fileActive}</span></div>
          <p className="stat-detail">Sur les trois derniers mois</p>
        </div>
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconeAgenda taille={16} /></span>
            <span className="stat-libelle">Nouveaux dossiers</span>
          </div>
          <div className="stat-valeur"><span className="nombre">{nouveauxCeMois}</span></div>
          <p className="stat-detail">Ouverts en {moisLibelle(mois)}</p>
        </div>
      </section>

      <section>
        <div className="entete-section"><h3>Régularité</h3></div>
        <div className="carte">
          <div className="rang">
            <span className="rang-lib"><IconeAbsence taille={16} /> Absences non excusées</span>
            <span className="rang-val">{pourcent(tauxAbsence)}</span>
          </div>
          <div className="rang">
            <span className="rang-lib doux">Annulations</span>
            <span className="rang-val">{pourcent(tauxAnnulation)}</span>
          </div>
          <div className="rang">
            <span className="rang-lib doux">Séances par patient (moyenne)</span>
            <span className="rang-val">{parPatient.toFixed(1)}</span>
          </div>
          <div className="rang">
            <span className="rang-lib doux">Ma part par séance (moyenne)</span>
            <span className="rang-val fort">{da(revenuMoyen)}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="entete-section"><h3>Semaine type</h3></div>
        <div className="carte">
          {reglages.joursTravail.map((j) => {
            const nb = seances.filter((s) => jourDeIso(s.date) === j && s.date.startsWith(mois)).length
            const max = Math.max(
              1,
              ...reglages.joursTravail.map((k) =>
                seances.filter((s) => jourDeIso(s.date) === k && s.date.startsWith(mois)).length),
            )
            return (
              <div className="rang" key={j}>
                <span className="rang-lib" style={{ textTransform: 'capitalize' }}>{JOURS[j]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    display: 'block',
                    width: 68, height: 6, borderRadius: 99,
                    background: 'rgba(168, 207, 203, .45)',
                    overflow: 'hidden',
                  }}>
                    <span style={{
                      display: 'block', height: '100%', borderRadius: 99,
                      width: `${(nb / max) * 100}%`,
                      background: 'var(--teal)',
                      transformOrigin: 'left',
                      animation: 'glisseBarre .7s var(--sortie) both .15s',
                    }} />
                  </span>
                  <span className="rang-val">{nb}</span>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <p style={{ color: 'var(--texte-doux)', fontSize: '.78rem', margin: '4px 4px 0' }}>
        Calculé sur {seances.length} séance{seances.length > 1 ? 's' : ''} enregistrée
        {seances.length > 1 ? 's' : ''}.
      </p>
    </>
  )
}
