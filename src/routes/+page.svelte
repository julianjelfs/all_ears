<script lang="ts">
  import Header from '$lib/components/Header.svelte'
  import Config from '$lib/screens/Config.svelte'
  import Drill from '$lib/screens/Drill.svelte'
  import Home from '$lib/screens/Home.svelte'
  import Loading from '$lib/screens/Loading.svelte'
  import Results from '$lib/screens/Results.svelte'
  import Stats from '$lib/screens/Stats.svelte'
  import { app, openStats } from '$lib/app.svelte'
</script>

<Header onstats={openStats} />
<main class="ae-main">
  {#if app.screen === 'home'}
    <Home />
  {:else if app.screen === 'config'}
    <Config />
  {:else if app.screen === 'loading'}
    <Loading />
  {:else if app.screen === 'drill'}
    <Drill />
  {:else if app.screen === 'results'}
    <Results />
  {:else if app.screen === 'stats'}
    <Stats />
  {/if}
</main>
