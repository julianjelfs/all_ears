<script lang="ts">
  let { pct, style = '' }: { pct: string; style?: string } = $props()
</script>

<div class="ae-track" {style}>
  <div class="ae-fill" style="width:{pct}"></div>
</div>
