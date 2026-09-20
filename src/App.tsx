import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AudioEngine } from './audio/engine'
import { Header } from './components/Header'
import { bucketFor, poolFor, promptKicker, runLabel } from './domain/music'
import { makeQuestion } from './domain/questions'
import { appendSession, correctCount, mergeStats } from './domain/stats'
import { DEFAULT_CONFIG, load, save } from './domain/storage'
import type {
  Answer,
  Bucket,
  Config as Cfg,
  LastRun,
  Mode,
  Question,
  Screen,
  Session,
  Stats as StatsShape,
} from './domain/types'
import { Config } from './screens/Config'
import { Drill } from './screens/Drill'
import { Home } from './screens/Home'
import { Loading } from './screens/Loading'
import { Results } from './screens/Results'
import { Stats } from './screens/Stats'
import { SETTINGS } from './settings'

type Run = {
  q: Question | null
  qIndex: number
  total: number
  log: Answer[]
  replays: number
}

const NO_RUN: Run = { q: null, qIndex: 0, total: 0, log: [], replays: 0 }

export function App() {
  const saved = useMemo(() => load(), [])

  const [screen, setScreen] = useState<Screen>('home')
  const [cfg, setCfg] = useState<Cfg>(saved.cfg ?? DEFAULT_CONFIG)
  const [stats, setStats] = useState<StatsShape>(saved.stats)
  const [sessions, setSessions] = useState<Session[]>(saved.sessions)
  const [last, setLast] = useState<LastRun | null>(saved.last)
  const [statBucket, setStatBucket] = useState<Bucket>('melodic')
  const [run, setRun] = useState<Run>(NO_RUN)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })

  const engine = useRef<AudioEngine | null>(null)
  const playTimer = useRef<number | undefined>(undefined)
  const startTimer = useRef<number | undefined>(undefined)

  const bucket = bucketFor(cfg.mode, cfg.content)
  const pool = useMemo(() => poolFor(cfg), [cfg])
  const sequential = cfg.mode === 'melodic'

  useEffect(() => {
    return () => {
      window.clearTimeout(playTimer.current)
      window.clearTimeout(startTimer.current)
    }
  }, [])

  const audio = () => {
    if (!engine.current) engine.current = new AudioEngine()
    return engine.current
  }

  /** Config persists the moment it changes; stats and sessions wait for a finished run. */
  const patchConfig = useCallback(
    (patch: Partial<Cfg>) => {
      const next = { ...cfg, ...patch }
      setCfg(next)
      save({ stats, sessions, last, cfg: next })
    },
    [cfg, stats, sessions, last],
  )

  const sound = useCallback(
    (notes: number[]) => {
      const ms = audio().play(notes, sequential, SETTINGS.noteGapMs)
      setPlaying(true)
      window.clearTimeout(playTimer.current)
      playTimer.current = window.setTimeout(() => setPlaying(false), ms)
    },
    [sequential],
  )

  const nextQuestion = useCallback(
    (log: Answer[], qIndex: number, total: number) => {
      const q = makeQuestion({
        pool,
        bucket,
        direction: cfg.direction,
        stats: stats[bucket] ?? {},
        weightByHistory: SETTINGS.weightByHistory,
      })
      setRun({ q, qIndex, total, log, replays: 0 })
      window.clearTimeout(startTimer.current)
      startTimer.current = window.setTimeout(() => sound(q.notes), SETTINGS.playDelayMs)
    },
    [pool, bucket, cfg.direction, stats, sound],
  )

  const startDrill = useCallback(async () => {
    if (pool.length < 2) return
    const eng = audio()
    eng.context()
    setRun({ ...NO_RUN, total: cfg.length })

    if (!eng.isPreloaded()) {
      setProgress({ loaded: 0, total: 0 })
      setScreen('loading')
      await eng.preload((loaded, total) => setProgress({ loaded, total }))
    }

    setScreen('drill')
    nextQuestion([], 1, cfg.length)
  }, [pool.length, cfg.length, nextQuestion])

  const answer = useCallback(
    (key: string) => {
      const q = run.q
      if (!q) return
      const log = [...run.log, { key: q.key, ok: key === q.key, said: key }]

      if (run.qIndex >= run.total) {
        window.clearTimeout(playTimer.current)
        window.clearTimeout(startTimer.current)
        setPlaying(false)

        const nextStats = mergeStats(stats, bucket, log)
        const correct = correctCount(log)
        const label = runLabel(cfg)
        const nextSessions = appendSession(sessions, {
          bucket,
          at: Date.now(),
          asked: log.length,
          correct,
          label,
        })
        const nextLast: LastRun = { label, score: `${correct}/${log.length}` }

        setStats(nextStats)
        setSessions(nextSessions)
        setLast(nextLast)
        setStatBucket(bucket)
        setRun({ ...NO_RUN, log })
        setScreen('results')
        save({ stats: nextStats, sessions: nextSessions, last: nextLast, cfg })
        return
      }

      nextQuestion(log, run.qIndex + 1, run.total)
    },
    [run, stats, sessions, bucket, cfg, nextQuestion],
  )

  const replay = useCallback(() => {
    if (!run.q) return
    setRun((r) => ({ ...r, replays: r.replays + 1 }))
    sound(run.q.notes)
  }, [run.q, sound])

  /** Abandons the run outright: nothing scored, nothing written. */
  const cancelDrill = useCallback(() => {
    window.clearTimeout(playTimer.current)
    window.clearTimeout(startTimer.current)
    setPlaying(false)
    setRun(NO_RUN)
    setScreen('config')
  }, [])

  const resetStats = useCallback(() => {
    setStats({})
    setSessions([])
    setLast(null)
    save({ stats: {}, sessions: [], last: null, cfg })
  }, [cfg])

  const openStats = useCallback(() => {
    setStatBucket(bucket)
    setScreen('stats')
  }, [bucket])

  const chooseMode = useCallback(
    (mode: Mode) => {
      patchConfig({ mode })
      setScreen('config')
    },
    [patchConfig],
  )

  const loadPct = progress.total ? Math.round((progress.loaded / progress.total) * 100) + '%' : '0%'

  return (
    <>
      <Header onStats={openStats} />
      <main className="ae-main">
        {screen === 'home' && <Home last={last} onPick={chooseMode} />}

        {screen === 'config' && (
          <Config
            cfg={cfg}
            bucket={bucket}
            poolCount={pool.length}
            weightByHistory={SETTINGS.weightByHistory}
            onChange={patchConfig}
            onBack={() => setScreen('home')}
            onStart={startDrill}
          />
        )}

        {screen === 'loading' && <Loading pct={loadPct} />}

        {screen === 'drill' && (
          <Drill
            pool={pool}
            kicker={promptKicker(cfg)}
            playing={playing}
            qIndex={run.qIndex}
            total={run.total}
            correct={correctCount(run.log)}
            answered={run.log.length}
            replays={run.replays}
            showRunningScore={SETTINGS.showRunningScore}
            onAnswer={answer}
            onReplay={replay}
            onCancel={cancelDrill}
          />
        )}

        {screen === 'results' && (
          <Results
            log={run.log}
            label={runLabel(cfg)}
            onRunAgain={startDrill}
            onChangeSetup={() => setScreen('config')}
            onStats={openStats}
          />
        )}

        {screen === 'stats' && (
          <Stats
            stats={stats}
            sessions={sessions}
            bucket={statBucket}
            weightByHistory={SETTINGS.weightByHistory}
            onBucket={setStatBucket}
            onBack={() => setScreen('home')}
            onReset={resetStats}
          />
        )}
      </main>
    </>
  )
}
