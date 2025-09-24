type Props = {
  onNew: () => void
  onSave: () => void
  onLoad: () => void
  onToggleHistory: () => void
  canSave: boolean
  canToggleHistory: boolean
}

export function Controls({ onNew, onSave, onLoad, onToggleHistory, canSave, canToggleHistory }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-slate-200 px-6 py-6">
      <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60" onClick={onNew}>
        New Game
      </button>
      <button className="rounded-lg border-2 border-slate-200 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60" onClick={onSave} disabled={!canSave}>
        Save Game
      </button>
      <button className="rounded-lg border-2 border-slate-200 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50" onClick={onLoad}>
        Load Game
      </button>
      <button className="rounded-lg border-2 border-slate-200 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60" onClick={onToggleHistory} disabled={!canToggleHistory}>
        History
      </button>
    </div>
  )
}


