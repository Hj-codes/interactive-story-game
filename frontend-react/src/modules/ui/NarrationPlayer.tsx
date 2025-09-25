import { useEffect, useMemo, useRef, useState } from 'react'
import { GameAPI } from '@/api/game'

type Props = {
  story: string
}

export function NarrationPlayer({ story }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const canPlay = !!story && !isLoading

  const onGenerate = async () => {
    if (!story || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const blob = await GameAPI.narrate(story)
      const url = URL.createObjectURL(blob)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(url)
      setTimeout(() => audioRef.current?.play().catch(() => {}), 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate narration')
    } finally {
      setIsLoading(false)
    }
  }

  const onDownload = () => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = 'narration.wav'
    a.click()
  }

  return (
    <div className="rounded-xl border-l-4 border-violet-500 bg-violet-50 p-5 mt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Narration</h3>
          <p className="text-sm text-slate-600">Have the current story narrated aloud.</p>
        </div>
        <button
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          onClick={onGenerate}
          disabled={!canPlay}
        >
          {isLoading ? 'Generating…' : 'Play Narration'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <audio
          ref={audioRef}
          src={audioUrl ?? undefined}
          controls
          className="w-full"
          onVolumeChange={(e) => setVolume((e.target as HTMLAudioElement).volume)}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            className="rounded-md border-2 border-slate-200 bg-white px-3 py-1.5 text-slate-900 shadow-sm disabled:opacity-60"
            onClick={() => audioRef.current?.pause()}
            disabled={!audioUrl}
          >
            Pause
          </button>
          <button
            className="rounded-md border-2 border-slate-200 bg-white px-3 py-1.5 text-slate-900 shadow-sm disabled:opacity-60"
            onClick={() => audioRef.current?.play()}
            disabled={!audioUrl}
          >
            Resume
          </button>
          <button
            className="rounded-md border-2 border-slate-200 bg-white px-3 py-1.5 text-slate-900 shadow-sm disabled:opacity-60"
            onClick={() => {
              const a = audioRef.current
              if (a) { a.currentTime = 0; a.play().catch(() => {}) }
            }}
            disabled={!audioUrl}
          >
            Replay
          </button>
          <div className="ml-2 flex items-center gap-2">
            <span className="text-sm text-slate-600">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setVolume(v)
                if (audioRef.current) audioRef.current.volume = v
              }}
            />
          </div>
          <button
            className="rounded-md border-2 border-slate-200 bg-white px-3 py-1.5 text-slate-900 shadow-sm disabled:opacity-60"
            onClick={onDownload}
            disabled={!audioUrl}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}


