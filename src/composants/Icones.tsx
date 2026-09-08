interface Props { taille?: number }

const base = (taille: number) => ({
  width: taille,
  height: taille,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function IconeJour({ taille = 24 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

export function IconeAgenda({ taille = 24 }: Props) {
  return (
    <svg {...base(taille)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconePatients({ taille = 24 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="12" cy="8.5" r="3.7" />
      <path d="M4.8 20c.7-3.7 3.7-5.8 7.2-5.8s6.5 2.1 7.2 5.8" />
    </svg>
  )
}

export function IconeArgent({ taille = 24 }: Props) {
  return (
    <svg {...base(taille)}>
      <rect x="2.8" y="6" width="18.4" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

export function IconeStats({ taille = 24 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M4 20V11M10 20V5M16 20v-6M22 20H2" />
    </svg>
  )
}

export function IconeReglages({ taille = 24 }: Props) {
  return (
    <svg {...base(taille)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 12H2.1M21.9 12h-2.4M6.7 6.7 5 5M19 19l-1.7-1.7M6.7 17.3 5 19M19 5l-1.7 1.7" />
    </svg>
  )
}

export function IconeOeil({ taille = 22, barre = false }: Props & { barre?: boolean }) {
  return (
    <svg {...base(taille)}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {barre && <path d="M4 20 20 4" />}
    </svg>
  )
}

export function Chevron({ taille = 18 }: Props) {
  return (
    <svg {...base(taille)} className="chevron">
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function FlecheGauche({ taille = 19 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function FlecheDroite({ taille = 19 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function IconePlus({ taille = 19 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconeRetour({ taille = 20 }: Props) {
  return (
    <svg {...base(taille)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}
