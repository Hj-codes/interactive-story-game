import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface StoryAreaProps {
  story: string
  isLoading: boolean
  image?: string | null
}

export function StoryArea({ story, isLoading, image }: StoryAreaProps) {
  return (
    <section className="text-center mb-6 max-w-5xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[--fantasy-gold] mb-3" />
            <p className="text-gray-400 text-sm">The threads of fate are weaving...</p>
          </motion.div>
        ) : (
          <motion.div
            key={story}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Scene image */}
            {image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-700/50"
              >
                <img
                  src={`data:image/png;base64,${image}`}
                  alt="Scene illustration"
                  className="w-full h-64 md:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            )}

            {/* Story text - bright and readable */}
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-gray-800/50">
              <p className="text-gray-100 text-sm md:text-base leading-relaxed font-light">
                {story}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
