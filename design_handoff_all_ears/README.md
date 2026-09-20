# Handoff: All Ears — relative pitch ear trainer

## Overview

All Ears is an offline-capable ear training app for drilling relative pitch on guitar. The user picks a mode (melodic or harmonic), configures a run, answers a fixed number of questions with no feedback until the end, and then sees a scored breakdown. Per-item accuracy and per-session history persist locally and feed back into question selection: intervals the user gets wrong come up more often.

There is no backend. All state lives in `localStorage`. Audio is fetched once from a public soundfont and cached by a service worker.

## About the design files

The files in `design_files/` are **design references created in HTML** — a working prototype showing intended look and behaviour, not production code to copy directly. `All Ears.dc.html` is authored in a proprietary streaming-component format (a template plus a logic class); do not try to port that format.

The task is to **recreate this design in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns and libraries. If no environment exists yet, pick the most appropriate framework — a React + Vite PWA is a natural fit given the Web Audio and service-worker requirements.

The prototype's **logic** (audio scheduling, question generation, weighting, stats aggregation) is directly translatable and worth reading closely; its **markup and inline styles** are a visual spec.

## Fidelity

**High fidelity.** Colours, typography, spacing and interaction states are final and come from the bound Modernist design system (`design_files/_ds/modernist/styles.css`). Recreate pixel-accurately using the target codebase's own component library where one exists, mapping to the tokens listed under Design tokens.

---

## Design system rules (non-negotiable)

- **Zero border radius anywhere.** `--radius-*` is `0px` on purpose.
- **Everything flush left**, including labels inside full-width buttons. Never centre a button label or a heading.
- **Strong 2px rules** (`var(--color-divider)`) between major sections. Do not soften to hairlines.
- **Accent used sparingly** — the primary action, the progress fill, the big score figure, and "needs work" bars. Everything else is ink on ground.
- Accent-on-ground is ~3:1, so **never set paragraph-size text in `--color-accent`** — use `--color-accent-700`.
- Focus ring is always `2px solid var(--color-accent)` with `2px` offset. Never the browser default.
- Typeface is **Archivo** throughout: weight 800 for headings/labels, 400 for body.

---

## Screens / views

The app is a single-column layout, `max-width: 560px`, centred, `padding: 24px 16px 56px`. Designed phone-first (reference viewport 430×860) but the same layout scales up. Minimum touch target throughout is 44px.

### Persistent header

Fixed at the top of the flow, not scroll-fixed.

- Container: `display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:2px solid var(--color-divider)`.
- Accent square: `13×13px`, `background: var(--color-accent)`, no radius.
- Wordmark: `ALL EARS` — Archivo 800, `14px`, `letter-spacing: 0.16em`, uppercase, `margin-right:auto`.
- "Stats" button: ghost, Archivo 800, `11px`, `letter-spacing:0.12em`, uppercase, `color: var(--color-accent)`, `min-height:44px; padding:12px; margin-right:-12px` (negative margin keeps the label optically flush to the right edge).

---

### 1. Home — mode picker

**Purpose:** choose melodic or harmonic.

- Kicker: "Relative pitch drills" — `11px`, `letter-spacing:0.12em`, uppercase, `var(--color-neutral-700)`.
- H1: "Pick a mode" — Archivo 800, `40px`, `letter-spacing:-0.015em`, margin `8px 0 24px`.
- Two mode cards in a `flex-direction:column; gap:12px` stack. Each is a button:
  - `width:100%; text-align:left; border:2px solid var(--color-text); background:transparent; padding:16px`.
  - Hover: `background: var(--color-accent-100); border-color: var(--color-accent)`.
  - Title: Archivo 800, `27px`, `letter-spacing:-0.02em`. Copy: "Melodic" / "Harmonic".
  - Body: `13px`, `line-height:1.5`, `var(--color-neutral-700)`, `margin-top:6px`, `max-width:34ch`, `text-wrap:pretty`.
    - Melodic: "Two notes one after the other. Name the interval between them."
    - Harmonic: "Notes struck together — dyads, or triads to name by quality."
- If a previous drill exists: `<hr>` (2px), then a baseline-aligned row — left "Last drill · {label}" (`11px`, uppercase, `letter-spacing:0.12em`, neutral-700), right the score "14/20" (Archivo 800, `22px`).
- `<hr>`, then a footnote at `12px`, `line-height:1.6`, `var(--color-neutral-600)`: "Sampled nylon-string guitar, E2 to E4. Roots are randomised across the range, so the same interval never lands twice in the same place."

---

### 2. Config

**Purpose:** set up the run. Every choice persists to `localStorage` immediately.

- Back link "← Modes": ghost accent, Archivo 800, `11px`, `letter-spacing:0.12em`, uppercase, `min-height:44px; padding:12px 0; margin-bottom:8px`.
- H1: "Melodic" or "Harmonic" — Archivo 800, `34px`, `margin: 0 0 24px`.

Each option group follows the same pattern: a `11px` uppercase `letter-spacing:0.12em` neutral-700 label with `margin-bottom:8px`, then a CSS grid of `gap:8px`.

**Option button (used for direction, content, length, and the interval/triad grid):**
- Unselected: `border:2px solid var(--color-divider); background:transparent; color:var(--color-text)`.
- Selected: `border:2px solid var(--color-accent); background:var(--color-accent); color:#ffffff`.
- Archivo 800, `13px` (length buttons `14px`), `padding:13px 10px`, `text-align:left` (length buttons are centred — they are single numbers).

Groups, in order:

1. **Direction** (melodic only) — 3 columns: Ascending / Descending / Mixed. Default Ascending.
2. **Test on** (harmonic only) — 2 columns: Intervals / Triads. Default Intervals.
3. **Run length** — 5 columns: 10 / 20 / 30 / 50 / 100. Default 20.
4. **Pool** — header row: left label ("Intervals in play" / "Triads in play"), right "{n} in play" (`11px`, neutral-600), baseline aligned.
   - **Presets** (intervals only): a wrapping `flex` row of chips, `gap:8px`. Chip: `border:1px solid var(--color-divider)`, transparent, `min-height:44px; padding:10px 14px`, `11px`, `letter-spacing:0.06em`, uppercase. Hover: `border-color` and `color` go to `var(--color-accent)`. Presets are set-replacing, not additive:
     | Label | Semitones set |
     |---|---|
     | All | 1–12 |
     | Major | 2, 4, 9, 11 |
     | Minor | 1, 3, 8, 10 |
     | Perfect | 5, 7, 12 |
     | 3rds + 6ths | 3, 4, 8, 9 |
     | 4 · TT · 5 | 5, 6, 7 |
     | 2nds + 7ths | 1, 2, 10, 11 |
     | Clear | (empty) |
   - **Grid toggle** (intervals only): ghost accent button, label "Choose intervals individually" / "Hide the full grid", `min-height:44px; padding:12px 0`.
   - **Grid**: 3 columns, `gap:8px`. Always shown for triads; behind the toggle for intervals. Each cell has a short label (Archivo 800, `15px`) and a sub-label (`10px`, `opacity:.75`, `margin-top:2px`).
     - Intervals: m2 Minor 2nd · M2 Major 2nd · m3 Minor 3rd · M3 Major 3rd · P4 Perfect 4th · TT Tritone · P5 Perfect 5th · m6 Minor 6th · M6 Major 6th · m7 Minor 7th · M7 Major 7th · P8 Octave.
     - Triads: Major `1 3 5` · Minor `1 ♭3 5` · Dim `1 ♭3 ♭5` · Aug `1 3 ♯5` · Sus4 `1 4 5` · Sus2 `1 2 5`.
- `<hr>`, then the primary CTA: full width, `border:2px solid var(--color-accent)`, `background: var(--color-accent)`, `color:#ffffff`, Archivo 800, `16px`, `letter-spacing:0.05em`, uppercase, `padding:17px 16px`, **`text-align:left`**. Label: `Start · {n} questions`.
  - Disabled when fewer than 2 items are selected: `opacity: 0.45`, `disabled`.
- Hint under the CTA, `12px`, neutral-600: either "Select at least two items to drill." or "{run label}. Selection is weighted towards what you have been getting wrong."

---

### 3. Loading

Shown between Start and the first question while samples are fetched. Skipped entirely if all needed notes are already decoded in memory.

- Kicker "Loading guitar samples"; H1 is the percentage itself at `34px`.
- Progress bar: `height:4px; background: var(--color-neutral-300)` with an accent fill of the same height.
- Footnote `12px` neutral-600: "Fetched once, then cached for offline use."

---

### 4. Drill

**Purpose:** answer. **No correctness feedback is shown until the run ends** — this is a deliberate product decision, not an omission.

- Status row, baseline-aligned: left `{n} / {total}` (Archivo 800, `13px`, `letter-spacing:0.1em`); right `{x} of {y} right` (`11px`, uppercase, `letter-spacing:0.1em`, neutral-700). The running score is a tweakable flag.
- Progress bar, `margin-top:8px`: `height:4px`, neutral-300 track, accent fill at `((qIndex - 1) / total) * 100%`.
- Prompt panel: `border:2px solid var(--color-text); margin-top:24px; padding:16px; min-height:104px`, contents vertically centred.
  - Kicker (`11px`, uppercase, neutral-700): "Ascending" / "Descending" / "Melodic" / "Two notes together" / "Triad".
  - Row of a `12×12px` accent square and a title at Archivo 800, `29px`, `letter-spacing:-0.02em`, `gap:12px`.
  - Title reads "Listening" while audio is sounding, "Name it" otherwise. While playing, the square runs `et-blink 0.7s ease-in-out infinite` (`0%,100% { opacity:.25 } 50% { opacity:1 }`).
- Controls row, `grid-template-columns: 1fr auto; gap:8px; margin-top:12px`:
  - **Replay**: `border:2px solid var(--color-text)`, transparent, Archivo 800, `14px`, `letter-spacing:0.06em`, uppercase, `padding:14px 16px`, left-aligned. Label `Replay ⟳` and, after the first replay, `Replay ⟳ {count}` for the current question. Hover: accent border + `--color-accent-100`. Active: `--color-accent-600` border + `--color-accent-200`.
  - **Cancel**: `border:2px solid var(--color-divider)`, `12px`, uppercase, neutral-700, `padding:14px 16px`. Abandons the run outright — nothing scored, nothing written to storage — and returns to Config.
- `<hr>`, then the answer pad: 3-column grid, `gap:8px`. One cell per item in the active pool. Cell: `min-height:60px; padding:10px 8px`, column flex, left-aligned; short label Archivo 800 `17px`, long label `10px` neutral-600. Border `2px solid var(--color-divider)`; hover accent border + `--color-accent-100`; active `--color-accent-600` + `--color-accent-200`. **No selected/correct/incorrect styling** — the tap advances immediately.
- Footnote `12px` neutral-600, `margin-top:16px`: "No answer is revealed until the run is over."

---

### 5. Results

- Kicker: the run label. H1 "Drill complete", `34px`.
- Score block: `border-top` and `border-bottom` `2px solid var(--color-text)`, `padding:16px 0`, `display:flex; align-items:flex-end; gap:16px`.
  - Percentage: Archivo 800, `64px`, `line-height:.88`, `letter-spacing:-0.04em`, `var(--color-accent)`.
  - Beside it, baseline-adjusted by `padding-bottom:7px`: "{x} of {y} correct", `13px`, neutral-700.
- "Where the misses were" (only if any item scored below 100%): label, then up to three entries joined by ` · ` at Archivo 800 `20px`, e.g. "Minor 6th 40% · Tritone 50%".
- `<hr>`, then the per-item table (design-system `.table`): columns Item / Asked / Right / Accuracy. Item cell Archivo 800; Asked and Right right-aligned; Accuracy is an 8px neutral-300 track with an accent fill plus the percentage at `11px`, `min-width:30px`, right-aligned. **Sorted weakest first.**
- "Confusions this run" (only if any wrong answers): up to 5 rows of `{actual} heard as {said} ×{n}`, `13px`, `border-bottom:1px solid var(--color-divider)`, `padding-bottom:5px`. Actual in Archivo 800 ink; "heard as" in neutral-600; said in Archivo 800 `var(--color-accent-700)`; count pushed right at `11px` neutral-600. Sorted by frequency.
- `<hr>`, then actions stacked `gap:8px`: primary "Run it again" (accent fill, re-runs the identical config), secondary "Change setup" (`2px solid var(--color-text)`, transparent), and a ghost accent link "History and all-time stats →".

---

### 6. Stats

- Back link, H1 "Progress" (`34px`).
- Bucket tabs: 3-column grid of option buttons — Melodic / Harm. dyads / Triads. Selecting a tab only changes which slice is displayed.
- `<hr>`, then **Accuracy by session** (shown when the bucket has more than one session):
  - Header row: label left, "{n} sessions" right (`11px`, neutral-600).
  - Chart: `display:flex; align-items:flex-end; gap:3px; height:132px; border-bottom:2px solid var(--color-text)`. One bar per session, `flex:1; min-width:6px`, height `max(4px, round(rate * 128))px`. Bar colour is `var(--color-accent)` below 70% accuracy and `var(--color-neutral-800)` at or above. `title` attribute carries "{date} · {correct}/{asked}".
  - Axis row under the chart, `10px`, uppercase, `letter-spacing:0.08em`, neutral-600, `justify-content:space-between`: first session date, trend, last session date. Trend appears once there are 4+ sessions: mean accuracy of the newer half minus the older half, as "+7 pts" / "-3 pts" / "flat".
- `<hr>`, then **All-time**: header row with "All-time · {n} questions" left and the overall percentage right (Archivo 800, `22px`, accent). Table columns Item / Asked / Accuracy, sorted weakest first; bar colour follows the same 70% threshold as the chart.
- Footnote: "Sorted weakest first. Drills draw more often from the rows at the top."
- `<hr>`, then a low-emphasis "Reset all statistics" button: `border:2px solid var(--color-divider)`, `11px`, uppercase, neutral-700, `min-height:44px; padding:11px 16px`. Hover goes accent. Clears stats, sessions and last-run summary. *(Worth adding a confirmation step in production — the prototype does not have one.)*

---

## Interactions & behaviour

### Navigation flow

```
Home ──(mode)──> Config ──(Start)──> Loading ──> Drill ──(last answer)──> Results
  ^                 ^                              │                        │
  │                 └────────(Cancel)──────────────┘                        │
  └──(← Modes)── Stats <────────────────(stats link)───────────────────────┘
                                      Results ──(Run it again)──> Loading
```

Screens are mutually exclusive views of one `screen` state value, not routes. If you want deep links or a browser back button in production, promote them to real routes.

### Question lifecycle

1. `next()` generates a question, increments `qIndex`, resets `replays` to 0, and schedules playback **280ms** after render (gives the UI a frame to settle before audio starts).
2. `playing` is set true and cleared by a timer sized to the scheduled audio length, capped at 3.2s. It only drives the blinking square and the "Listening" label.
3. Any answer-pad tap appends `{ key, ok, said }` to the log and immediately either generates the next question or finishes the run. There is no interstitial.
4. Replay re-plays the same notes and increments the per-question counter. Unlimited.
5. Cancel clears the run state and returns to Config without writing anything.

### Audio

Reference implementation is Web Audio: one `AudioContext`, created lazily on the Start tap (required for iOS autoplay unlocking — do not create it on page load), `resume()`d whenever it is found suspended.

**Samples.** Individual note MP3s from the MIDI.js MusyngKite soundfont:

```
https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_guitar_nylon-mp3/{NOTE}{OCTAVE}.mp3
```

Note names use **flats**: `C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`. Octave is `floor(midi / 12) - 1`. MIDI 40 is `E2`.

Every note in the range is fetched and decoded before the drill starts (25 files for E2–E4), with a progress counter. Each decoded `AudioBuffer` is memoised for the session; the service worker caches the MP3s across sessions.

**Fallback.** If a fetch or decode fails, that note falls back to a Karplus-Strong plucked string synthesised into an `AudioBuffer`: fill the first `N = round(sampleRate / frequency)` samples with one-pole-lowpassed white noise (`prev = 0.55*prev + 0.45*noise`) ramped in over 24 samples, then run `y[i] = a * 0.5 * (y[i-N] + y[i-N+1])` with `a = 0.0008 ^ (N / (sampleRate * 3.2))`, and normalise to 0.9 peak. The drill continues without interruption. **Pick a licence-compatible sample source for production** — the soundfont URL above is a convenience for the prototype.

**Scheduling.** Each note is a `BufferSource` through a `GainNode`: ramp to volume over 8ms, hold to 55% of duration, then `exponentialRampToValueAtTime(0.0001)` at the end.

| | Note duration | Volume | Offset |
|---|---|---|---|
| Melodic | 1.8s | 0.75 | `i * gap`, gap default **640ms** |
| Harmonic | 2.6s | `0.62 - i * 0.03` | `i * 0.02s` (a 20ms strum, not a hard block) |

### Question generation

Pitch range is **MIDI 40–64 (E2–E4)**.

- **Intervals** (melodic, and harmonic-dyad): pick a low root uniformly from `LOW … HIGH - semitones`, giving `[lo, lo + s]`. For descending — or mixed with a 50% coin flip — reverse the array. Harmonic dyads are always played as a pair regardless of direction.
- **Triads**: pick a root uniformly from `LOW … HIGH - span` where span is the largest offset, then map the interval offsets. Root position only, no inversions.

Randomising the root every question is the point: the user must hear the relationship, not memorise absolute pitches.

### History weighting

Default on, exposed as a tweak. Instead of picking uniformly from the pool:

```js
weight(item) = stats[item].asked < 4
  ? 1.4
  : 1 + 2.6 * Math.pow(1 - accuracy, 1.2);
```

Then a standard cumulative-weight roll. Items with under 4 recorded attempts get a flat 1.4 so new items are sampled slightly above average until there is enough data. A perfect item weighs 1.0; a 0%-accuracy item weighs 3.6. When the flag is off, selection is uniform.

### Keyboard

Not implemented in the prototype. If the target is desktop, number/letter shortcuts for the answer pad and a spacebar replay are the obvious additions.

---

## State management

### Runtime state

| Key | Type | Notes |
|---|---|---|
| `screen` | `'home' \| 'config' \| 'loading' \| 'drill' \| 'results' \| 'stats'` | |
| `mode` | `'melodic' \| 'harmonic'` | persisted |
| `direction` | `'asc' \| 'desc' \| 'both'` | persisted, melodic only |
| `content` | `'intervals' \| 'triads'` | persisted, harmonic only |
| `length` | `10 \| 20 \| 30 \| 50 \| 100` | persisted |
| `intervals` | `number[]` of semitones 1–12 | persisted |
| `triads` | `string[]` of triad ids | persisted |
| `showGrid` | `boolean` | persisted; interval grid disclosure |
| `q` | `{ key, label, notes: number[] } \| null` | current question |
| `qIndex`, `total` | `number` | 1-based question counter |
| `log` | `{ key, ok, said }[]` | current run |
| `playing` | `boolean` | audio indicator only |
| `replays` | `number` | current question |
| `loaded`, `loadTotal` | `number` | sample preload progress |
| `stats` | `{ [bucket]: { [itemKey]: { asked, correct } } }` | persisted |
| `sessions` | `{ bucket, at, asked, correct, label }[]` | persisted, last 60 |
| `last` | `{ label, score } \| null` | persisted |
| `statBucket` | `'melodic' \| 'harmonic' \| 'triads'` | stats screen tab |

**Buckets** keep melodic and harmonic accuracy separate, since they are genuinely different skills: `melodic` (mode is melodic, any direction), `harmonic` (harmonic + intervals), `triads` (harmonic + triads).

### Persistence

One `localStorage` key, `eartrainer.v1` (rename on port if you like, but version the key — schema changes will happen):

```json
{
  "stats":    { "melodic": { "P5": { "asked": 40, "correct": 34 } } },
  "sessions": [ { "bucket": "melodic", "at": 1758300000000, "asked": 20, "correct": 17, "label": "Melodic, ascending" } ],
  "last":     { "label": "Melodic, ascending", "score": "17/20" },
  "cfg":      { "mode": "melodic", "direction": "asc", "content": "intervals", "length": 20, "intervals": [1,2,3], "triads": ["maj"], "showGrid": false }
}
```

Config writes on every change; stats, sessions and last write on run completion only. All reads and writes are wrapped in `try/catch` — private browsing modes throw.

### Tweakable props

Exposed in the prototype as design-time props; make them settings or constants as suits the codebase.

| Prop | Type | Default | Effect |
|---|---|---|---|
| `weightByHistory` | boolean | `true` | History-weighted question selection |
| `showRunningScore` | boolean | `true` | Running score in the drill status row |
| `noteGapMs` | number 300–1400 | `640` | Gap between melodic notes |

---

## Design tokens

From `design_files/_ds/modernist/styles.css` — the authoritative source. Take values from the variables, not the hexes below, wherever the target codebase can.

**Colour roles**

| Token | Value |
|---|---|
| `--color-bg` | `#f3f2f2` |
| `--color-surface` | `#eae9e9` |
| `--color-text` | `#201e1d` |
| `--color-accent` | `#ec3013` |
| `--color-divider` | `color-mix(in srgb, #201e1d 40%, transparent)` |

**Neutral ramp** — `100 #f8f4f4` · `200 #eae7e7` · `300 #d7d3d3` · `400 #bab6b6` · `500 #9b9797` · `600 #7d7979` · `700 #605d5d` · `800 #444141` · `900 #2d2b2b`

**Accent ramp** — `100 #fff2ef` through `900`; the app uses `100` (hover tint), `200` (pressed tint), `600` (pressed border), `700` (accent text at body size).

Used in this app: bg, text, accent, divider, neutral-300 (bar tracks), neutral-600 (footnotes, sub-labels), neutral-700 (labels), neutral-800 (passing bars), accent-100/200/600/700, and `#ffffff` for text on accent fills.

**Spacing** — `--space-1: 4px`, `-2: 8px`, `-3: 12px`, `-4: 16px`, `-6: 24px`, `-8: 32px`.

**Radius** — `--radius-sm/md/lg: 0px`. All of them. Do not round anything.

**Type** — Archivo (Google Fonts, weights 400/500/600/800) for both heading and body. Headings: weight 800, `line-height: 1.12`, `letter-spacing: -0.015em`. Body: weight 400, `15px`, `line-height: 1.55`.

Sizes in use: `64px` (result score) · `40px` (home H1) · `34px` (screen H1) · `29px` (drill prompt) · `27px` (mode card title) · `22px` (summary figures) · `20px` (weakest line) · `17px` (answer-pad short label) · `15px` (grid short label, body) · `14px` (Replay, length buttons) · `13px` (option buttons, body copy) · `12px` (footnotes, Cancel) · `11px` (kickers, chips, meta) · `10px` (sub-labels, chart axis).

**Shadows** — `--shadow-sm/md/lg` exist but the app uses none. Nothing floats.

**Minimum touch target** — 44px on every interactive element.

---

## Assets

- `icon.svg` — PWA icon, an abstract bar-chart mark in ink with one accent bar. Original to this project; replace with a real icon set (PNG 192/512 as well) before shipping.
- **Archivo** — Google Fonts, weights 400/500/600/800. Self-host for offline use.
- **Guitar samples** — MIDI.js MusyngKite `acoustic_guitar_nylon-mp3`, fetched per note at runtime. Verify licensing and consider self-hosting for production.
- No other images. Icons in the prototype are typographic (`⟳`, `←`, `→`); the design system specifies **Lucide** for real icons.

---

## PWA notes

- `manifest.json`: standalone, portrait, `background_color #f3f2f2`, `theme_color #ec3013`. Add raster icons.
- `sw.js`: cache-first for everything including the sampled notes, so a drill run once works fully offline. Cache name `allears-v1` — bump it on deploy.
- Registration is gated on `location.protocol === 'https:'`, so it stays dormant in local previews.
- The service worker and manifest are illustrative. Use the target framework's PWA tooling (`vite-plugin-pwa`, Workbox) rather than porting `sw.js` literally.

---

## Files

| Path | What it is |
|---|---|
| `design_files/All Ears.dc.html` | The full prototype — all six screens, audio engine, question generation, weighting, stats. Proprietary component format; read for logic and visual spec, do not port the format. |
| `design_files/_ds/modernist/styles.css` | Modernist design system tokens and component classes. The authoritative source for every colour, space and type value. |
| `design_files/manifest.json` | PWA manifest. |
| `design_files/sw.js` | Cache-first service worker. |
| `design_files/icon.svg` | App icon. |

---

## Suggested build order

1. Tokens and the shared primitives — option button, ghost link, section label, `<hr>`, bar-with-percentage. These five carry nearly the whole UI.
2. Config screen with persistence. Everything else depends on its state shape.
3. Audio engine standalone — preload, schedule, fallback — verified against a fixed note list before wiring to questions.
4. Drill loop.
5. Stats aggregation, then the Results and Stats screens.
6. PWA shell last.

## Known gaps

- No confirmation on "Reset all statistics".
- No keyboard shortcuts.
- No seventh chords, no inversions, no compound intervals. The data structures accommodate all three: seventh chords are another entry in the chord table with a 4-element offset array and their own bucket; compound intervals extend the semitone list past 12 and need the root range widened.
- `sessions` is capped at the last 60 with no aggregation of what falls off the end.
- No audio-output or volume handling beyond the default destination.
