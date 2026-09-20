import { Label, Note, ProgressBar } from '../ui/primitives'

export function Loading({ pct }: { pct: string }) {
  return (
    <div style={{ paddingTop: 'var(--space-8)' }}>
      <Label>Loading guitar samples</Label>
      <h1 style={{ fontSize: 34, margin: 'var(--space-2) 0 var(--space-4)' }}>{pct}</h1>
      <ProgressBar pct={pct} />
      <Note style={{ marginTop: 'var(--space-3)' }}>Fetched once, then cached for offline use.</Note>
    </div>
  )
}
