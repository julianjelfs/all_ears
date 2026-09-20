export type Screen = 'home' | 'config' | 'loading' | 'drill' | 'results' | 'stats'
export type Mode = 'melodic' | 'harmonic'
export type Direction = 'asc' | 'desc' | 'both'
export type Content = 'intervals' | 'triads'
export type Instrument = 'guitar' | 'piano'
export type Bucket = 'melodic' | 'harmonic' | 'triads'
export type RunLength = 10 | 20 | 30 | 50 | 100

/** One drillable thing: an interval or a triad quality. `short` is the stats key. */
export type PoolItem = {
  short: string
  long: string
  /** Semitone offsets from the root. Intervals are [0, s]; triads carry their own shape. */
  offsets: number[]
}

export type Question = {
  key: string
  label: string
  notes: number[]
}

export type Answer = {
  key: string
  ok: boolean
  said: string
}

export type ItemStat = { asked: number; correct: number }
export type BucketStats = Record<string, ItemStat>
export type Stats = Partial<Record<Bucket, BucketStats>>

export type Session = {
  bucket: Bucket
  at: number
  asked: number
  correct: number
  label: string
}

export type LastRun = { label: string; score: string }

export type Config = {
  mode: Mode
  instrument: Instrument
  direction: Direction
  content: Content
  length: RunLength
  intervals: number[]
  triads: string[]
  showGrid: boolean
}

export type Persisted = {
  stats: Stats
  sessions: Session[]
  last: LastRun | null
  cfg: Config
}
