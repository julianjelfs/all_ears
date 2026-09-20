import { useEffect } from 'react'
import type { PoolItem } from '../domain/types'
import { Grid, Note, ProgressBar, Rule } from '../ui/primitives'

/** Hotkeys for the answer pad, in pool order. Twelve keys covers the largest pool. */
export const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=']

export function Drill({
  pool,
  kicker,
  playing,
  qIndex,
  total,
  correct,
  answered,
  replays,
  showRunningScore,
  onAnswer,
  onReplay,
  onCancel,
}: {
  pool: PoolItem[]
  kicker: string
  playing: boolean
  qIndex: number
  total: number
  correct: number
  answered: number
  replays: number
  showRunningScore: boolean
  onAnswer: (key: string) => void
  onReplay: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }
      if (e.key === ' ' || e.key.toLowerCase() === 'r') {
        e.preventDefault()
        onReplay()
        return
      }
      const i = ANSWER_KEYS.indexOf(e.key)
      if (i >= 0 && i < pool.length) {
        e.preventDefault()
        onAnswer(pool[i].short)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pool, onAnswer, onReplay, onCancel])

  const progress = total ? Math.round(((qIndex - 1) / total) * 100) + '%' : '0%'

  return (
    <div>
      <div className="ae-row">
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em' }}>
          {qIndex} / {total}
        </div>
        {showRunningScore && (
          <div
            className="ae-label"
            style={{ letterSpacing: '0.1em' }}
          >{`${correct} of ${answered} right`}</div>
        )}
      </div>
      <ProgressBar pct={progress} style={{ marginTop: 'var(--space-2)' }} />

      <div className="ae-prompt">
        <div className="ae-label">{kicker}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div className={`ae-pulse ${playing ? 'ae-pulse-on' : ''}`.trim()} />
          <div className="ae-prompt-title">{playing ? 'Listening' : 'Name it'}</div>
        </div>
      </div>

      <div className="ae-controls">
        <button type="button" className="ae-replay" onClick={onReplay}>
          Replay {replays ? `⟳ ${replays}` : '⟳'}
        </button>
        <button type="button" className="ae-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <Rule />
      <Grid columns={3}>
        {pool.map((p) => (
          <button key={p.short} type="button" className="ae-answer" onClick={() => onAnswer(p.short)}>
            <span className="ae-answer-short">{p.short}</span>
            <span className="ae-answer-long">{p.long}</span>
          </button>
        ))}
      </Grid>
      <Note style={{ marginTop: 'var(--space-4)' }}>No answer is revealed until the run is over.</Note>
      <Note className="ae-keys" style={{ marginTop: 'var(--space-1)' }}>
        Keys {ANSWER_KEYS.slice(0, pool.length).join(' ')} answer in grid order · space replays · esc
        cancels.
      </Note>
    </div>
  )
}
