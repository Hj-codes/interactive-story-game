import { motion, AnimatePresence } from 'framer-motion'

export function StoryArea({ story, isLoading }: { story: string; isLoading: boolean }) {
  return (
    <div className="relative mb-6 rounded-xl border-l-4 border-indigo-400 bg-slate-50 p-6">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-48 flex-col items-center justify-center text-indigo-500"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
            <p className="mt-3">Weaving your tale...</p>
          </motion.div>
        ) : (
          <motion.div
            key={story}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="font-serif text-[1.15rem] leading-8 text-slate-800 whitespace-pre-wrap">{story}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


