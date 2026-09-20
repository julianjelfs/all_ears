<script lang="ts">
  import { instrumentOf } from '$domain/music'
  import { app } from '../app.svelte'
  import Label from '../ui/Label.svelte'
  import Note from '../ui/Note.svelte'
  import ProgressBar from '../ui/ProgressBar.svelte'

  const pct = $derived(
    app.loadTotal ? Math.round((app.loaded / app.loadTotal) * 100) + '%' : '0%',
  )
</script>

<div style="padding-top:var(--space-8)">
  <Label>Loading {instrumentOf(app.cfg.instrument).label.toLowerCase()} samples</Label>
  <h1 style="font-size:34px;margin:var(--space-2) 0 var(--space-4)">{pct}</h1>
  <ProgressBar {pct} />
  <Note style="margin-top:var(--space-3)">Fetched once, then cached for offline use.</Note>
</div>
