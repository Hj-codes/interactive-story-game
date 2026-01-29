import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameAPI } from '@/api/game'
import type { CharacterInfo, ChoiceHistoryEntry } from '@/types'
import { sessionStorageKey } from '@/lib/utils'
import { Header } from '@/modules/ui/Header'
import { NamePrompt } from '@/modules/ui/NamePrompt'
import { StoryArea } from '@/modules/ui/StoryArea'
import { Choices } from '@/modules/ui/Choices'
import { CharacterInfoCard } from '@/modules/ui/CharacterInfoCard'
import { HistoryPanel } from '@/modules/ui/HistoryPanel'
import { SaveDialog } from '@/modules/ui/SaveDialog'
import { LoadDialog } from '@/modules/ui/LoadDialog'
import { PlayHistory } from '@/modules/ui/PlayHistory'
import { Toast, ToastProvider, useToast } from '@/modules/ui/Toast'
import { NarrationPlayer } from '@/modules/ui/NarrationPlayer'

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [story, setStory] = useState('')
  const [choices, setChoices] = useState<string[]>([])
  const [character, setCharacter] = useState<CharacterInfo>({ name: 'Player', traits: [], inventory: [] })
  const [history, setHistory] = useState<ChoiceHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [playHistoryOpen, setPlayHistoryOpen] = useState(false)
  const [chapterCount, setChapterCount] = useState(0)
  const [sceneImage, setSceneImage] = useState<string | null>(null)

  const canInteract = useMemo(() => !!sessionId && !isLoading, [sessionId, isLoading])
  const { toasts, push } = useToast()

  useEffect(() => {
    const stored = localStorage.getItem(sessionStorageKey)
    if (!stored) return
    GameAPI.getState(stored)
      .then((data) => {
        if (data.success) {
          setSessionId(data.session_id)
          setStory(data.current_story)
          setChoices(data.choices)
          setCharacter(data.character_info)
          setSceneImage(data.image || null)
          GameAPI.history(data.session_id).then((h) => {
            if (h.success) {
              setHistory(h.choices_history)
              setChapterCount(h.choices_history.length)
            }
          })
        }
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canInteract) return
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2 }
      const idx = map[e.key]
      if (idx !== undefined && idx < choices.length) {
        void onMakeChoice(idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canInteract, choices])

  const onStart = async (name: string, initialStory?: string) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const data = await GameAPI.start(name || 'Player', initialStory)
      if (data.success) {
        setSessionId(data.session_id)
        localStorage.setItem(sessionStorageKey, data.session_id)
        setStory(data.current_story)
        setChoices(data.choices)
        setCharacter(data.character_info)
        setSceneImage(data.image || null)
        setChapterCount(0)
        const h = await GameAPI.history(data.session_id)
        if (h.success) setHistory(h.choices_history)
      } else {
        push({ title: 'Failed to start game', variant: 'destructive' })
      }
    } catch {
      push({ title: 'Unable to connect to server', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const onMakeChoice = async (choiceIndex: number) => {
    if (!sessionId || isLoading) return
    setIsLoading(true)
    try {
      const data = await GameAPI.makeChoice(sessionId, choiceIndex)
      if (data.success) {
        setStory(data.story)
        setChoices(data.choices)
        setCharacter(data.character_info)
        setSceneImage(data.image || null)
        const h = await GameAPI.history(sessionId)
        if (h.success) {
          setHistory(h.choices_history)
          setChapterCount(h.choices_history.length)
        }
      } else {
        push({ title: data.error ?? 'Failed to process choice', variant: 'destructive' })
      }
    } catch {
      push({ title: 'Unable to connect to server', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const onSave = async (saveName: string) => {
    if (!sessionId) return
    try {
      const res = await GameAPI.save(sessionId, saveName)
      if (res.success) {
        push({ title: 'Game saved successfully' })
        setSaveOpen(false)
      } else {
        push({ title: res.error ?? 'Failed to save game', variant: 'destructive' })
      }
    } catch {
      push({ title: 'Unable to save game', variant: 'destructive' })
    }
  }

  const onLoad = async (saveId: string) => {
    setIsLoading(true)
    try {
      const data = await GameAPI.load(saveId)
      if (data.success) {
        setSessionId(data.session_id)
        localStorage.setItem(sessionStorageKey, data.session_id)
        setStory(data.current_story)
        setChoices(data.choices)
        setCharacter(data.character_info)
        setSceneImage(data.image || null)
        const h = await GameAPI.history(data.session_id)
        if (h.success) {
          setHistory(h.choices_history)
          setChapterCount(h.choices_history.length)
        }
        push({ title: 'Game loaded successfully' })
        setLoadOpen(false)
      } else {
        push({ title: 'Failed to load game', variant: 'destructive' })
      }
    } catch {
      push({ title: 'Unable to load game', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const onNew = () => {
    setSessionId(null)
    setStory('')
    setChoices([])
    setHistory([])
    setChapterCount(0)
    setSceneImage(null)
  }

  const onResumeSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      const data = await GameAPI.getState(sessionId)
      if (data.success) {
        setSessionId(data.session_id)
        localStorage.setItem(sessionStorageKey, data.session_id)
        setStory(data.current_story)
        setChoices(data.choices)
        setCharacter(data.character_info)
        setSceneImage(data.image || null)
        const h = await GameAPI.history(data.session_id)
        if (h.success) {
          setHistory(h.choices_history)
          setChapterCount(h.choices_history.length)
        }
        push({ title: 'Session resumed' })
      } else {
        push({ title: 'Failed to resume session', variant: 'destructive' })
      }
    } catch {
      push({ title: 'Unable to resume session', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ToastProvider>
      <div className="relative min-h-screen overflow-y-auto">
        {/* Full-screen background */}
        <div className="fixed inset-0 z-0">
          <img
            src="/bg-fantasy.png"
            alt="Fantasy Background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-overlay pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-1/4 bg-mist pointer-events-none" />
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen">
          <Header
            chapterCount={chapterCount}
            onNew={onNew}
            onSave={() => setSaveOpen(true)}
            onLoad={() => setLoadOpen(true)}
            onPlayHistory={() => setPlayHistoryOpen(true)}
            onToggleHistory={() => setShowHistory((v) => !v)}
            canSave={!!sessionId}
            showHistory={showHistory}
          />

          <main className="py-4 pb-8">
            <AnimatePresence mode="wait">
              {!sessionId ? (
                <NamePrompt key="name" disabled={isLoading} onStart={onStart} />
              ) : (
                <motion.div
                  key="game"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  {/* Story - takes available space but limited */}
                  <div className="flex-shrink-0">
                    <StoryArea story={story} isLoading={isLoading} image={sceneImage} />
                  </div>

                  {/* Choice cards */}
                  <div className="flex-shrink-0">
                    <Choices
                      choices={choices}
                      disabled={isLoading}
                      onChoose={onMakeChoice}
                    />
                  </div>

                  {/* Bottom bar: Character + Narration */}
                  <div className="flex-shrink-0 mt-4 px-4">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CharacterInfoCard character={character} />
                      <NarrationPlayer story={story} />
                    </div>
                  </div>

                  {/* History panel (collapsible) */}
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex-shrink-0 mt-4 px-4"
                      >
                        <div className="max-w-4xl mx-auto">
                          <HistoryPanel
                            entries={history}
                            onRefresh={() => sessionId && GameAPI.history(sessionId).then(h => h.success && setHistory(h.choices_history))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <SaveDialog open={saveOpen} onOpenChange={setSaveOpen} onConfirm={onSave} />
        <LoadDialog open={loadOpen} onOpenChange={setLoadOpen} onSelect={onLoad} sessionId={sessionId ?? undefined} />
        <PlayHistory open={playHistoryOpen} onOpenChange={setPlayHistoryOpen} onSelect={onResumeSession} />

        {toasts.map((t) => (
          <Toast key={t.id} {...t} />
        ))}
      </div>
    </ToastProvider>
  )
}
