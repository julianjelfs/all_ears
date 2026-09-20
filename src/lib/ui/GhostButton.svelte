<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    onclick,
    children,
    style = '',
  }: { onclick: () => void; children: Snippet; style?: string } = $props()
</script>

<button type="button" class="ae-ghost" {style} {onclick}>{@render children()}</button>
