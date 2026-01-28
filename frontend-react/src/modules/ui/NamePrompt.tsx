import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Sword, Shield, Wand2 } from 'lucide-react'

type Props = {
  disabled?: boolean
  onStart: (name: string) => void
}

export function NamePrompt({ disabled, onStart }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-lg mx-auto text-center"
    >
      {/* Intro text */}
      <div className="mb-12 space-y-3">
        <motion.p
          className="narrative-text text-xl md:text-2xl animate-pulse-slow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          "The world holds its breath..."
        </motion.p>
        <motion.p
          className="narrative-text text-xl md:text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          "Your destiny awaits..."
        </motion.p>
        <motion.p
          className="narrative-emphasis text-xl md:text-2xl mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Choose your name... and begin.
        </motion.p>
      </div>

      {/* Card */}
      <motion.div
        className="choice-card card-gold glow-gold border-2 border-[--fantasy-gold] rounded-xl bg-black/80 backdrop-blur-sm overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        {/* Hero section */}
        <div className="relative py-8 px-6 bg-gradient-to-b from-yellow-900/20 to-transparent">
          <div className="flex justify-center gap-4 mb-4">
            <Shield className="w-8 h-8 text-[--fantasy-gold] opacity-60" />
            <Sword className="w-10 h-10 text-[--fantasy-gold]" />
            <Wand2 className="w-8 h-8 text-[--fantasy-gold] opacity-60" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[--fantasy-gold] tracking-wider uppercase">
            Begin Your Journey
          </h2>
        </div>

        {/* Form */}
        <div className="p-6 border-t border-[--fantasy-gold]/30">
          <input
            ref={inputRef}
            type="text"
            maxLength={20}
            placeholder="Enter your name, traveler..."
            className="w-full bg-black/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white text-center font-serif text-lg
                       placeholder:text-gray-500 placeholder:italic
                       focus:border-[--fantasy-gold] focus:outline-none focus:ring-2 focus:ring-[--fantasy-gold]/20
                       transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onStart(inputRef.current?.value.trim() || 'Player')
            }}
          />

          <button
            className="btn-fantasy btn-fantasy-gold mt-6"
            disabled={disabled}
            onClick={() => onStart(inputRef.current?.value.trim() || 'Player')}
          >
            Embark on Your Quest
          </button>

          <p className="text-gray-600 text-xs mt-4 italic">
            Leave blank to journey as "Player"
          </p>
        </div>

        {/* Corner accents */}
        <div className="corner-accent corner-accent-tl border-[--fantasy-gold] shadow-[0_0_10px_#FFD700]" />
        <div className="corner-accent corner-accent-tr border-[--fantasy-gold] shadow-[0_0_10px_#FFD700]" />
        <div className="corner-accent corner-accent-bl border-[--fantasy-gold] shadow-[0_0_10px_#FFD700]" />
        <div className="corner-accent corner-accent-br border-[--fantasy-gold] shadow-[0_0_10px_#FFD700]" />
      </motion.div>
    </motion.div>
  )
}
