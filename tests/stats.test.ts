import { describe, expect, it } from 'vitest'
import { bucketFor } from '../src/domain/music'
import {
  MAX_CONFUSIONS,
  MAX_SESSIONS,
  MAX_WEAKEST,
  appendSession,
  barColor,
  confusions,
  historyBars,
  mergeStats,
  runRows,
  trend,
  weakestLabel,
} from '../src/domain/stats'
import type { Answer, Session } from '../src/domain/types'

const answer = (key: string, said: string): Answer => ({ key, ok: key === said, said })

function session(over: Partial<Session> = {}): Session {
  return { bucket: 'melodic', at: 1758300000000, asked: 10, correct: 10, label: 'Melodic', ...over }
}

describe('buckets', () => {
  it('I8: banks melodic in any direction to melodic, and splits harmonic by content', () => {
    expect(bucketFor('melodic', 'intervals')).toBe('melodic')
    expect(bucketFor('melodic', 'triads')).toBe('melodic')
    expect(bucketFor('harmonic', 'intervals')).toBe('harmonic')
    expect(bucketFor('harmonic', 'triads')).toBe('triads')
  })
})

describe('banking a run', () => {
  it('I9: counts every answer as asked, right answers as correct, and leaves other buckets alone', () => {
    const before = { harmonic: { P5: { asked: 2, correct: 1 } } }
    const log = [answer('P5', 'P5'), answer('P5', 'm6'), answer('m3', 'm3')]

    const after = mergeStats(before, 'melodic', log)

    expect(after.melodic).toEqual({
      P5: { asked: 2, correct: 1 },
      m3: { asked: 1, correct: 1 },
    })
    expect(after.harmonic).toEqual(before.harmonic)
    expect(before.harmonic.P5).toEqual({ asked: 2, correct: 1 })
  })

  it('I10: keeps only the last 60 sessions', () => {
    let sessions: Session[] = []
    for (let i = 0; i < MAX_SESSIONS + 15; i++) {
      sessions = appendSession(sessions, session({ at: i }))
    }
    expect(sessions).toHaveLength(MAX_SESSIONS)
    expect(sessions[0].at).toBe(15)
    expect(sessions[sessions.length - 1].at).toBe(MAX_SESSIONS + 14)
  })
})

describe('run breakdown', () => {
  const log = [
    answer('P5', 'P5'),
    answer('P5', 'P5'),
    answer('m6', 'M6'),
    answer('m6', 'm6'),
    answer('TT', 'P4'),
    answer('M3', 'M3'),
  ]

  it('I11: sorts rows weakest first and names at most three imperfect items', () => {
    const rows = runRows(log)
    expect(rows.map((r) => r.key)).toEqual(['TT', 'm6', 'P5', 'M3'])
    expect(rows.map((r) => r.pct)).toEqual(['0%', '50%', '100%', '100%'])

    expect(weakestLabel(rows)).toBe('Tritone 0% · Minor 6th 50%')

    const allBad = runRows([
      answer('m2', 'M2'),
      answer('M2', 'm2'),
      answer('m3', 'M3'),
      answer('M3', 'm3'),
    ])
    expect(weakestLabel(allBad).split(' · ')).toHaveLength(MAX_WEAKEST)
    expect(weakestLabel(runRows([answer('P5', 'P5')]))).toBe('')
  })

  it('I12: counts wrong answers only, most frequent first, capped at five', () => {
    expect(confusions(log)).toEqual([
      { actual: 'm6', said: 'M6', n: 1 },
      { actual: 'TT', said: 'P4', n: 1 },
    ])

    const many = [
      answer('P5', 'P4'),
      answer('P5', 'P4'),
      answer('P5', 'P4'),
      answer('m2', 'M2'),
      answer('m3', 'M3'),
      answer('M3', 'm3'),
      answer('M6', 'm6'),
      answer('M7', 'm7'),
      answer('TT', 'P5'),
    ]
    const result = confusions(many)
    expect(result).toHaveLength(MAX_CONFUSIONS)
    expect(result[0]).toEqual({ actual: 'P5', said: 'P4', n: 3 })
    expect(confusions([answer('P5', 'P5')])).toEqual([])
  })
})

describe('history chart', () => {
  it('I13: shows a trend only from four sessions, as newer-half minus older-half points', () => {
    const rates = (values: number[]) => values.map((r) => session({ asked: 10, correct: r * 10 }))

    expect(trend(rates([0.5, 0.6, 0.9]))).toBe('')
    expect(trend(rates([0.5, 0.5, 0.6, 0.6]))).toBe('+10 pts')
    expect(trend(rates([0.8, 0.8, 0.5, 0.5]))).toBe('-30 pts')
    expect(trend(rates([0.7, 0.7, 0.7, 0.7]))).toBe('flat')
    // An odd count puts the extra session in the newer half.
    expect(trend(rates([0.4, 0.6, 0.8, 0.8, 0.8]))).toBe('+30 pts')
  })

  it('I14: draws below 70% in accent and the rest in neutral-800', () => {
    expect(barColor(0.69)).toBe('var(--color-accent)')
    expect(barColor(0.7)).toBe('var(--color-neutral-800)')
    expect(barColor(1)).toBe('var(--color-neutral-800)')

    const bars = historyBars([
      session({ asked: 10, correct: 0 }),
      session({ asked: 10, correct: 5 }),
      session({ asked: 10, correct: 10 }),
    ])
    expect(bars.map((b) => b.height)).toEqual([4, 64, 128])
    expect(bars.map((b) => b.color)).toEqual([
      'var(--color-accent)',
      'var(--color-accent)',
      'var(--color-neutral-800)',
    ])
    expect(bars[2].title).toContain('10/10')
  })
})
