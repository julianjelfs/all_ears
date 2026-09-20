import { HIGH, LOW, frequency, sampleUrl } from '../domain/music'
import type { Instrument } from '../domain/types'

const MELODIC_DURATION = 1.8
const MELODIC_VOLUME = 0.75
const HARMONIC_DURATION = 2.6
const HARMONIC_VOLUME = 0.62
const HARMONIC_VOLUME_STEP = 0.03
/** A 20ms strum, not a hard block. */
const STRUM = 0.02
/** The "Listening" indicator never outstays this, however long the audio is. */
export const MAX_INDICATOR = 3.2

type Ctor = typeof AudioContext

export class AudioEngine {
  private ctx: AudioContext | null = null
  /** Keyed by instrument and note, so switching instrument does not replay the old timbre. */
  private buffers = new Map<string, AudioBuffer>()
  /** Set when any sample failed and the synthesised fallback stood in. */
  sampleFailed = false

  constructor(private fetchImpl: typeof fetch = fetch.bind(globalThis)) {}

  /**
   * Created lazily on the Start tap: iOS only unlocks audio inside a user gesture,
   * so a context made at page load stays suspended forever.
   */
  context(): AudioContext {
    if (!this.ctx) {
      const AC: Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: Ctor }).webkitAudioContext
      this.ctx = new AC()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private key(instrument: Instrument, midi: number): string {
    return instrument + ':' + midi
  }

  /** True when every note in range is already decoded for this instrument. */
  isPreloaded(instrument: Instrument): boolean {
    for (let m = LOW; m <= HIGH; m++) if (!this.buffers.has(this.key(instrument, m))) return false
    return true
  }

  async preload(
    instrument: Instrument,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<void> {
    const need: number[] = []
    for (let m = LOW; m <= HIGH; m++) if (!this.buffers.has(this.key(instrument, m))) need.push(m)
    if (!need.length) return
    let done = 0
    onProgress(0, need.length)
    await Promise.all(
      need.map((m) =>
        this.loadNote(instrument, m).then(() => {
          done++
          onProgress(done, need.length)
        }),
      ),
    )
  }

  private async loadNote(instrument: Instrument, midi: number): Promise<AudioBuffer> {
    const key = this.key(instrument, midi)
    const cached = this.buffers.get(key)
    if (cached) return cached
    const ctx = this.context()
    let buffer: AudioBuffer
    try {
      const res = await this.fetchImpl(sampleUrl(midi, instrument))
      if (!res.ok) throw new Error('http ' + res.status)
      const bytes = await res.arrayBuffer()
      buffer = await decode(ctx, bytes)
    } catch {
      this.sampleFailed = true
      // The fallback is a plucked string whichever instrument was asked for.
      buffer = this.synthBuffer(midi)
    }
    this.buffers.set(key, buffer)
    return buffer
  }

  /**
   * Karplus-Strong plucked string. Used only when a sample fetch or decode fails,
   * so a broken CDN degrades the tone rather than ending the drill.
   */
  synthBuffer(midi: number): AudioBuffer {
    const ctx = this.context()
    const sr = ctx.sampleRate
    const n = Math.max(2, Math.round(sr / frequency(midi)))
    const len = Math.ceil(sr * HARMONIC_DURATION)
    const buf = ctx.createBuffer(1, len, sr)
    const y = buf.getChannelData(0)

    let prev = 0
    for (let i = 0; i < n && i < len; i++) {
      prev = 0.55 * prev + 0.45 * (Math.random() * 2 - 1)
      y[i] = prev * Math.min(1, i / 24)
    }
    const a = Math.pow(0.0008, n / (sr * 3.2))
    for (let i = n; i < len; i++) {
      const j = i - n
      y[i] = a * 0.5 * (y[j] + y[j + 1 < len ? j + 1 : j])
    }
    let peak = 0
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]))
    if (peak) {
      const g = 0.9 / peak
      for (let i = 0; i < len; i++) y[i] *= g
    }
    return buf
  }

  private pluck(instrument: Instrument, midi: number, at: number, dur: number, vol: number): void {
    const ctx = this.context()
    const buf = this.buffers.get(this.key(instrument, midi))
    if (!buf) return
    const t = ctx.currentTime + at
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.008)
    g.gain.setValueAtTime(vol, t + dur * 0.55)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(g)
    g.connect(ctx.destination)
    src.start(t)
    src.stop(t + dur + 0.05)
  }

  /** Plays the question and returns how long the indicator should stay lit, in ms. */
  play(instrument: Instrument, notes: number[], sequential: boolean, gapMs: number): number {
    let end: number
    if (sequential) {
      const gap = gapMs / 1000
      notes.forEach((m, i) => this.pluck(instrument, m, i * gap, MELODIC_DURATION, MELODIC_VOLUME))
      end = (notes.length - 1) * gap + MELODIC_DURATION
    } else {
      notes.forEach((m, i) =>
        this.pluck(
          instrument,
          m,
          i * STRUM,
          HARMONIC_DURATION,
          HARMONIC_VOLUME - i * HARMONIC_VOLUME_STEP,
        ),
      )
      end = HARMONIC_DURATION
    }
    return Math.min(end, MAX_INDICATOR) * 1000
  }
}

function decode(ctx: AudioContext, bytes: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Safari only supports the callback form.
    const maybe = ctx.decodeAudioData(bytes, resolve, reject)
    if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject)
  })
}
