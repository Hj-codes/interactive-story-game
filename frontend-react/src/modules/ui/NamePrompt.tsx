import { useRef } from 'react'

type Props = {
  disabled?: boolean
  onStart: (name: string) => void
}

export function NamePrompt({ disabled, onStart }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="px-6 py-8 text-center border-b border-slate-200">
      <label className="mb-4 block text-lg font-medium text-slate-800">Enter your character's name:</label>
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
        <input
          ref={inputRef}
          type="text"
          maxLength={20}
          placeholder="Enter name..."
          className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-lg outline-none transition focus:border-indigo-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onStart(inputRef.current?.value.trim() || 'Player')
          }}
        />
        <button
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          disabled={disabled}
          onClick={() => onStart(inputRef.current?.value.trim() || 'Player')}
        >
          Start Adventure
        </button>
      </div>
    </div>
  )
}


