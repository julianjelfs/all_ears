import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, STORAGE_KEY, load, save } from '../src/domain/storage'
import type { Store } from '../src/domain/storage'
import type { Persisted } from '../src/domain/types'

function memoryStore(seed?: string): Store & { value: string | null } {
  return {
    value: seed ?? null,
    getItem(key) {
      return key === STORAGE_KEY ? this.value : null
    },
    setItem(key, value) {
      if (key === STORAGE_KEY) this.value = value
    },
  }
}

const throwingStore: Store = {
  getItem() {
    throw new DOMException('denied')
  },
  setItem() {
    throw new DOMException('quota')
  },
}

describe('persistence', () => {
  it('I15: round-trips config, stats, sessions and the last run', () => {
    const store = memoryStore()
    const value: Persisted = {
      stats: { melodic: { P5: { asked: 40, correct: 34 } } },
      sessions: [
        { bucket: 'melodic', at: 1758300000000, asked: 20, correct: 17, label: 'Melodic, ascending' },
      ],
      last: { label: 'Melodic, ascending', score: '17/20' },
      cfg: { ...DEFAULT_CONFIG, direction: 'both', length: 50, intervals: [3, 4, 8, 9] },
    }

    save(value, store)
    expect(load(store)).toEqual(value)
  })

  it('I16: falls back to defaults when storage throws or holds junk', () => {
    expect(load(throwingStore).cfg).toEqual(DEFAULT_CONFIG)
    expect(() => save({ stats: {}, sessions: [], last: null, cfg: DEFAULT_CONFIG }, throwingStore))
      .not.toThrow()

    expect(load(memoryStore('not json at all')).cfg).toEqual(DEFAULT_CONFIG)
    expect(load(memoryStore()).sessions).toEqual([])
    expect(load(null).last).toBeNull()
  })

  it('I17: fills a config written by an older build from the defaults', () => {
    const store = memoryStore(JSON.stringify({ cfg: { mode: 'harmonic', length: 100 } }))
    const loaded = load(store)

    expect(loaded.cfg.mode).toBe('harmonic')
    expect(loaded.cfg.length).toBe(100)
    expect(loaded.cfg.intervals).toEqual(DEFAULT_CONFIG.intervals)
    expect(loaded.cfg.triads).toEqual(DEFAULT_CONFIG.triads)
    expect(loaded.cfg.showGrid).toBe(DEFAULT_CONFIG.showGrid)
  })
})
