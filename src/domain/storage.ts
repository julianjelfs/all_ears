import type { Config, LastRun, Persisted, Session, Stats } from './types'

/** Versioned: the schema will change, and a stale blob should be dropped, not half-read. */
export const STORAGE_KEY = 'eartrainer.v1'

export const DEFAULT_CONFIG: Config = {
  mode: 'melodic',
  direction: 'asc',
  content: 'intervals',
  length: 20,
  intervals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  triads: ['maj', 'min', 'dim', 'aug'],
  showGrid: false,
}

export type Store = Pick<Storage, 'getItem' | 'setItem'>

function storage(): Store | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Accessing localStorage itself throws when site data is blocked.
    return null
  }
}

export function load(store: Store | null = storage()): Persisted {
  const empty: Persisted = { stats: {}, sessions: [], last: null, cfg: DEFAULT_CONFIG }
  if (!store) return empty
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return empty
    const saved = JSON.parse(raw) as Partial<Persisted>
    return {
      stats: (saved.stats ?? {}) as Stats,
      sessions: (saved.sessions ?? []) as Session[],
      last: (saved.last ?? null) as LastRun | null,
      cfg: { ...DEFAULT_CONFIG, ...(saved.cfg ?? {}) },
    }
  } catch {
    return empty
  }
}

export function save(value: Persisted, store: Store | null = storage()): void {
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Private browsing throws on write. Losing the record beats losing the run.
  }
}
