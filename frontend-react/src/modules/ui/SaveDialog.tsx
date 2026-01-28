import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Save } from 'lucide-react'

export function SaveDialog({ open, onOpenChange, onConfirm }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (name: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const defaultName = `Save ${new Date().toLocaleDateString()}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[--fantasy-gold] uppercase tracking-wider flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Game
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Save Name</label>
            <input
              ref={inputRef}
              type="text"
              maxLength={50}
              defaultValue={defaultName}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white
                         focus:border-[--fantasy-gold] focus:outline-none transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm(inputRef.current?.value.trim() || defaultName)
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              className="btn-fantasy btn-fantasy-gold flex-1 py-2.5"
              onClick={() => onConfirm(inputRef.current?.value.trim() || defaultName)}
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
