import { motion } from 'framer-motion'
import { useState } from 'react'

type Props = {
  choices: string[]
  disabled?: boolean
  onChoose: (index: number) => void
}

const cardThemes = [
  {
    border: 'border-[--fantasy-gold]',
    glow: 'glow-gold',
    text: 'text-[--fantasy-gold]',
    bg: 'from-yellow-900/30 to-yellow-950/50',
    btnClass: 'btn-fantasy-gold',
  },
  {
    border: 'border-[--fantasy-purple]',
    glow: 'glow-purple',
    text: 'text-purple-300',
    bg: 'from-purple-900/30 to-purple-950/50',
    btnClass: 'btn-fantasy-purple',
  },
  {
    border: 'border-[--fantasy-green]',
    glow: 'glow-green',
    text: 'text-green-300',
    bg: 'from-green-900/30 to-green-950/50',
    btnClass: 'btn-fantasy-green',
  },
]

export function Choices({ choices, disabled, onChoose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (choices.length === 0) return null

  return (
    <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
      {choices.map((choice, i) => {
        const theme = cardThemes[i % cardThemes.length]
        const isActive = i === activeIndex

        return (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            onMouseEnter={() => setActiveIndex(i)}
            className={`
              choice-card relative group rounded-xl overflow-hidden border-2
              ${theme.border} ${isActive ? theme.glow : ''}
              bg-gradient-to-b ${theme.bg}
              backdrop-blur-sm
              cursor-pointer
              ${isActive ? 'opacity-100 scale-[1.02]' : 'opacity-80 hover:opacity-100'}
              ${disabled ? 'pointer-events-none opacity-50' : ''}
            `}
            onClick={() => !disabled && onChoose(i)}
          >
            {/* Number */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
              <span className={`text-2xl font-serif font-bold ${theme.text} opacity-40`}>
                {i + 1}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 pt-6">
              <h3 className={`font-serif text-sm font-bold ${theme.text} mb-2 uppercase tracking-wider`}>
                Choice {i + 1}
              </h3>
              <p className="text-gray-200 text-xs leading-relaxed min-h-[40px]">
                {choice}
              </p>
              <button
                className={`btn-fantasy ${theme.btnClass} mt-3 text-xs py-2`}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!disabled) onChoose(i)
                }}
              >
                Select
              </button>
            </div>

            {/* Corner accents for active card */}
            {isActive && (
              <>
                <div className={`corner-accent corner-accent-tl ${theme.border}`} />
                <div className={`corner-accent corner-accent-tr ${theme.border}`} />
                <div className={`corner-accent corner-accent-bl ${theme.border}`} />
                <div className={`corner-accent corner-accent-br ${theme.border}`} />
              </>
            )}
          </motion.article>
        )
      })}
    </section>
  )
}
