import { describe, expect, it } from 'vitest'
import {
  INTERVALS,
  PRESETS,
  activePreset,
  SOUNDFONT_BASE,
  TRIADS,
  poolFor,
  promptKicker,
  runLabel,
  sampleUrl,
  semitones,
} from '../src/domain/music'
import { DEFAULT_CONFIG } from '../src/domain/storage'

describe('pool and presets', () => {
  it('I18: replaces the interval selection rather than adding to it', () => {
    const preset = (label: string) => PRESETS.find((p) => p.label === label)!

    expect(preset('Major').set).toEqual([2, 4, 9, 11])
    expect(preset('Clear').set).toEqual([])
    expect(preset('All').set).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

    // Applying a preset over a full selection leaves only the preset's members.
    const applied = [...preset('Perfect').set]
    expect(applied).toEqual([5, 7, 12])
    expect(applied).not.toContain(1)
  })

  it('I19: builds the pool from the selection that matches the active bucket', () => {
    const melodic = poolFor({ ...DEFAULT_CONFIG, intervals: [3, 7] })
    expect(melodic.map((p) => p.short)).toEqual(['m3', 'P5'])

    const dyads = poolFor({
      ...DEFAULT_CONFIG,
      mode: 'harmonic',
      content: 'intervals',
      intervals: [12],
    })
    expect(dyads.map((p) => p.short)).toEqual(['P8'])

    const triads = poolFor({
      ...DEFAULT_CONFIG,
      mode: 'harmonic',
      content: 'triads',
      triads: ['dim', 'maj'],
    })
    // Pool order follows the grid, not the order the user tapped them in.
    expect(triads.map((p) => p.short)).toEqual(['Major', 'Dim'])

    expect(poolFor({ ...DEFAULT_CONFIG, intervals: [] })).toEqual([])
    expect(INTERVALS.map(semitones)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(TRIADS.every((t) => t.offsets[0] === 0)).toBe(true)
  })

  it('I21: marks a preset as active exactly when the selection matches its set, in any order', () => {
    expect(activePreset([2, 4, 9, 11])).toBe('Major')
    expect(activePreset([11, 2, 9, 4])).toBe('Major')
    expect(activePreset([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe('All')
    expect(activePreset([])).toBe('Clear')

    // A selection that is nobody's preset lights nothing up.
    expect(activePreset([2, 4, 9])).toBeNull()
    expect(activePreset([2, 4, 9, 11, 1])).toBeNull()
    expect(activePreset([3, 7])).toBeNull()
  })

  it('I20: names sample files with flats and the right octave, with MIDI 40 as E2', () => {
    expect(sampleUrl(40)).toBe(SOUNDFONT_BASE + 'E2.mp3')
    expect(sampleUrl(64)).toBe(SOUNDFONT_BASE + 'E4.mp3')
    expect(sampleUrl(60)).toBe(SOUNDFONT_BASE + 'C4.mp3')
    expect(sampleUrl(61)).toBe(SOUNDFONT_BASE + 'Db4.mp3')
    expect(sampleUrl(58)).toBe(SOUNDFONT_BASE + 'Bb3.mp3')
  })
})

describe('run labels', () => {
  it('names the run and the prompt for each mode', () => {
    expect(runLabel({ mode: 'melodic', direction: 'asc', content: 'intervals' })).toBe(
      'Melodic, ascending',
    )
    expect(runLabel({ mode: 'melodic', direction: 'both', content: 'intervals' })).toBe(
      'Melodic, mixed',
    )
    expect(runLabel({ mode: 'harmonic', direction: 'asc', content: 'intervals' })).toBe(
      'Harmonic dyads',
    )
    expect(runLabel({ mode: 'harmonic', direction: 'asc', content: 'triads' })).toBe('Triad quality')

    expect(promptKicker({ mode: 'melodic', direction: 'desc', content: 'intervals' })).toBe(
      'Descending',
    )
    expect(promptKicker({ mode: 'melodic', direction: 'both', content: 'intervals' })).toBe(
      'Melodic',
    )
    expect(promptKicker({ mode: 'harmonic', direction: 'asc', content: 'intervals' })).toBe(
      'Two notes together',
    )
    expect(promptKicker({ mode: 'harmonic', direction: 'asc', content: 'triads' })).toBe('Triad')
  })
})
