<script lang="ts">
  let { onstats }: { onstats: () => void } = $props()
</script>

<header class="ae-header">
  <div class="ae-mark"></div>
  <div class="ae-wordmark">All Ears</div>
  <button type="button" class="ae-ghost ae-ghost-inset" onclick={onstats}>Stats</button>
</header>
