<script lang="ts">
  import type { Snippet } from 'svelte'
  import '@fontsource/archivo/400.css'
  import '@fontsource/archivo/600.css'
  import '@fontsource/archivo/800.css'
  import '../styles/tokens.css'
  import '../styles/app.css'

  let { children }: { children: Snippet } = $props()
</script>

{@render children()}
