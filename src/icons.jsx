// Small inline icons, so the UI doesn't depend on emoji fonts.

export function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M7 3.5v17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 4h10l-2.6 4.2L18 12.5H8z" fill="#e5484d" />
    </svg>
  )
}

export function MineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.4 2.4M16.3 16.3l2.4 2.4M5.3 18.7l2.4-2.4M16.3 7.7l2.4-2.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="6.2" fill="currentColor" />
      <circle cx="9.8" cy="9.8" r="1.7" fill="#fff" />
    </svg>
  )
}

export function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d="M3.5 8l4.6 4L12 5l3.9 7 4.6-4-1.9 10.5H5.4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function SquareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d="M4 20l1-4.5L15.5 5a2 2 0 012.8 0l.7.7a2 2 0 010 2.8L8.5 19z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EraseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M9 5h11v14H9l-6-7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9.5l5 5M17 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M12 2.5l6.5 9h-3l4 6h-15l4-6h-3z" fill="#2f9e44" stroke="#1f6f30" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="10.6" y="17.5" width="2.8" height="4" rx="0.6" fill="#8a5a2b" />
    </svg>
  )
}

export function TentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M12 4L2.5 20h19z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 11l-3.5 9h7z" fill="rgba(255,255,255,0.85)" />
    </svg>
  )
}

export function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M12 2.5a7 7 0 00-4 12.7V18h8v-2.8A7 7 0 0012 2.5z" fill="currentColor" />
      <rect x="8.5" y="19" width="7" height="2.5" rx="1.1" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function DotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  )
}

export function ChevronIcon({ left }) {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path
        d={left ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
