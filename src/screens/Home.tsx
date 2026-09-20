import { RANGE_LABEL } from '../domain/music'
import type { LastRun, Mode } from '../domain/types'
import { Label, Note, Rule } from '../ui/primitives'

const MODES: { mode: Mode; title: string; body: string }[] = [
  {
    mode: 'melodic',
    title: 'Melodic',
    body: 'Two notes one after the other. Name the interval between them.',
  },
  {
    mode: 'harmonic',
    title: 'Harmonic',
    body: 'Notes struck together — dyads, or triads to name by quality.',
  },
]

export function Home({ last, onPick }: { last: LastRun | null; onPick: (mode: Mode) => void }) {
  return (
    <div>
      <Label>Relative pitch drills</Label>
      <h1 style={{ fontSize: 40, margin: 'var(--space-2) 0 var(--space-6)' }}>Pick a mode</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {MODES.map((m) => (
          <button key={m.mode} type="button" className="ae-card" onClick={() => onPick(m.mode)}>
            <div className="ae-card-title">{m.title}</div>
            <div className="ae-card-body">{m.body}</div>
          </button>
        ))}
      </div>

      {last && (
        <>
          <Rule />
          <div className="ae-row">
            <Label>Last drill · {last.label}</Label>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22 }}>
              {last.score}
            </div>
          </div>
        </>
      )}

      <Rule />
      <Note>
        Sampled nylon-string guitar, {RANGE_LABEL}. Roots are randomised across the range, so the
        same interval never lands twice in the same place.
      </Note>
    </div>
  )
}
