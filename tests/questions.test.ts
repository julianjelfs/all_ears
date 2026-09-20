import { describe, expect, it } from 'vitest'
import { HIGH, INTERVALS, LOW, TRIADS, semitones } from '../src/domain/music'
import { makeQuestion, weight, weightedPick } from '../src/domain/questions'
import type { Bucket, Direction, PoolItem } from '../src/domain/types'

const intervals = [...INTERVALS]
const triads = [...TRIADS]

/** An rng that walks a fixed list, so a question's draw is exactly known. */
function seq(values: number[]) {
  let i = 0
  return () => values[i++ % values.length]
}

function generate(over: Partial<Parameters<typeof makeQuestion>[0]> = {}) {
  return makeQuestion({
    pool: intervals,
    bucket: 'melodic' as Bucket,
    direction: 'asc' as Direction,
    stats: {},
    weightByHistory: true,
    ...over,
  })
}

describe('question generation', () => {
  it('I1: keeps every note within MIDI 40-64, whatever the pool or direction', () => {
    const cases: { pool: PoolItem[]; bucket: Bucket; direction: Direction }[] = [
      { pool: intervals, bucket: 'melodic', direction: 'asc' },
      { pool: intervals, bucket: 'melodic', direction: 'desc' },
      { pool: intervals, bucket: 'melodic', direction: 'both' },
      { pool: intervals, bucket: 'harmonic', direction: 'asc' },
      { pool: triads, bucket: 'triads', direction: 'asc' },
    ]
    for (const c of cases) {
      for (let n = 0; n < 500; n++) {
        const q = generate(c)
        for (const note of q.notes) {
          expect(note).toBeGreaterThanOrEqual(LOW)
          expect(note).toBeLessThanOrEqual(HIGH)
        }
      }
    }
  })

  it('I2: spaces a melodic pair by the picked semitones, high note last ascending and first descending', () => {
    for (const item of intervals) {
      const s = semitones(item)
      const asc = makeQuestion({
        pool: [item],
        bucket: 'melodic',
        direction: 'asc',
        stats: {},
        weightByHistory: true,
        rng: seq([0, 0.5]),
      })
      expect(asc.notes[1] - asc.notes[0]).toBe(s)

      const desc = makeQuestion({
        pool: [item],
        bucket: 'melodic',
        direction: 'desc',
        stats: {},
        weightByHistory: true,
        rng: seq([0, 0.5]),
      })
      expect(desc.notes[0] - desc.notes[1]).toBe(s)
      expect(desc.notes).toEqual([asc.notes[1], asc.notes[0]])
    }
  })

  it('I3: sounds harmonic dyads in ascending order however direction is set', () => {
    for (const direction of ['asc', 'desc', 'both'] as Direction[]) {
      for (let n = 0; n < 200; n++) {
        const q = generate({ bucket: 'harmonic', direction })
        expect(q.notes[1]).toBeGreaterThan(q.notes[0])
      }
    }
  })

  it('I4: builds triads in root position from the triad offsets', () => {
    for (const triad of triads) {
      const q = makeQuestion({
        pool: [triad],
        bucket: 'triads',
        direction: 'asc',
        stats: {},
        weightByHistory: true,
        rng: seq([0, 0]),
      })
      const root = q.notes[0]
      expect(q.notes).toEqual(triad.offsets.map((o) => root + o))
      expect(q.key).toBe(triad.short)
    }
  })
})

describe('history weighting', () => {
  it('I5: weighs new items at 1.4, a perfect item at 1.0 and a 0% item at 3.6', () => {
    expect(weight(undefined)).toBe(1.4)
    expect(weight({ asked: 3, correct: 0 })).toBe(1.4)
    expect(weight({ asked: 4, correct: 4 })).toBeCloseTo(1, 10)
    expect(weight({ asked: 4, correct: 0 })).toBeCloseTo(3.6, 10)
    expect(weight({ asked: 10, correct: 5 })).toBeCloseTo(1 + 2.6 * Math.pow(0.5, 1.2), 10)
    // A worse record always outweighs a better one.
    expect(weight({ asked: 10, correct: 3 })).toBeGreaterThan(weight({ asked: 10, correct: 7 }))
  })

  it('I6: picks uniformly when history weighting is off', () => {
    const pool = intervals.slice(0, 4)
    const stats = { [pool[0].short]: { asked: 40, correct: 0 } }
    // A uniform pick indexes straight off the rng, ignoring the dreadful first item.
    expect(weightedPick(pool, stats, false, seq([0.9])).short).toBe(pool[3].short)
    expect(weightedPick(pool, stats, false, seq([0.0])).short).toBe(pool[0].short)

    // Weighted, the same roll lands differently because the weights are not equal.
    const counts = new Map<string, number>()
    for (let n = 0; n < 4000; n++) {
      const p = weightedPick(pool, stats, true)
      counts.set(p.short, (counts.get(p.short) ?? 0) + 1)
    }
    expect(counts.get(pool[0].short)!).toBeGreaterThan(counts.get(pool[1].short)!)
  })

  it('I7: only ever returns an item from the pool it was given', () => {
    const pool = intervals.slice(2, 5)
    const keys = pool.map((p) => p.short)
    for (let n = 0; n < 500; n++) {
      expect(keys).toContain(weightedPick(pool, {}, true).short)
      expect(keys).toContain(weightedPick(pool, {}, false).short)
    }
    // Even a roll that lands past the end of the cumulative sweep stays in the pool.
    expect(keys).toContain(weightedPick(pool, {}, true, seq([0.999999999])).short)
  })
})
