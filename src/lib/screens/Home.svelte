<script lang="ts">
  import { RANGE_LABEL } from '$domain/music'
  import type { Mode } from '$domain/types'
  import { app, chooseMode } from '../app.svelte'
  import Label from '../ui/Label.svelte'
  import Note from '../ui/Note.svelte'
  import Rule from '../ui/Rule.svelte'

  const MODES: { mode: Mode; title: string; body: string }[] = [
    {
      mode: 'melodic',
      title: 'Melodic',
      body: 'Two notes one after the other. Name the interval between them.',
    },
    {
      mode: 'harmonic',
      title: 'Harmonic',
      body: 'Notes struck together — dyads, or triads to name by quality.',
    },
  ]
</script>

<div>
  <Label>Relative pitch drills</Label>
  <h1 style="font-size:40px;margin:var(--space-2) 0 var(--space-6)">Pick a mode</h1>

  <div style="display:flex;flex-direction:column;gap:var(--space-3)">
    {#each MODES as m (m.mode)}
      <button type="button" class="ae-card" onclick={() => chooseMode(m.mode)}>
        <div class="ae-card-title">{m.title}</div>
        <div class="ae-card-body">{m.body}</div>
      </button>
    {/each}
  </div>

  {#if app.last}
    <Rule />
    <div class="ae-row">
      <Label>Last drill · {app.last.label}</Label>
      <div style="font-family:var(--font-heading);font-weight:800;font-size:22px">
        {app.last.score}
      </div>
    </div>
  {/if}

  <Rule />
  <Note>
    Sampled nylon-string guitar, {RANGE_LABEL}. Roots are randomised across the range, so the same
    interval never lands twice in the same place.
  </Note>
</div>
