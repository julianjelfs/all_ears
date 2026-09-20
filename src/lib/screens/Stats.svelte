<script lang="ts">
  import { bucketRows, bucketTotals, historyBars, pct, trend } from '$domain/stats'
  import type { Bucket } from '$domain/types'
  import { app, go, resetStats } from '../app.svelte'
  import { SETTINGS } from '../settings'
  import AccuracyBar from '../ui/AccuracyBar.svelte'
  import GhostButton from '../ui/GhostButton.svelte'
  import Grid from '../ui/Grid.svelte'
  import Label from '../ui/Label.svelte'
  import Note from '../ui/Note.svelte'
  import OptionButton from '../ui/OptionButton.svelte'
  import Rule from '../ui/Rule.svelte'

  const BUCKETS: { value: Bucket; label: string }[] = [
    { value: 'melodic', label: 'Melodic' },
    { value: 'harmonic', label: 'Harm. dyads' },
    { value: 'triads', label: 'Triads' },
  ]

  // Reset is irreversible, so the button asks once before it wipes anything.
  let confirming = $state(false)

  const rows = $derived(bucketRows(app.stats, app.statBucket))
  const totals = $derived(bucketTotals(rows))
  const history = $derived(app.sessions.filter((s) => s.bucket === app.statBucket))
  const bars = $derived(historyBars(history))
  const movement = $derived(trend(history))

  function switchBucket(b: Bucket) {
    confirming = false
    app.statBucket = b
  }
</script>

<div>
  <GhostButton onclick={() => go('home')} style="margin-bottom:var(--space-2)">← Modes</GhostButton>
  <h1 style="font-size:34px;margin:0 0 var(--space-4)">Progress</h1>

  <Grid columns={3}>
    {#each BUCKETS as b (b.value)}
      <OptionButton
        class="ae-opt-tall"
        selected={app.statBucket === b.value}
        onclick={() => switchBucket(b.value)}
      >
        {b.label}
      </OptionButton>
    {/each}
  </Grid>

  <Rule />

  {#if bars.length > 1}
    <div>
      <div class="ae-row" style="margin-bottom:var(--space-3)">
        <Label>Accuracy by session</Label>
        <div class="ae-meta">{bars.length} sessions</div>
      </div>
      <div class="ae-chart">
        {#each bars as bar, i (i)}
          <div
            class="ae-chart-bar"
            title={bar.title}
            style="height:{bar.height}px;background:{bar.color}"
          ></div>
        {/each}
      </div>
      <div class="ae-axis">
        <span>{new Date(history[0].at).toLocaleDateString()}</span>
        <span>{movement}</span>
        <span>{new Date(history[history.length - 1].at).toLocaleDateString()}</span>
      </div>
    </div>
  {/if}

  {#if rows.length > 0}
    <div>
      <Rule />
      <div class="ae-row" style="margin-bottom:var(--space-3)">
        <Label>All-time · {totals.asked} questions</Label>
        <div class="ae-summary-pct">{pct(totals.correct, totals.asked)}</div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="ae-right">Asked</th>
            <th style="width:38%">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.key)}
            <tr>
              <td class="ae-item">{r.label}</td>
              <td class="ae-right">{r.asked}</td>
              <td><AccuracyBar pct={r.pct} color={r.barColor} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
      <Note style="margin-top:var(--space-3);line-height:1.5">
        {SETTINGS.weightByHistory
          ? 'Sorted weakest first. Drills draw more often from the rows at the top.'
          : 'Sorted weakest first.'}
      </Note>
    </div>
  {:else}
    <div style="font-size:14px;color:var(--color-neutral-700)">
      Nothing recorded in this mode yet.
    </div>
  {/if}

  <Rule />
  {#if confirming}
    <div class="ae-stack">
      <button
        type="button"
        class="ae-reset ae-reset-confirm"
        onclick={() => {
          confirming = false
          resetStats()
        }}
      >
        Yes — erase every statistic
      </button>
      <button type="button" class="ae-reset" onclick={() => (confirming = false)}>
        Keep my statistics
      </button>
      <Note>This clears all three buckets, the session history and the last score.</Note>
    </div>
  {:else}
    <button type="button" class="ae-reset" onclick={() => (confirming = true)}>
      Reset all statistics
    </button>
  {/if}
</div>
