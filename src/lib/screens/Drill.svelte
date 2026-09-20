<script lang="ts">
  import { promptKicker } from '$domain/music'
  import { correctCount } from '$domain/stats'
  import { answer, app, cancelDrill, pool, replay } from '../app.svelte'
  import { SETTINGS } from '../settings'
  import Grid from '../ui/Grid.svelte'
  import Note from '../ui/Note.svelte'
  import ProgressBar from '../ui/ProgressBar.svelte'
  import Rule from '../ui/Rule.svelte'

  /** Hotkeys for the answer pad, in pool order. Twelve keys covers the largest pool. */
  export const ANSWER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=']

  const items = $derived(pool())
  const progress = $derived(
    app.total ? Math.round(((app.qIndex - 1) / app.total) * 100) + '%' : '0%',
  )
  const correct = $derived(correctCount(app.log))

  function onkeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelDrill()
      return
    }
    if (e.key === ' ' || e.key.toLowerCase() === 'r') {
      e.preventDefault()
      replay()
      return
    }
    const i = ANSWER_KEYS.indexOf(e.key)
    if (i >= 0 && i < items.length) {
      e.preventDefault()
      answer(items[i].short)
    }
  }
</script>

<svelte:window {onkeydown} />

<div>
  <div class="ae-row">
    <div
      style="font-family:var(--font-heading);font-weight:800;font-size:13px;letter-spacing:0.1em"
    >
      {app.qIndex} / {app.total}
    </div>
    {#if SETTINGS.showRunningScore}
      <div class="ae-label" style="letter-spacing:0.1em">
        {correct} of {app.log.length} right
      </div>
    {/if}
  </div>
  <ProgressBar pct={progress} style="margin-top:var(--space-2)" />

  <div class="ae-prompt">
    <div class="ae-label">{promptKicker(app.cfg)}</div>
    <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
      <div class="ae-pulse" class:ae-pulse-on={app.playing}></div>
      <div class="ae-prompt-title">{app.playing ? 'Listening' : 'Name it'}</div>
    </div>
  </div>

  <div class="ae-controls">
    <button type="button" class="ae-replay" onclick={replay}>
      Replay {app.replays ? `⟳ ${app.replays}` : '⟳'}
    </button>
    <button type="button" class="ae-cancel" onclick={cancelDrill}>Cancel</button>
  </div>

  <Rule />
  <Grid columns={3}>
    {#each items as item (item.short)}
      <button type="button" class="ae-answer" onclick={() => answer(item.short)}>
        <span class="ae-answer-short">{item.short}</span>
        <span class="ae-answer-long">{item.long}</span>
      </button>
    {/each}
  </Grid>
  <Note style="margin-top:var(--space-4)">No answer is revealed until the run is over.</Note>
  <Note class="ae-keys" style="margin-top:var(--space-1)">
    Keys {ANSWER_KEYS.slice(0, items.length).join(' ')} answer in grid order · space replays · esc cancels.
  </Note>
</div>
