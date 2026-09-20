<script lang="ts">
  import { confusions, correctCount, pct, runRows, weakestLabel } from '$domain/stats'
  import { app, go, label, openStats, startDrill } from '../app.svelte'
  import AccuracyBar from '../ui/AccuracyBar.svelte'
  import GhostButton from '../ui/GhostButton.svelte'
  import Label from '../ui/Label.svelte'
  import Rule from '../ui/Rule.svelte'

  const rows = $derived(runRows(app.log))
  const correct = $derived(correctCount(app.log))
  const weakest = $derived(weakestLabel(rows))
  const misses = $derived(confusions(app.log))
</script>

<div>
  <Label>{label()}</Label>
  <h1 style="font-size:34px;margin:var(--space-2) 0 var(--space-4)">Drill complete</h1>

  <div class="ae-score">
    <div class="ae-score-pct">{pct(correct, app.log.length)}</div>
    <div class="ae-score-count">{correct} of {app.log.length} correct</div>
  </div>

  {#if weakest}
    <div style="margin-top:var(--space-4)">
      <Label style="margin-bottom:var(--space-1)">Where the misses were</Label>
      <div class="ae-weakest">{weakest}</div>
    </div>
  {/if}

  <Rule />
  <table class="table">
    <thead>
      <tr>
        <th>Item</th>
        <th class="ae-right">Asked</th>
        <th class="ae-right">Right</th>
        <th style="width:32%">Accuracy</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.key)}
        <tr>
          <td class="ae-item">{r.label}</td>
          <td class="ae-right">{r.asked}</td>
          <td class="ae-right">{r.correct}</td>
          <td><AccuracyBar pct={r.pct} /></td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if misses.length > 0}
    <div>
      <Rule />
      <Label style="margin-bottom:var(--space-2)">Confusions this run</Label>
      <div style="display:flex;flex-direction:column;gap:var(--space-1)">
        {#each misses as c (c.actual + c.said)}
          <div class="ae-confusion">
            <span class="ae-confusion-actual">{c.actual}</span>
            <span style="color:var(--color-neutral-600)">heard as</span>
            <span class="ae-confusion-said">{c.said}</span>
            <span class="ae-confusion-n">×{c.n}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <Rule />
  <div class="ae-stack">
    <button type="button" class="ae-action" onclick={startDrill}>Run it again</button>
    <button type="button" class="ae-action ae-action-secondary" onclick={() => go('config')}>
      Change setup
    </button>
    <GhostButton onclick={openStats} style="font-size:12px;letter-spacing:0.1em">
      History and all-time stats →
    </GhostButton>
  </div>
</div>
