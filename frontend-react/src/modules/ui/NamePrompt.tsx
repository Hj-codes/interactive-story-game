import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sword, Shield, Wand2, Feather } from 'lucide-react'

type Props = {
  disabled?: boolean
  onStart: (name: string, initialStory?: string) => void
}

export function NamePrompt({ disabled, onStart }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [customStoryMode, setCustomStoryMode] = useState(false)
  const [customStory, setCustomStory] = useState('')

  const handleStart = () => {
    const name = inputRef.current?.value.trim() || 'Player'
    onStart(name, customStoryMode ? customStory : undefined)
  }

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
              if (e.key === 'Enter' && !customStoryMode) handleStart()
            }}
          />

          {/* Custom Story Toggle */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCustomStoryMode(!customStoryMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${customStoryMode
                  ? 'border-[--fantasy-gold] bg-[--fantasy-gold]/20 text-[--fantasy-gold]'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                }`}
            >
              <Feather className="w-4 h-4" />
              <span className="text-sm font-medium">Write Your Own Story</span>
            </button>
          </div>

          {/* Custom Story Textarea */}
          <AnimatePresence>
            {customStoryMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <textarea
                  value={customStory}
                  onChange={(e) => setCustomStory(e.target.value)}
                  placeholder="Write your own starting story... (e.g., 'You find yourself at the gates of an ancient castle, lightning flashing in the sky above...')"
                  maxLength={1500}
                  rows={5}
                  className="w-full mt-4 bg-black/50 border-2 border-gray-700 rounded-lg px-4 py-3 text-white font-serif
                             placeholder:text-gray-500 placeholder:italic text-sm
                             focus:border-[--fantasy-gold] focus:outline-none focus:ring-2 focus:ring-[--fantasy-gold]/20
                             transition-all resize-none"
                />
                <p className="text-gray-500 text-xs mt-1 text-right">
                  {customStory.length}/1500 characters
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="btn-fantasy btn-fantasy-gold mt-6"
            disabled={disabled || (customStoryMode && !customStory.trim())}
            onClick={handleStart}
          >
            {customStoryMode ? 'Begin Your Tale' : 'Embark on Your Quest'}
          </button>

          <p className="text-gray-600 text-xs mt-4 italic">
            {customStoryMode
              ? 'AI will generate choices based on your story'
              : 'Leave blank to journey as "Player"'}
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
