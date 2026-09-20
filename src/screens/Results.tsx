import { confusions, correctCount, pct, runRows, weakestLabel } from '../domain/stats'
import type { Answer } from '../domain/types'
import { AccuracyBar, GhostButton, Label, Rule } from '../ui/primitives'

export function Results({
  log,
  label,
  onRunAgain,
  onChangeSetup,
  onStats,
}: {
  log: Answer[]
  label: string
  onRunAgain: () => void
  onChangeSetup: () => void
  onStats: () => void
}) {
  const rows = runRows(log)
  const correct = correctCount(log)
  const weakest = weakestLabel(rows)
  const misses = confusions(log)

  return (
    <div>
      <Label>{label}</Label>
      <h1 style={{ fontSize: 34, margin: 'var(--space-2) 0 var(--space-4)' }}>Drill complete</h1>

      <div className="ae-score">
        <div className="ae-score-pct">{pct(correct, log.length)}</div>
        <div className="ae-score-count">
          {correct} of {log.length} correct
        </div>
      </div>

      {weakest && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Label style={{ marginBottom: 'var(--space-1)' }}>Where the misses were</Label>
          <div className="ae-weakest">{weakest}</div>
        </div>
      )}

      <Rule />
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="ae-right">Asked</th>
            <th className="ae-right">Right</th>
            <th style={{ width: '32%' }}>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="ae-item">{r.label}</td>
              <td className="ae-right">{r.asked}</td>
              <td className="ae-right">{r.correct}</td>
              <td>
                <AccuracyBar pct={r.pct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {misses.length > 0 && (
        <div>
          <Rule />
          <Label style={{ marginBottom: 'var(--space-2)' }}>Confusions this run</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {misses.map((c) => (
              <div key={c.actual + c.said} className="ae-confusion">
                <span className="ae-confusion-actual">{c.actual}</span>
                <span style={{ color: 'var(--color-neutral-600)' }}>heard as</span>
                <span className="ae-confusion-said">{c.said}</span>
                <span className="ae-confusion-n">×{c.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Rule />
      <div className="ae-stack">
        <button type="button" className="ae-action" onClick={onRunAgain}>
          Run it again
        </button>
        <button type="button" className="ae-action ae-action-secondary" onClick={onChangeSetup}>
          Change setup
        </button>
        <GhostButton onClick={onStats} style={{ fontSize: 12, letterSpacing: '0.1em' }}>
          History and all-time stats →
        </GhostButton>
      </div>
    </div>
  )
}
