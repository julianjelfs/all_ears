<script lang="ts">
  import type { Mode } from '$domain/types'

  // Melodic: two notes one after the other. Harmonic: notes stacked into a chord.
  let { mode, size = 40 }: { mode: Mode; size?: number } = $props()
</script>

<svg class="ae-glyph" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
  {#if mode === 'melodic'}
    <circle cx="6" cy="15.5" r="4.2" />
    <circle cx="18" cy="8.5" r="4.2" />
  {:else}
    <circle cx="12" cy="4.5" r="3.6" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="12" cy="19.5" r="3.6" />
  {/if}
</svg>
