import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import { GameAPI } from '@/api/game'
import type { SavedGameSummary } from '@/types'

export function LoadDialog({ open, onOpenChange, onSelect, sessionId }: { open: boolean; onOpenChange: (v: boolean) => void; onSelect: (id: string) => void; sessionId?: string }) {
  const [saves, setSaves] = useState<SavedGameSummary[] | null>(null)

  useEffect(() => {
    if (!open) return
    setSaves(null)
    GameAPI.listSaves(sessionId)
      .then((res) => setSaves(res.success ? res.saved_games : []))
      .catch(() => setSaves([]))
  }, [open, sessionId])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-center text-xl font-semibold text-slate-800">Load Game</Dialog.Title>
          <div className="mt-5 max-h-[60vh] overflow-y-auto">
            {saves === null && <p className="py-6 text-center italic text-slate-500">Loading saved games...</p>}
            {saves?.length === 0 && <p className="py-6 text-center italic text-slate-500">No saved games found</p>}
            {saves?.map((s) => (
              <button
                key={s.id}
                className="mb-2 w-full rounded-lg border-2 border-slate-200 bg-white p-4 text-left transition hover:border-indigo-400 hover:bg-slate-50"
                onClick={() => onSelect(s.id)}
              >
                <div className="font-semibold text-slate-800">{s.save_name}</div>
                <div className="text-sm text-slate-500">{new Date(s.saved_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Dialog.Close asChild>
              <button className="rounded-lg border-2 border-slate-200 bg-white px-5 py-2.5 text-slate-900 shadow-sm">Cancel</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}


