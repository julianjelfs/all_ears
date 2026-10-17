<script lang="ts">
  let { onstats }: { onstats: () => void } = $props()
</script>

<header class="ae-header">
  <svg class="ae-mark" viewBox="0 0 24 24" aria-hidden="true">
    <!-- Two notes and the leap between them: the app's icon. -->
    <path d="M6.5 16.5 A11 11 0 0 1 17.5 5.5" fill="none" stroke="#2b2520" stroke-width="1.8" />
    <circle cx="6.5" cy="16.5" r="4.4" fill="#c93c25" />
    <circle cx="17.5" cy="7.5" r="4.4" fill="#2a6aa8" />
  </svg>
  <div class="ae-wordmark">All Ears</div>
  <button type="button" class="ae-ghost ae-ghost-inset" onclick={onstats}>Stats</button>
</header>
