# All Ears

Relative pitch ear training on a sampled nylon-string guitar. Pick melodic or harmonic, configure a
run, answer a fixed number of questions with no feedback until the end, then read the breakdown.
Intervals you get wrong come up more often next time.

No backend. Everything lives in `localStorage`, and the guitar samples are cached by a service
worker, so a drill you have run once works with no network at all.

**Live: https://julianjelfs.github.io/all_ears/** — installable from the browser's "Add to home
screen" / install prompt.

## Running it

```sh
npm install
npm run dev        # dev server
npm run test       # vitest, pure logic only
npm run build      # static build into build/
npm run preview    # serve the build at /all_ears/
npm run typecheck  # svelte-check
npm run icons      # regenerate the PNG icons from the SVG mark
```

SvelteKit with Svelte 5 runes, prerendered to a static site by `adapter-static`. Node 22. The dev
server runs under the same `/all_ears/` base path as production.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: tests, build, then publish to GitHub Pages.
The Pages source must be set to **GitHub Actions** in the repository settings. The site is served
from a subpath, so `paths.base` in `svelte.config.js` and the manifest's `scope`/`start_url` all
carry `/all_ears` — changing the repo name means changing that constant (or setting `BASE_PATH`).

## How it is put together

```
src/
  domain/          pure logic — no Svelte, no browser. This is what the tests cover.
    music.ts         intervals, triads, presets, ranges, sample URLs, labels
    questions.ts     question generation and history weighting
    stats.ts         run breakdown, confusions, all-time rows, history chart, trend
    storage.ts       the single versioned localStorage key
  audio/
    engine.ts        AudioContext, sample preload and decode, scheduling, synth fallback
  lib/
    app.svelte.ts    the one $state store: screen, config, stats, the drill loop, persistence
    screens/         one component per screen
    ui/              the primitives the design leans on
  routes/            +layout (styles, no SSR) and +page (the screen switch)
```

Screens are values of one `screen` field in the store, not routes — there are no deep links and the
browser back button does not step between them. Promote them to real routes if that changes.

### Audio

One `AudioContext`, created on the Start tap rather than at page load, because iOS only unlocks
audio inside a user gesture. All 25 notes from E2 to E4 are fetched and decoded before the first
question, then memoised per instrument for the session and cached across sessions by the service
worker.

If a fetch or decode fails, that note falls back to a Karplus-Strong plucked string synthesised in
the browser and the drill carries on.

### Config

Every choice writes to `localStorage` as it is made. The preset chips are set-replacing, and a chip
is highlighted while the current selection matches its set exactly — pick intervals by hand and no
chip is lit.

**Sound** picks the instrument: nylon-string guitar or grand piano, both from the same soundfont.
It is timbre only — it does not affect question generation, and accuracy is banked in the same
buckets whichever one you drill on. Notes are cached per instrument, so the first run on a new
sound fetches its 25 samples and switching back afterwards is instant.

### Design

The visual spec is the Modernist design system in `src/styles/tokens.css`, copied verbatim from the
handoff. Zero border radius, everything flush left, 2px rules, accent used only for the primary
action, selected options, the progress fill, the big score and "needs work" bars. Archivo is
self-hosted through `@fontsource` so the app looks right offline.

### Keyboard

On a device with a keyboard, the drill takes `1`–`9`, `0`, `-` and `=` for the answer pad in grid
order, space or `r` to replay, and escape to cancel. The hint line under the pad is hidden on touch
devices.

## Invariants and tests

`INVARIANTS.md` lists what must stay true, each with the test that fails if it breaks.
`npm run test` runs them; they cover the domain layer only — audio scheduling and the React wiring
are not tested.

## Before this goes further

- **Sample licensing.** The notes are fetched at runtime from the MIDI.js MusyngKite soundfont
  (`gleitz.github.io`), both instruments. Fine for a personal build; verify the licence and
  self-host before putting it in front of anyone else.
- Adding another instrument is one row in `INSTRUMENTS` naming its soundfont directory.
- No seventh chords, no inversions, no compound intervals. The data structures take all three:
  sevenths are another row in the triad table with a four-note offset array and their own bucket;
  compound intervals extend the semitone list past 12 and need a wider root range.
- The session list is capped at the last 60, and what falls off the end is not aggregated anywhere.
- No audio output or volume handling beyond the default destination.

## Handoff

`design_handoff_all_ears/` holds the original brief, the HTML prototype and the design system. The
prototype is a visual and behavioural reference, not code to port; the app was rebuilt from it in
SvelteKit.
