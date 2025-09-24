import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useRef } from 'react'

export function SaveDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: (name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])
  const defaultName = `Save ${new Date().toLocaleDateString()}`
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-center text-xl font-semibold text-slate-800">Save Game</Dialog.Title>
          <div className="mt-5">
            <label className="mb-2 block text-slate-700">Save Name:</label>
            <input
              ref={inputRef}
              type="text"
              maxLength={50}
              defaultValue={defaultName}
              className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-lg outline-none transition focus:border-indigo-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm(inputRef.current?.value.trim() || defaultName)
              }}
            />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-white shadow" onClick={() => onConfirm(inputRef.current?.value.trim() || defaultName)}>
              Save
            </button>
            <Dialog.Close asChild>
              <button className="rounded-lg border-2 border-slate-200 bg-white px-5 py-2.5 text-slate-900 shadow-sm">Cancel</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}


