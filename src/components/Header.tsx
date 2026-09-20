export function Header({ onStats }: { onStats: () => void }) {
  return (
    <header className="ae-header">
      <div className="ae-mark" />
      <div className="ae-wordmark">All Ears</div>
      <button type="button" onClick={onStats} className="ae-ghost ae-ghost-inset">
        Stats
      </button>
    </header>
  )
}
