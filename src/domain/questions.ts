import { HIGH, LOW, isIntervalBucket, semitones } from './music'
import type { Bucket, BucketStats, Direction, PoolItem, Question } from './types'

export type Rng = () => number

/**
 * How often an item comes up relative to the others. An item with fewer than four
 * recorded attempts sits slightly above average so new items get sampled; after that
 * weight rises with the miss rate — a perfect item weighs 1.0, a 0% item weighs 3.6.
 */
export function weight(stat: { asked: number; correct: number } | undefined): number {
  if (!stat || stat.asked < 4) return 1.4
  const accuracy = stat.correct / stat.asked
  return 1 + 2.6 * Math.pow(1 - accuracy, 1.2)
}

export function weightedPick(
  pool: PoolItem[],
  stats: BucketStats,
  weightByHistory: boolean,
  rng: Rng = Math.random,
): PoolItem {
  if (!weightByHistory) return pool[Math.floor(rng() * pool.length)]
  const weights = pool.map((p) => weight(stats[p.short]))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** True when this melodic question should sound high note first. */
export function descends(direction: Direction, rng: Rng = Math.random): boolean {
  if (direction === 'desc') return true
  return direction === 'both' && rng() < 0.5
}

export type QuestionOpts = {
  pool: PoolItem[]
  bucket: Bucket
  direction: Direction
  stats: BucketStats
  weightByHistory: boolean
  rng?: Rng
}

export function makeQuestion(opts: QuestionOpts): Question {
  const rng = opts.rng ?? Math.random
  const pick = weightedPick(opts.pool, opts.stats, opts.weightByHistory, rng)

  if (isIntervalBucket(opts.bucket)) {
    const s = semitones(pick)
    const lo = LOW + Math.floor(rng() * (HIGH - LOW - s + 1))
    // Harmonic dyads sound together, so direction never applies to them.
    const flip = opts.bucket === 'melodic' && descends(opts.direction, rng)
    const notes = flip ? [lo + s, lo] : [lo, lo + s]
    return { key: pick.short, label: pick.long, notes }
  }

  // Root position only: the root is drawn so the whole shape stays in range.
  const span = Math.max(...pick.offsets)
  const root = LOW + Math.floor(rng() * (HIGH - LOW - span + 1))
  return { key: pick.short, label: pick.long, notes: pick.offsets.map((o) => root + o) }
}
