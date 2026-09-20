<script lang="ts">
  import type { Snippet } from 'svelte'

  let { columns, children }: { columns: number; children: Snippet } = $props()
</script>

<div class="ae-grid" style="grid-template-columns:repeat({columns},minmax(0,1fr))">
  {@render children()}
</div>
