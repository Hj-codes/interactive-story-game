import { useEffect, useState } from 'react'
import { GameAPI } from '@/api/game'
import type { SavedGameSummary } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderOpen, Loader2, FileX } from 'lucide-react'

export function LoadDialog({ open, onOpenChange, onSelect, sessionId }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (id: string) => void
  sessionId?: string
}) {
  const [saves, setSaves] = useState<SavedGameSummary[] | null>(null)

  useEffect(() => {
    if (!open) return
    setSaves(null)
    GameAPI.listSaves(sessionId)
      .then((res) => setSaves(res.success ? res.saved_games : []))
      .catch(() => setSaves([]))
  }, [open, sessionId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-gray-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[--fantasy-gold] uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Load Game
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="mt-4 max-h-[50vh]">
          {saves === null ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[--fantasy-gold]" />
              <p className="text-sm text-gray-500">Loading saves...</p>
            </div>
          ) : saves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FileX className="w-8 h-8 text-gray-600" />
              <p className="text-sm text-gray-500">No saved games found</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {saves.map((s) => (
                <button
                  key={s.id}
                  className="w-full p-3 text-left rounded-lg border border-gray-700 bg-black/30 hover:border-[--fantasy-gold] transition-colors"
                  onClick={() => onSelect(s.id)}
                >
                  <div className="font-serif text-white">{s.save_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(s.saved_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <button
          className="w-full mt-4 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </button>
      </DialogContent>
    </Dialog>
  )
}
