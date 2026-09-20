<script lang="ts">
  let { pct, color = 'var(--color-accent)' }: { pct: string; color?: string } = $props()
</script>

<div class="ae-bar">
  <div class="ae-bar-track">
    <div style="height:8px;width:{pct};background:{color}"></div>
  </div>
  <span class="ae-bar-pct">{pct}</span>
</div>
