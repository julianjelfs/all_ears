import { displayLabel } from './music'
import type { Answer, Bucket, BucketStats, ItemStat, Session, Stats } from './types'

/** Below this, a bar is drawn in accent — it is the "needs work" signal. */
export const PASS_THRESHOLD = 0.7
export const MAX_SESSIONS = 60
export const MAX_CONFUSIONS = 5
export const MAX_WEAKEST = 3

export function pct(correct: number, asked: number): string {
  return asked ? Math.round((correct / asked) * 100) + '%' : '0%'
}

export function barColor(rate: number): string {
  return rate < PASS_THRESHOLD ? 'var(--color-accent)' : 'var(--color-neutral-800)'
}

export type Row = {
  key: string
  label: string
  asked: number
  correct: number
  rate: number
  pct: string
}

/** Per-item rows for one run, weakest first. */
export function runRows(log: Answer[]): Row[] {
  const agg = new Map<string, ItemStat>()
  for (const a of log) {
    const e = agg.get(a.key) ?? { asked: 0, correct: 0 }
    e.asked++
    if (a.ok) e.correct++
    agg.set(a.key, e)
  }
  return [...agg.entries()]
    .map(([key, e]) => ({
      key,
      label: key,
      asked: e.asked,
      correct: e.correct,
      rate: e.correct / e.asked,
      pct: pct(e.correct, e.asked),
    }))
    .sort((a, b) => a.rate - b.rate)
}

/** "Minor 6th 40% · Tritone 50%" — only items that dropped a question. */
export function weakestLabel(rows: Row[]): string {
  return rows
    .filter((r) => r.rate < 1)
    .slice(0, MAX_WEAKEST)
    .map((r) => displayLabel(r.key) + ' ' + r.pct)
    .join(' · ')
}

export type Confusion = { actual: string; said: string; n: number }

export function confusions(log: Answer[]): Confusion[] {
  const counts = new Map<string, number>()
  for (const a of log) {
    if (a.ok) continue
    const k = a.key + '→' + a.said
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([k, n]) => ({ actual: k.split('→')[0], said: k.split('→')[1], n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, MAX_CONFUSIONS)
}

export function correctCount(log: Answer[]): number {
  return log.filter((a) => a.ok).length
}

/** Folds a finished run into the all-time stats, touching that run's bucket only. */
export function mergeStats(stats: Stats, bucket: Bucket, log: Answer[]): Stats {
  const next: Stats = { ...stats }
  const b: BucketStats = { ...(stats[bucket] ?? {}) }
  for (const a of log) {
    const e = b[a.key] ?? { asked: 0, correct: 0 }
    b[a.key] = { asked: e.asked + 1, correct: e.correct + (a.ok ? 1 : 0) }
  }
  next[bucket] = b
  return next
}

export function appendSession(sessions: Session[], session: Session): Session[] {
  return [...sessions, session].slice(-MAX_SESSIONS)
}

export type StatRow = Row & { barColor: string }

/** All-time rows for one bucket, weakest first. */
export function bucketRows(stats: Stats, bucket: Bucket): StatRow[] {
  const b = stats[bucket] ?? {}
  return Object.entries(b)
    .map(([key, e]) => {
      const rate = e.correct / e.asked
      return {
        key,
        label: key,
        asked: e.asked,
        correct: e.correct,
        rate,
        pct: pct(e.correct, e.asked),
        barColor: barColor(rate),
      }
    })
    .sort((a, b2) => a.rate - b2.rate)
}

export function bucketTotals(rows: StatRow[]): { asked: number; correct: number } {
  return rows.reduce(
    (t, r) => ({ asked: t.asked + r.asked, correct: t.correct + r.correct }),
    { asked: 0, correct: 0 },
  )
}

export const CHART_HEIGHT = 128
export const MIN_BAR = 4

export type HistoryBar = { height: number; color: string; title: string }

export function historyBars(sessions: Session[]): HistoryBar[] {
  return sessions.map((s) => {
    const rate = s.correct / s.asked
    return {
      height: Math.max(MIN_BAR, Math.round(rate * CHART_HEIGHT)),
      color: barColor(rate),
      title: new Date(s.at).toLocaleDateString() + ' · ' + s.correct + '/' + s.asked,
    }
  })
}

/** Mean accuracy of the newer half minus the older half. Needs four sessions to mean anything. */
export function trend(sessions: Session[]): string {
  if (sessions.length < 4) return ''
  const half = Math.floor(sessions.length / 2)
  const mean = (arr: Session[]) => arr.reduce((t, s) => t + s.correct / s.asked, 0) / arr.length
  const d = Math.round((mean(sessions.slice(half)) - mean(sessions.slice(0, half))) * 100)
  if (d === 0) return 'flat'
  return (d > 0 ? '+' + d : String(d)) + ' pts'
}
