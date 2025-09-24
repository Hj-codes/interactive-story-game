import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameAPI } from '@/api/game'
import type { CharacterInfo, ChoiceHistoryEntry } from '@/types'
import { sessionStorageKey } from '@/lib/utils'
import { Header } from '@/modules/ui/Header'
import { Controls } from '@/modules/ui/Controls'
import { NamePrompt } from '@/modules/ui/NamePrompt'
import { StoryArea } from '@/modules/ui/StoryArea'
import { Choices } from '@/modules/ui/Choices'
import { CharacterInfoCard } from '@/modules/ui/CharacterInfoCard'
import { HistoryPanel } from '@/modules/ui/HistoryPanel'
import { SaveDialog } from '@/modules/ui/SaveDialog'
import { LoadDialog } from '@/modules/ui/LoadDialog'
import { Toast, ToastProvider, useToast } from '@/modules/ui/Toast'

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
          GameAPI.history(data.session_id).then((h) => {
            if (h.success) setHistory(h.choices_history)
          })
        }
      })
      .catch(() => {})
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

  const onStart = async (name: string) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const data = await GameAPI.start(name || 'Player')
      if (data.success) {
        setSessionId(data.session_id)
        localStorage.setItem(sessionStorageKey, data.session_id)
        setStory(data.current_story)
        setChoices(data.choices)
        setCharacter(data.character_info)
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
        const h = await GameAPI.history(sessionId)
        if (h.success) setHistory(h.choices_history)
      } else {
        push({ title: data['error'] ?? 'Failed to process choice', variant: 'destructive' })
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
        const h = await GameAPI.history(data.session_id)
        if (h.success) setHistory(h.choices_history)
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
  }

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <div className="container mx-auto my-6 rounded-2xl bg-white/90 shadow-2xl backdrop-blur">
          <Header />
          <Controls
            canSave={!!sessionId}
            canToggleHistory={!!sessionId}
            onNew={onNew}
            onSave={() => setSaveOpen(true)}
            onLoad={() => setLoadOpen(true)}
            onToggleHistory={() => setShowHistory((v) => !v)}
          />

          {!sessionId ? (
            <NamePrompt disabled={isLoading} onStart={onStart} />
          ) : (
            <div className="px-6 pb-10">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <StoryArea story={story} isLoading={isLoading} />
                  <Choices choices={choices} disabled={isLoading} onChoose={onMakeChoice} />
                </div>
                <div className="lg:col-span-1">
                  <CharacterInfoCard character={character} />
                  <AnimatePresence initial={false}>
                    {showHistory && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="mt-6"
                      >
                        <HistoryPanel entries={history} onRefresh={() => sessionId && GameAPI.history(sessionId).then(h => h.success && setHistory(h.choices_history))} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>

        <SaveDialog open={saveOpen} onOpenChange={setSaveOpen} onConfirm={onSave} />
        <LoadDialog open={loadOpen} onOpenChange={setLoadOpen} onSelect={onLoad} sessionId={sessionId ?? undefined} />

        {toasts.map((t) => (
          <Toast key={t.id} {...t} />
        ))}
      </div>
    </ToastProvider>
  )
}


