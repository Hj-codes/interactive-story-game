import type { ChoiceHistoryEntry } from '@/types'

export function HistoryPanel({ entries, onRefresh }: { entries: ChoiceHistoryEntry[]; onRefresh?: () => void }) {
  return (
    <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Story History</h3>
        {onRefresh && (
          <button className="rounded-md border border-amber-200 bg-white/60 px-3 py-1 text-sm text-amber-800 hover:bg-white" onClick={onRefresh}>
            Refresh
          </button>
        )}
      </div>
      <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
        {(!entries || entries.length === 0) && (
          <p className="text-center italic text-slate-500">No history yet</p>
        )}
        {entries?.map((e, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="font-semibold text-slate-800">Choice: {e.choice}</div>
            <div className="mt-1 text-slate-600">{e.story_segment}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


