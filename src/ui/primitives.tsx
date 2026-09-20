import type { CSSProperties, ReactNode } from 'react'

export function Rule() {
  return <hr className="hr" />
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="ae-label" style={style}>
      {children}
    </div>
  )
}

export function Note({
  children,
  style,
  className = '',
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={`ae-note ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}

/** A label on the left and a figure on the right, sitting on one baseline. */
export function HeaderRow({
  label,
  children,
  style,
}: {
  label: ReactNode
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="ae-row" style={style}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function Grid({
  columns,
  children,
  style,
}: {
  columns: number
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      className="ae-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}
    >
      {children}
    </div>
  )
}

export function OptionButton({
  selected,
  onClick,
  className = '',
  children,
  role = 'radio',
}: {
  selected: boolean
  onClick: () => void
  className?: string
  children: ReactNode
  role?: 'radio' | 'checkbox'
}) {
  const pressed = role === 'radio' ? { 'aria-checked': selected } : { 'aria-pressed': selected }
  return (
    <button
      type="button"
      role={role}
      {...pressed}
      onClick={onClick}
      className={`ae-opt ${className}`.trim()}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  onClick,
  children,
  className = '',
  style,
}: {
  onClick: () => void
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <button type="button" onClick={onClick} className={`ae-ghost ${className}`.trim()} style={style}>
      {children}
    </button>
  )
}

/** The 4px progress rail used by loading and the drill. */
export function ProgressBar({ pct, style }: { pct: string; style?: CSSProperties }) {
  return (
    <div className="ae-track" style={style}>
      <div className="ae-fill" style={{ width: pct }} />
    </div>
  )
}

/** The 8px accuracy bar with its percentage, used in both tables. */
export function AccuracyBar({ pct, color }: { pct: string; color?: string }) {
  return (
    <div className="ae-bar">
      <div className="ae-bar-track">
        <div style={{ height: 8, width: pct, background: color ?? 'var(--color-accent)' }} />
      </div>
      <span className="ae-bar-pct">{pct}</span>
    </div>
  )
}
