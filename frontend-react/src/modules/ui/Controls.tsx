import { Button } from '@/components/ui/button'
import { PlusCircle, Save, FolderOpen, History } from 'lucide-react'

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
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-6 py-5">
      <Button
        onClick={onNew}
        className="btn-gradient gap-2 text-white shadow-lg glow-primary-hover"
      >
        <PlusCircle className="h-4 w-4" />
        New Game
      </Button>

      <Button
        variant="outline"
        onClick={onSave}
        disabled={!canSave}
        className="gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-700/50 hover:text-white disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        Save Game
      </Button>

      <Button
        variant="outline"
        onClick={onLoad}
        className="gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-700/50 hover:text-white"
      >
        <FolderOpen className="h-4 w-4" />
        Load Game
      </Button>

      <Button
        variant="outline"
        onClick={onToggleHistory}
        disabled={!canToggleHistory}
        className="gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-700/50 hover:text-white disabled:opacity-50"
      >
        <History className="h-4 w-4" />
        History
      </Button>
    </div>
  )
}
