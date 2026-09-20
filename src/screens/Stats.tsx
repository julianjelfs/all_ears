import { useState } from 'react'
import { bucketRows, bucketTotals, historyBars, pct, trend } from '../domain/stats'
import type { Bucket, Session, Stats as StatsShape } from '../domain/types'
import { AccuracyBar, GhostButton, Grid, Label, Note, OptionButton, Rule } from '../ui/primitives'

const BUCKETS: { value: Bucket; label: string }[] = [
  { value: 'melodic', label: 'Melodic' },
  { value: 'harmonic', label: 'Harm. dyads' },
  { value: 'triads', label: 'Triads' },
]

export function Stats({
  stats,
  sessions,
  bucket,
  weightByHistory,
  onBucket,
  onBack,
  onReset,
}: {
  stats: StatsShape
  sessions: Session[]
  bucket: Bucket
  weightByHistory: boolean
  onBucket: (b: Bucket) => void
  onBack: () => void
  onReset: () => void
}) {
  // Reset is irreversible, so the button asks once before it wipes anything.
  const [confirming, setConfirming] = useState(false)

  const rows = bucketRows(stats, bucket)
  const totals = bucketTotals(rows)
  const history = sessions.filter((s) => s.bucket === bucket)
  const bars = historyBars(history)
  const movement = trend(history)

  const switchBucket = (b: Bucket) => {
    setConfirming(false)
    onBucket(b)
  }

  return (
    <div>
      <GhostButton onClick={onBack} style={{ marginBottom: 'var(--space-2)' }}>
        ← Modes
      </GhostButton>
      <h1 style={{ fontSize: 34, margin: '0 0 var(--space-4)' }}>Progress</h1>

      <Grid columns={3}>
        {BUCKETS.map((b) => (
          <OptionButton
            key={b.value}
            selected={bucket === b.value}
            className="ae-opt-tall"
            onClick={() => switchBucket(b.value)}
          >
            {b.label}
          </OptionButton>
        ))}
      </Grid>

      <Rule />

      {bars.length > 1 && (
        <div>
          <div className="ae-row" style={{ marginBottom: 'var(--space-3)' }}>
            <Label>Accuracy by session</Label>
            <div className="ae-meta">{bars.length} sessions</div>
          </div>
          <div className="ae-chart">
            {bars.map((b, i) => (
              <div
                key={i}
                className="ae-chart-bar"
                title={b.title}
                style={{ height: b.height, background: b.color }}
              />
            ))}
          </div>
          <div className="ae-axis">
            <span>{new Date(history[0].at).toLocaleDateString()}</span>
            <span>{movement}</span>
            <span>{new Date(history[history.length - 1].at).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <div>
          <Rule />
          <div className="ae-row" style={{ marginBottom: 'var(--space-3)' }}>
            <Label>All-time · {totals.asked} questions</Label>
            <div className="ae-summary-pct">{pct(totals.correct, totals.asked)}</div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="ae-right">Asked</th>
                <th style={{ width: '38%' }}>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="ae-item">{r.label}</td>
                  <td className="ae-right">{r.asked}</td>
                  <td>
                    <AccuracyBar pct={r.pct} color={r.barColor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note style={{ marginTop: 'var(--space-3)', lineHeight: 1.5 }}>
            {weightByHistory
              ? 'Sorted weakest first. Drills draw more often from the rows at the top.'
              : 'Sorted weakest first.'}
          </Note>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--color-neutral-700)' }}>
          Nothing recorded in this mode yet.
        </div>
      )}

      <Rule />
      {confirming ? (
        <div className="ae-stack">
          <button
            type="button"
            className="ae-reset ae-reset-confirm"
            onClick={() => {
              setConfirming(false)
              onReset()
            }}
          >
            Yes — erase every statistic
          </button>
          <button type="button" className="ae-reset" onClick={() => setConfirming(false)}>
            Keep my statistics
          </button>
          <Note>This clears all three buckets, the session history and the last score.</Note>
        </div>
      ) : (
        <button type="button" className="ae-reset" onClick={() => setConfirming(true)}>
          Reset all statistics
        </button>
      )}
    </div>
  )
}
