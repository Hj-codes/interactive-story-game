type Props = {
  choices: string[]
  disabled?: boolean
  onChoose: (index: number) => void
}

export function Choices({ choices, disabled, onChoose }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {choices.map((choice, i) => (
        <button
          key={i}
          className="rounded-xl border-2 border-slate-200 bg-white p-5 text-left text-[1.05rem] leading-6 text-slate-800 shadow-sm transition hover:translate-x-2 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white disabled:opacity-60"
          onClick={() => onChoose(i)}
          disabled={disabled}
        >
          {choice}
        </button>
      ))}
    </div>
  )
}


