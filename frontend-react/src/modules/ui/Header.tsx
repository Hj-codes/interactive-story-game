import { Map, Save, FolderOpen, History, Plus, Settings, Clock } from 'lucide-react'

type Props = {
  chapterCount: number
  onNew: () => void
  onSave: () => void
  onLoad: () => void
  onPlayHistory: () => void
  onToggleHistory: () => void
  canSave: boolean
  showHistory: boolean
}

export function Header({ chapterCount, onNew, onSave, onLoad, onPlayHistory, onToggleHistory, canSave, showHistory }: Props) {
  const progressPercentage = Math.min((chapterCount / 10) * 100, 100)

  return (
    <header className="flex-shrink-0 w-full px-4 py-3 flex flex-wrap justify-between items-center bg-gradient-to-b from-black/90 to-transparent">
      {/* Left: Progress Tracker */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-gray-600 bg-black/50 flex items-center justify-center">
          <Map className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <span className="font-serif text-xs font-bold text-gray-300 tracking-wider uppercase">World Map</span>
          <div className="w-10 h-[2px] bg-[--fantasy-gold] my-0.5" />
          <span className="text-[10px] text-gray-500">Chapter {chapterCount}/10</span>
          <div className="progress-bar w-20 mt-0.5 h-0.5">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Center: Title */}
      <div className="text-center order-last w-full md:order-none md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 mt-2 md:mt-0">
        <h1 className="font-serif text-2xl md:text-4xl font-black text-gradient-gold drop-shadow-lg tracking-[0.1em]">
          PATH OF FATE
        </h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-light">
          Immersive AI-Powered Storytelling
        </p>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        <button onClick={onNew} className="p-2 text-gray-500 hover:text-[--fantasy-gold] transition-colors" title="New Game">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={onPlayHistory} className="p-2 text-gray-500 hover:text-[--fantasy-gold] transition-colors" title="Play History">
          <Clock className="w-4 h-4" />
        </button>
        <button onClick={onSave} disabled={!canSave} className="p-2 text-gray-500 hover:text-[--fantasy-gold] transition-colors disabled:opacity-40" title="Save">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={onLoad} className="p-2 text-gray-500 hover:text-[--fantasy-gold] transition-colors" title="Load">
          <FolderOpen className="w-4 h-4" />
        </button>
        <button onClick={onToggleHistory} className={`p-2 transition-colors ${showHistory ? 'text-[--fantasy-gold]' : 'text-gray-500 hover:text-[--fantasy-gold]'}`} title="History">
          <History className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-500 hover:text-[--fantasy-gold] transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
