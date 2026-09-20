<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, style = '' }: { children: Snippet; style?: string } = $props()
</script>

<div class="ae-label" {style}>{@render children()}</div>
