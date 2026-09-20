import { AudioEngine } from '$audio/engine'
import { bucketFor, poolFor, runLabel } from '$domain/music'
import { makeQuestion } from '$domain/questions'
import { appendSession, correctCount, mergeStats } from '$domain/stats'
import { load, save } from '$domain/storage'
import type {
  Answer,
  Bucket,
  Config,
  LastRun,
  Mode,
  PoolItem,
  Question,
  Screen,
  Session,
  Stats,
} from '$domain/types'
import { SETTINGS } from './settings'

const saved = load()

type AppState = {
  screen: Screen
  cfg: Config
  stats: Stats
  sessions: Session[]
  last: LastRun | null
  statBucket: Bucket
  q: Question | null
  qIndex: number
  total: number
  log: Answer[]
  replays: number
  playing: boolean
  loaded: number
  loadTotal: number
}

export const app: AppState = $state({
  screen: 'home',
  cfg: saved.cfg,
  stats: saved.stats,
  sessions: saved.sessions,
  last: saved.last,
  statBucket: 'melodic',
  q: null,
  qIndex: 0,
  total: 0,
  log: [],
  replays: 0,
  playing: false,
  loaded: 0,
  loadTotal: 0,
})

let engine: AudioEngine | null = null
let playTimer: ReturnType<typeof setTimeout> | undefined
let startTimer: ReturnType<typeof setTimeout> | undefined

function audio(): AudioEngine {
  if (!engine) engine = new AudioEngine()
  return engine
}

export function bucket(): Bucket {
  return bucketFor(app.cfg.mode, app.cfg.content)
}

export function pool(): PoolItem[] {
  return poolFor(app.cfg)
}

export function label(): string {
  return runLabel(app.cfg)
}

function persist(): void {
  save({ stats: app.stats, sessions: app.sessions, last: app.last, cfg: app.cfg })
}

/** Config persists the moment it changes; stats and sessions wait for a finished run. */
export function patchConfig(patch: Partial<Config>): void {
  app.cfg = { ...app.cfg, ...patch }
  persist()
}

export function go(screen: Screen): void {
  app.screen = screen
}

export function chooseMode(mode: Mode): void {
  patchConfig({ mode })
  app.screen = 'config'
}

export function openStats(): void {
  app.statBucket = bucket()
  app.screen = 'stats'
}

function sound(notes: number[]): void {
  const ms = audio().play(notes, app.cfg.mode === 'melodic', SETTINGS.noteGapMs)
  app.playing = true
  clearTimeout(playTimer)
  playTimer = setTimeout(() => (app.playing = false), ms)
}

function nextQuestion(log: Answer[], qIndex: number): void {
  const b = bucket()
  const q = makeQuestion({
    pool: pool(),
    bucket: b,
    direction: app.cfg.direction,
    stats: app.stats[b] ?? {},
    weightByHistory: SETTINGS.weightByHistory,
  })
  app.q = q
  app.qIndex = qIndex
  app.log = log
  app.replays = 0
  clearTimeout(startTimer)
  startTimer = setTimeout(() => sound(q.notes), SETTINGS.playDelayMs)
}

export async function startDrill(): Promise<void> {
  if (pool().length < 2) return
  const eng = audio()
  eng.context()

  app.q = null
  app.log = []
  app.qIndex = 0
  app.replays = 0
  app.total = app.cfg.length

  if (!eng.isPreloaded()) {
    app.loaded = 0
    app.loadTotal = 0
    app.screen = 'loading'
    await eng.preload((loaded, total) => {
      app.loaded = loaded
      app.loadTotal = total
    })
  }

  app.screen = 'drill'
  nextQuestion([], 1)
}

export function replay(): void {
  if (!app.q) return
  app.replays += 1
  sound(app.q.notes)
}

export function answer(key: string): void {
  const q = app.q
  if (!q) return
  const log = [...app.log, { key: q.key, ok: key === q.key, said: key }]

  if (app.qIndex < app.total) {
    nextQuestion(log, app.qIndex + 1)
    return
  }

  clearTimeout(playTimer)
  clearTimeout(startTimer)
  app.playing = false

  const b = bucket()
  const correct = correctCount(log)
  const runName = label()

  app.stats = mergeStats(app.stats, b, log)
  app.sessions = appendSession(app.sessions, {
    bucket: b,
    at: Date.now(),
    asked: log.length,
    correct,
    label: runName,
  })
  app.last = { label: runName, score: `${correct}/${log.length}` }
  app.statBucket = b
  app.log = log
  app.q = null
  app.screen = 'results'
  persist()
}

/** Abandons the run outright: nothing scored, nothing written. */
export function cancelDrill(): void {
  clearTimeout(playTimer)
  clearTimeout(startTimer)
  app.playing = false
  app.q = null
  app.log = []
  app.qIndex = 0
  app.total = 0
  app.replays = 0
  app.screen = 'config'
}

export function resetStats(): void {
  app.stats = {}
  app.sessions = []
  app.last = null
  persist()
}
