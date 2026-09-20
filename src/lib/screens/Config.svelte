<script lang="ts">
  import {
    INTERVALS,
    PRESETS,
    TRIADS,
    activePreset,
    isIntervalBucket,
    runLabel,
    semitones,
  } from '$domain/music'
  import type { Content, Direction, RunLength } from '$domain/types'
  import { app, bucket, go, patchConfig, pool, startDrill } from '../app.svelte'
  import { SETTINGS } from '../settings'
  import GhostButton from '../ui/GhostButton.svelte'
  import Grid from '../ui/Grid.svelte'
  import Label from '../ui/Label.svelte'
  import Note from '../ui/Note.svelte'
  import OptionButton from '../ui/OptionButton.svelte'
  import Rule from '../ui/Rule.svelte'

  const DIRECTIONS: { value: Direction; label: string }[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
    { value: 'both', label: 'Mixed' },
  ]

  const CONTENTS: { value: Content; label: string }[] = [
    { value: 'intervals', label: 'Intervals' },
    { value: 'triads', label: 'Triads' },
  ]

  const LENGTHS: RunLength[] = [10, 20, 30, 50, 100]

  const intervalsMode = $derived(isIntervalBucket(bucket()))
  const gridVisible = $derived(!intervalsMode || app.cfg.showGrid)
  const poolCount = $derived(pool().length)
  const canStart = $derived(poolCount >= 2)
  // A preset chip lights up while the selection is exactly that preset's set.
  const preset = $derived(activePreset(app.cfg.intervals))

  function toggleInterval(s: number) {
    const on = app.cfg.intervals.includes(s)
    patchConfig({
      intervals: on
        ? app.cfg.intervals.filter((x) => x !== s)
        : [...app.cfg.intervals, s].sort((a, b) => a - b),
    })
  }

  function toggleTriad(id: string) {
    const on = app.cfg.triads.includes(id)
    patchConfig({
      triads: on ? app.cfg.triads.filter((x) => x !== id) : [...app.cfg.triads, id],
    })
  }
</script>

<div>
  <GhostButton onclick={() => go('home')} style="margin-bottom:var(--space-2)">← Modes</GhostButton>
  <h1 style="font-size:34px;margin:0 0 var(--space-6)">
    {app.cfg.mode === 'melodic' ? 'Melodic' : 'Harmonic'}
  </h1>

  {#if app.cfg.mode === 'melodic'}
    <div style="margin-bottom:var(--space-6)">
      <Label style="margin-bottom:var(--space-2)">Direction</Label>
      <Grid columns={3}>
        {#each DIRECTIONS as d (d.value)}
          <OptionButton
            selected={app.cfg.direction === d.value}
            onclick={() => patchConfig({ direction: d.value })}
          >
            {d.label}
          </OptionButton>
        {/each}
      </Grid>
    </div>
  {/if}

  {#if app.cfg.mode === 'harmonic'}
    <div style="margin-bottom:var(--space-6)">
      <Label style="margin-bottom:var(--space-2)">Test on</Label>
      <Grid columns={2}>
        {#each CONTENTS as c (c.value)}
          <OptionButton
            selected={app.cfg.content === c.value}
            onclick={() => patchConfig({ content: c.value })}
          >
            {c.label}
          </OptionButton>
        {/each}
      </Grid>
    </div>
  {/if}

  <div style="margin-bottom:var(--space-6)">
    <Label style="margin-bottom:var(--space-2)">Run length</Label>
    <Grid columns={5}>
      {#each LENGTHS as n (n)}
        <OptionButton
          class="ae-opt-number"
          selected={app.cfg.length === n}
          onclick={() => patchConfig({ length: n })}
        >
          {n}
        </OptionButton>
      {/each}
    </Grid>
  </div>

  <div>
    <div class="ae-row" style="margin-bottom:var(--space-2)">
      <Label>{intervalsMode ? 'Intervals in play' : 'Triads in play'}</Label>
      <div class="ae-meta">{poolCount} in play</div>
    </div>

    {#if intervalsMode}
      <div>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
          {#each PRESETS as p (p.label)}
            <button
              type="button"
              class="ae-chip"
              aria-pressed={preset === p.label}
              onclick={() => patchConfig({ intervals: [...p.set] })}
            >
              {p.label}
            </button>
          {/each}
        </div>
        <GhostButton onclick={() => patchConfig({ showGrid: !app.cfg.showGrid })}>
          {app.cfg.showGrid ? 'Hide the full grid' : 'Choose intervals individually'}
        </GhostButton>
      </div>
    {/if}

    {#if gridVisible}
      <Grid columns={3}>
        {#if intervalsMode}
          {#each INTERVALS as i (i.short)}
            <OptionButton
              role="checkbox"
              class="ae-opt-tall"
              selected={app.cfg.intervals.includes(semitones(i))}
              onclick={() => toggleInterval(semitones(i))}
            >
              <div style="font-size:15px">{i.short}</div>
              <div class="ae-opt-sub">{i.long}</div>
            </OptionButton>
          {/each}
        {:else}
          {#each TRIADS as t (t.id)}
            <OptionButton
              role="checkbox"
              class="ae-opt-tall"
              selected={app.cfg.triads.includes(t.id)}
              onclick={() => toggleTriad(t.id)}
            >
              <div style="font-size:15px">{t.short}</div>
              <div class="ae-opt-sub">{t.long}</div>
            </OptionButton>
          {/each}
        {/if}
      </Grid>
    {/if}
  </div>

  <Rule />
  <button type="button" class="ae-cta" disabled={!canStart} onclick={startDrill}>
    Start · {app.cfg.length} questions
  </button>
  <Note style="margin-top:var(--space-2);line-height:1.5">
    {canStart
      ? runLabel(app.cfg) +
        (SETTINGS.weightByHistory
          ? '. Selection is weighted towards what you have been getting wrong.'
          : '. Selection is uniform across the pool.')
      : 'Select at least two items to drill.'}
  </Note>
</div>
