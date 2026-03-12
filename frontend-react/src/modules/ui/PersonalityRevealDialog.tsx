import { motion } from 'framer-motion'
import { Brain, RefreshCw, Sparkles, X } from 'lucide-react'
import type { PersonalityProfile, PersonalityTraitKey } from '@/types'

type Props = {
  open: boolean
  loading: boolean
  profile: PersonalityProfile | null
  warning?: string | null
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

const traitOrder: PersonalityTraitKey[] = [
  'bravery',
  'empathy',
  'cunning',
  'honor',
  'curiosity',
  'caution',
]

export function PersonalityRevealDialog({
  open,
  loading,
  profile,
  warning,
  onOpenChange,
  onRefresh,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-4xl mx-4 max-h-[88vh] overflow-hidden rounded-2xl border border-[--fantasy-gold]/40 bg-black/90 shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[--fantasy-gold]/20 bg-gradient-to-r from-yellow-900/20 via-amber-700/10 to-transparent">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[--fantasy-gold]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[--fantasy-gold]">Personality Analysis</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Your decision-making archetype</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(88vh-88px)] px-6 py-5">
          {loading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[--fantasy-gold] border-t-transparent" />
              <div>
                <p className="font-serif text-lg text-white">Reading the path you carved</p>
                <p className="text-sm text-gray-400">Analyzing your major choices and patterns...</p>
              </div>
            </div>
          ) : profile ? (
            <div className="space-y-5">
              <section className="rounded-2xl border border-[--fantasy-gold]/20 bg-gradient-to-br from-[--fantasy-gold]/10 via-transparent to-transparent p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[--fantasy-gold]">
                      <Brain className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">Archetype</span>
                    </div>
                    <h3 className="font-serif text-3xl text-white">{profile.archetype}</h3>
                    <p className="mt-2 text-sm text-gray-400">
                      Based on {profile.choices_analyzed} key decision{profile.choices_analyzed === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 rounded-lg border border-[--fantasy-gold]/30 px-4 py-2 text-sm text-[--fantasy-gold] hover:bg-[--fantasy-gold]/10 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Analysis
                  </button>
                </div>
                {warning ? <p className="mt-3 text-sm text-amber-300">{warning}</p> : null}
              </section>

              <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-gray-800 bg-black/40 p-5">
                  <h4 className="mb-4 font-serif text-lg text-white">Trait Balance</h4>
                  <div className="space-y-3">
                    {traitOrder.map((trait, index) => {
                      const score = profile.trait_scores[trait]
                      return (
                        <motion.div
                          key={trait}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="capitalize text-gray-300">{trait}</span>
                            <span className="font-medium text-[--fantasy-gold]">{score}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.6, delay: index * 0.05 }}
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-300"
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-black/40 p-5">
                  <h4 className="mb-4 font-serif text-lg text-white">Summary</h4>
                  <p className="text-sm leading-7 text-gray-300">{profile.summary}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-800 bg-black/40 p-5">
                <h4 className="mb-4 font-serif text-lg text-white">Signals Behind the Profile</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {profile.evidence.map((item, index) => (
                    <motion.div
                      key={`${item.trait}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-xl border border-[--fantasy-gold]/15 bg-[--fantasy-gold]/5 p-4"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[--fantasy-gold]">{item.trait}</p>
                      <p className="mt-2 text-sm text-white">{item.choice}</p>
                      <p className="mt-3 text-sm leading-6 text-gray-400">{item.signal}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="w-10 h-10 text-[--fantasy-gold]" />
              <h3 className="font-serif text-xl text-white">No personality analysis yet</h3>
              <p className="max-w-md text-sm text-gray-400">
                Make a few meaningful choices, then reveal the archetype hidden in your journey.
              </p>
              <button
                onClick={onRefresh}
                className="mt-2 rounded-lg border border-[--fantasy-gold]/30 px-4 py-2 text-sm text-[--fantasy-gold] hover:bg-[--fantasy-gold]/10 transition-colors"
              >
                Reveal Personality
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
