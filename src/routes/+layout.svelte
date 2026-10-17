<script lang="ts">
  import type { Snippet } from 'svelte'
  import '@fontsource-variable/bricolage-grotesque'
  import '../styles/tokens.css'
  import '../styles/app.css'

  let { children }: { children: Snippet } = $props()
</script>

{@render children()}
