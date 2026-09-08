interface Props { taille?: number }

/** Trait fin, extrémités arrondies : la ligne graphique du système « Cabinet Serein ». */
const base = (taille: number) => ({
  width: taille,
  height: taille,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

/* ---------- Navigation ---------- */

export function IconeJour({ taille = 22 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M3.6 10.6 12 4l8.4 6.6" />
      <path d="M5.6 9.4V19a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1V9.4" />
      <path d="M9.7 20v-5.4h4.6V20" />
    </svg>
  )
}

export function IconeAgenda({ taille = 22 }: Props) {
  return (
    <svg {...base(taille)}>
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3" />
      <path d="M3.6 9.6h16.8M8.2 3.2v3.6M15.8 3.2v3.6" />
    </svg>
  )
}

export function IconePatients({ taille = 22 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="10" cy="9.2" r="3.1" />
      <path d="M3.8 19.4c.6-3.1 3.1-4.9 6.2-4.9s5.6 1.8 6.2 4.9" />
      <path d="M16.2 6.6a2.9 2.9 0 0 1 0 5.5" />
      <path d="M17.6 14.9c1.7.6 2.9 2 3.2 4" />
    </svg>
  )
}

export function IconeArgent({ taille = 22 }: Props) {
  return (
    <svg {...base(taille)}>
      <rect x="2.8" y="6" width="18.4" height="12" rx="3" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.4 12h.01M17.6 12h.01" />
    </svg>
  )
}

export function IconeStats({ taille = 22 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M3.4 20.4h17.2" />
      <path d="M6.6 20.4v-6.2M11.4 20.4V7.6M16.2 20.4v-9" />
    </svg>
  )
}

/* ---------- Barre du haut ---------- */

export function IconeOeil({ taille = 20, barre = false }: Props & { barre?: boolean }) {
  return (
    <svg {...base(taille)}>
      <path d="M2.6 12S6.2 5.9 12 5.9 21.4 12 21.4 12 17.8 18.1 12 18.1 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.7" />
      {barre && <path d="M4.2 19.8 19.8 4.2" />}
    </svg>
  )
}

export function IconeCloche({ taille = 20 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M17.4 10.6a5.4 5.4 0 1 0-10.8 0c0 4.3-1.6 5.6-1.6 5.6h14s-1.6-1.3-1.6-5.6Z" />
      <path d="M10.4 19.2a1.9 1.9 0 0 0 3.2 0" />
    </svg>
  )
}

export function IconeReglages({ taille = 20 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="12" cy="12" r="2.9" />
      <path d="M12 2.9v2.3M12 18.8v2.3M4.6 12H2.3M21.7 12h-2.3M6.8 6.8 5.2 5.2M18.8 18.8l-1.6-1.6M6.8 17.2l-1.6 1.6M18.8 5.2l-1.6 1.6" />
    </svg>
  )
}

/* ---------- Flèches et chevrons ---------- */

export function Chevron({ taille = 18 }: Props) {
  return (
    <svg {...base(taille)} className="chevron">
      <path d="m9.4 5.4 6.6 6.6-6.6 6.6" />
    </svg>
  )
}

export function FlecheGauche({ taille = 18 }: Props) {
  return <svg {...base(taille)}><path d="M14.6 5.4 8 12l6.6 6.6" /></svg>
}

export function FlecheDroite({ taille = 18 }: Props) {
  return <svg {...base(taille)}><path d="m9.4 5.4 6.6 6.6-6.6 6.6" /></svg>
}

export function IconeBas({ taille = 16 }: Props) {
  return <svg {...base(taille)}><path d="m6 9.5 6 6 6-6" /></svg>
}

export function IconeExterne({ taille = 14 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M8 16 16 8M9.4 8H16v6.6" />
    </svg>
  )
}

export function IconeRetour({ taille = 20 }: Props) {
  return <svg {...base(taille)}><path d="M19.4 12H5M11 5.6 4.6 12 11 18.4" /></svg>
}

export function IconePlus({ taille = 20 }: Props) {
  return <svg {...base(taille)}><path d="M12 5.2v13.6M5.2 12h13.6" /></svg>
}

/* ---------- Symboles métier ---------- */

export function IconeCheck({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.4 12.2 2.5 2.5 4.7-4.9" />
    </svg>
  )
}

export function IconePortefeuille({ taille = 14 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M3.4 8.2a2 2 0 0 1 2-2h11.2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z" />
      <path d="M3.4 9.6h14.6a2.6 2.6 0 0 1 0 5.2H16" />
    </svg>
  )
}

export function IconeVerifie({ taille = 14 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="m12 3.2 2.2 1.9 2.9-.3 1 2.8 2.5 1.5-1.1 2.7 1.1 2.7-2.5 1.5-1 2.8-2.9-.3L12 20.8l-2.2-1.9-2.9.3-1-2.8-2.5-1.5L4.5 12 3.4 9.3l2.5-1.5 1-2.8 2.9.3Z" />
      <path d="m9.4 12.1 1.9 1.9 3.4-3.6" />
    </svg>
  )
}

export function IconeRecu({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M5.4 3.6h13.2v16.8l-2.2-1.4-2.2 1.4-2.2-1.4-2.2 1.4-2.2-1.4-2.2 1.4Z" />
      <path d="M8.6 8.4h6.8M8.6 12.4h4.6" />
    </svg>
  )
}

export function IconeCabinet({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M4.2 20.4V6.2a1.6 1.6 0 0 1 1.6-1.6h8a1.6 1.6 0 0 1 1.6 1.6v14.2" />
      <path d="M15.4 10.4h2.8a1.6 1.6 0 0 1 1.6 1.6v8.4M2.8 20.4h18.4" />
      <path d="M7.6 8.4h1.2M11 8.4h1.2M7.6 12.2h1.2M11 12.2h1.2M9.4 20.4v-3.6" />
    </svg>
  )
}

export function IconeAbsence({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" />
      <path d="M3.6 9.8h16.8M8.2 3.4v3.4M15.8 3.4v3.4" />
      <path d="m10 13.6 4 4M14 13.6l-4 4" />
    </svg>
  )
}

export function IconeAttente({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.6V12l2.8 1.7" />
    </svg>
  )
}

export function IconeCadenas({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <rect x="4.8" y="10.4" width="14.4" height="9.6" rx="2.4" />
      <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" />
    </svg>
  )
}

export function IconeNote({ taille = 16 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M15.6 3.6H6.4a1.8 1.8 0 0 0-1.8 1.8v13.2a1.8 1.8 0 0 0 1.8 1.8h11.2a1.8 1.8 0 0 0 1.8-1.8V7.4Z" />
      <path d="M15.4 3.6v3.8h3.9M8.4 12.6h7.2M8.4 16.2h4.8" />
    </svg>
  )
}

export function IconeRecherche({ taille = 18 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4 4" />
    </svg>
  )
}
