import { INTERVALS, PRESETS, TRIADS, isIntervalBucket, runLabel, semitones } from '../domain/music'
import type { Bucket, Config as Cfg, Content, Direction, RunLength } from '../domain/types'
import { GhostButton, Grid, Label, Note, OptionButton, Rule } from '../ui/primitives'

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
  { value: 'both', label: 'Mixed' },
]

const CONTENTS: { value: Content; label: string }[] = [
  { value: 'intervals', label: 'Intervals' },
  { value: 'triads', label: 'Triads' },
]

const LENGTHS: RunLength[] = [10, 20, 30, 50, 100]

export function Config({
  cfg,
  bucket,
  poolCount,
  weightByHistory,
  onChange,
  onBack,
  onStart,
}: {
  cfg: Cfg
  bucket: Bucket
  poolCount: number
  weightByHistory: boolean
  onChange: (patch: Partial<Cfg>) => void
  onBack: () => void
  onStart: () => void
}) {
  const intervalsMode = isIntervalBucket(bucket)
  const gridVisible = !intervalsMode || cfg.showGrid
  const canStart = poolCount >= 2

  const toggleInterval = (s: number) => {
    const on = cfg.intervals.includes(s)
    onChange({
      intervals: on
        ? cfg.intervals.filter((x) => x !== s)
        : [...cfg.intervals, s].sort((a, b) => a - b),
    })
  }

  const toggleTriad = (id: string) => {
    const on = cfg.triads.includes(id)
    onChange({ triads: on ? cfg.triads.filter((x) => x !== id) : [...cfg.triads, id] })
  }

  return (
    <div>
      <GhostButton onClick={onBack} style={{ marginBottom: 'var(--space-2)' }}>
        ← Modes
      </GhostButton>
      <h1 style={{ fontSize: 34, margin: '0 0 var(--space-6)' }}>
        {cfg.mode === 'melodic' ? 'Melodic' : 'Harmonic'}
      </h1>

      {cfg.mode === 'melodic' && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Label style={{ marginBottom: 'var(--space-2)' }}>Direction</Label>
          <Grid columns={3}>
            {DIRECTIONS.map((d) => (
              <OptionButton
                key={d.value}
                selected={cfg.direction === d.value}
                onClick={() => onChange({ direction: d.value })}
              >
                {d.label}
              </OptionButton>
            ))}
          </Grid>
        </div>
      )}

      {cfg.mode === 'harmonic' && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Label style={{ marginBottom: 'var(--space-2)' }}>Test on</Label>
          <Grid columns={2}>
            {CONTENTS.map((c) => (
              <OptionButton
                key={c.value}
                selected={cfg.content === c.value}
                onClick={() => onChange({ content: c.value })}
              >
                {c.label}
              </OptionButton>
            ))}
          </Grid>
        </div>
      )}

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Label style={{ marginBottom: 'var(--space-2)' }}>Run length</Label>
        <Grid columns={5}>
          {LENGTHS.map((n) => (
            <OptionButton
              key={n}
              className="ae-opt-number"
              selected={cfg.length === n}
              onClick={() => onChange({ length: n })}
            >
              {n}
            </OptionButton>
          ))}
        </Grid>
      </div>

      <div>
        <div className="ae-row" style={{ marginBottom: 'var(--space-2)' }}>
          <Label>{intervalsMode ? 'Intervals in play' : 'Triads in play'}</Label>
          <div className="ae-meta">{poolCount} in play</div>
        </div>

        {intervalsMode && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="ae-chip"
                  onClick={() => onChange({ intervals: [...p.set] })}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <GhostButton onClick={() => onChange({ showGrid: !cfg.showGrid })}>
              {cfg.showGrid ? 'Hide the full grid' : 'Choose intervals individually'}
            </GhostButton>
          </div>
        )}

        {gridVisible && (
          <Grid columns={3}>
            {intervalsMode
              ? INTERVALS.map((i) => (
                  <OptionButton
                    key={i.short}
                    role="checkbox"
                    className="ae-opt-tall"
                    selected={cfg.intervals.includes(semitones(i))}
                    onClick={() => toggleInterval(semitones(i))}
                  >
                    <div style={{ fontSize: 15 }}>{i.short}</div>
                    <div className="ae-opt-sub">{i.long}</div>
                  </OptionButton>
                ))
              : TRIADS.map((t) => (
                  <OptionButton
                    key={t.id}
                    role="checkbox"
                    className="ae-opt-tall"
                    selected={cfg.triads.includes(t.id)}
                    onClick={() => toggleTriad(t.id)}
                  >
                    <div style={{ fontSize: 15 }}>{t.short}</div>
                    <div className="ae-opt-sub">{t.long}</div>
                  </OptionButton>
                ))}
          </Grid>
        )}
      </div>

      <Rule />
      <button type="button" className="ae-cta" disabled={!canStart} onClick={onStart}>
        Start · {cfg.length} questions
      </button>
      <Note style={{ marginTop: 'var(--space-2)', lineHeight: 1.5 }}>
        {canStart
          ? runLabel(cfg) +
            (weightByHistory
              ? '. Selection is weighted towards what you have been getting wrong.'
              : '. Selection is uniform across the pool.')
          : 'Select at least two items to drill.'}
      </Note>
    </div>
  )
}
