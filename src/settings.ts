/** The prototype's design-time props, kept as constants. Change here to retune. */
export const SETTINGS = {
  /** Draw questions more often from items answered badly in the past. */
  weightByHistory: true,
  /** Show the running score in the drill status row. */
  showRunningScore: true,
  /** Gap between the two notes of a melodic interval, in ms (300–1400). */
  noteGapMs: 640,
  /** Delay between rendering a question and sounding it — lets the UI settle first. */
  playDelayMs: 280,
} as const
