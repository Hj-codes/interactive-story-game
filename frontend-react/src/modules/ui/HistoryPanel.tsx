import type { ChoiceHistoryEntry } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock } from 'lucide-react'

export function HistoryPanel({ entries, onRefresh }: { entries: ChoiceHistoryEntry[]; onRefresh?: () => void }) {
  return (
    <div className="glass rounded-xl p-5 border border-gray-800">
      <h3 className="font-serif text-sm font-bold text-[--fantasy-gold] tracking-wider uppercase mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Journey Log
      </h3>

      <ScrollArea className="h-48">
        {(!entries || entries.length === 0) ? (
          <p className="text-gray-600 text-sm italic text-center py-4">
            No chapters recorded yet...
          </p>
        ) : (
          <div className="space-y-3 pr-2">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="relative pl-4 pb-3 border-l border-gray-700 last:border-l-0"
              >
                {/* Timeline dot */}
                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[--fantasy-gold]" />

                <p className="text-xs font-serif text-[--fantasy-gold] uppercase tracking-wide mb-1">
                  Chapter {idx + 1}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {entry.choice}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
