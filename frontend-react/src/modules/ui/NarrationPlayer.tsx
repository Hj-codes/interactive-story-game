import { useEffect, useRef, useState } from 'react'
import { GameAPI } from '@/api/game'
import { Play, Pause, Volume2, VolumeX, Loader2, Mic } from 'lucide-react'

type Props = {
  story: string
}

export function NarrationPlayer({ story }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [volume, setVolume] = useState(0.8)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setProgress((audio.currentTime / audio.duration) * 100 || 0)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => { setIsPlaying(false); setProgress(0) }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const onGenerate = async () => {
    if (!story || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const blob = await GameAPI.narrate(story)
      const url = URL.createObjectURL(blob)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(url)
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume
          audioRef.current.play().catch(() => { })
        }
      }, 100)
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    isPlaying ? audio.pause() : audio.play().catch(() => { })
  }

  return (
    <div className="glass rounded-lg px-4 py-3 border border-gray-800/50">
      <div className="flex items-center gap-3">
        <Mic className="w-4 h-4 text-[--fantasy-gold]" />
        <span className="font-serif text-xs font-bold text-[--fantasy-gold] tracking-wider uppercase">Narration</span>

        {!audioUrl ? (
          <button
            onClick={onGenerate}
            disabled={!story || isLoading}
            className="ml-auto btn-fantasy btn-fantasy-gold text-[10px] py-1.5 px-3"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate Narration'}
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            <div className="progress-bar w-20 h-1">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <button onClick={togglePlayPause} className="w-7 h-7 rounded-full border border-[--fantasy-gold] text-[--fantasy-gold] flex items-center justify-center hover:bg-[--fantasy-gold] hover:text-black transition-colors">
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>
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
              className="w-12 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[--fantasy-gold]"
            />
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  )
}
