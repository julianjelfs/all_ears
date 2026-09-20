<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    style = '',
    class: klass = '',
  }: { children: Snippet; style?: string; class?: string } = $props()
</script>

<div class="ae-note {klass}" {style}>{@render children()}</div>
