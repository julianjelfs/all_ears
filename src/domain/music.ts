import type { Bucket, Config, Content, Direction, Mode, PoolItem } from './types'

/** Playable range: E2 to E4. Roots are drawn across it so no interval lands twice in the same place. */
export const LOW = 40
export const HIGH = 64
export const RANGE_LABEL = 'E2 to E4'

/** The soundfont names notes with flats. */
export const SOUNDFONT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
export const SOUNDFONT_BASE =
  'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_guitar_nylon-mp3/'

export const INTERVALS: readonly PoolItem[] = [
  { short: 'm2', long: 'Minor 2nd', offsets: [0, 1] },
  { short: 'M2', long: 'Major 2nd', offsets: [0, 2] },
  { short: 'm3', long: 'Minor 3rd', offsets: [0, 3] },
  { short: 'M3', long: 'Major 3rd', offsets: [0, 4] },
  { short: 'P4', long: 'Perfect 4th', offsets: [0, 5] },
  { short: 'TT', long: 'Tritone', offsets: [0, 6] },
  { short: 'P5', long: 'Perfect 5th', offsets: [0, 7] },
  { short: 'm6', long: 'Minor 6th', offsets: [0, 8] },
  { short: 'M6', long: 'Major 6th', offsets: [0, 9] },
  { short: 'm7', long: 'Minor 7th', offsets: [0, 10] },
  { short: 'M7', long: 'Major 7th', offsets: [0, 11] },
  { short: 'P8', long: 'Octave', offsets: [0, 12] },
]

export const TRIADS: readonly (PoolItem & { id: string })[] = [
  { id: 'maj', short: 'Major', long: '1 3 5', offsets: [0, 4, 7] },
  { id: 'min', short: 'Minor', long: '1 ♭3 5', offsets: [0, 3, 7] },
  { id: 'dim', short: 'Dim', long: '1 ♭3 ♭5', offsets: [0, 3, 6] },
  { id: 'aug', short: 'Aug', long: '1 3 ♯5', offsets: [0, 4, 8] },
  { id: 'sus4', short: 'Sus4', long: '1 4 5', offsets: [0, 5, 7] },
  { id: 'sus2', short: 'Sus2', long: '1 2 5', offsets: [0, 2, 7] },
]

export type Preset = { label: string; set: number[] }

/** Presets replace the selection outright — they are not additive. */
export const PRESETS: readonly Preset[] = [
  { label: 'All', set: INTERVALS.map((i) => semitones(i)) },
  { label: 'Major', set: [2, 4, 9, 11] },
  { label: 'Minor', set: [1, 3, 8, 10] },
  { label: 'Perfect', set: [5, 7, 12] },
  { label: '3rds + 6ths', set: [3, 4, 8, 9] },
  { label: '4 · TT · 5', set: [5, 6, 7] },
  { label: '2nds + 7ths', set: [1, 2, 10, 11] },
  { label: 'Clear', set: [] },
]

export function semitones(item: PoolItem): number {
  return item.offsets[item.offsets.length - 1]
}

export function frequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function sampleUrl(midi: number): string {
  return SOUNDFONT_BASE + SOUNDFONT_NOTES[midi % 12] + (Math.floor(midi / 12) - 1) + '.mp3'
}

/** Melodic and harmonic are different skills, so their accuracy is banked separately. */
export function bucketFor(mode: Mode, content: Content): Bucket {
  if (mode === 'melodic') return 'melodic'
  return content === 'intervals' ? 'harmonic' : 'triads'
}

export function isIntervalBucket(bucket: Bucket): boolean {
  return bucket !== 'triads'
}

export function poolFor(cfg: Pick<Config, 'mode' | 'content' | 'intervals' | 'triads'>): PoolItem[] {
  const bucket = bucketFor(cfg.mode, cfg.content)
  if (isIntervalBucket(bucket)) {
    return INTERVALS.filter((i) => cfg.intervals.includes(semitones(i)))
  }
  return TRIADS.filter((t) => cfg.triads.includes(t.id))
}

export function runLabel(cfg: Pick<Config, 'mode' | 'direction' | 'content'>): string {
  if (cfg.mode === 'melodic') {
    const d: Record<Direction, string> = { asc: 'ascending', desc: 'descending', both: 'mixed' }
    return 'Melodic, ' + d[cfg.direction]
  }
  return cfg.content === 'intervals' ? 'Harmonic dyads' : 'Triad quality'
}

export function promptKicker(cfg: Pick<Config, 'mode' | 'direction' | 'content'>): string {
  if (cfg.mode === 'melodic') {
    if (cfg.direction === 'asc') return 'Ascending'
    if (cfg.direction === 'desc') return 'Descending'
    return 'Melodic'
  }
  return cfg.content === 'intervals' ? 'Two notes together' : 'Triad'
}

const LONG_BY_KEY = new Map<string, string>([
  ...INTERVALS.map((i) => [i.short, i.long] as const),
  // A triad's `long` is its formula, which reads as nonsense in a sentence; its name is the label.
  ...TRIADS.map((t) => [t.short, t.short] as const),
])

/** The name to use in running prose, e.g. "Minor 6th 40%". */
export function displayLabel(key: string): string {
  return LONG_BY_KEY.get(key) ?? key
}

function sameSet(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  const seen = new Set(a)
  return b.every((x) => seen.has(x))
}

/** The preset whose set the current selection matches exactly, if any. */
export function activePreset(intervals: readonly number[]): string | null {
  return PRESETS.find((p) => sameSet(p.set, intervals))?.label ?? null
}
