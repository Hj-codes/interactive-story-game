import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, User, PlayCircle, X } from 'lucide-react'
import { GameAPI, type GameSession } from '@/api/game'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (sessionId: string) => void
}

export function PlayHistory({ open, onOpenChange, onSelect }: Props) {
    const [sessions, setSessions] = useState<GameSession[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setLoading(true)
            GameAPI.listSessions(20)
                .then((res) => {
                    if (res.success) {
                        setSessions(res.sessions)
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false))
        }
    }, [open])

    if (!open) return null

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden rounded-xl border-2 border-[--fantasy-gold]/50 bg-black/90 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[--fantasy-gold]/30 bg-gradient-to-r from-yellow-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-[--fantasy-gold]" />
                        <h2 className="text-xl font-serif font-bold text-[--fantasy-gold]">
                            Play History
                        </h2>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh] p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-[--fantasy-gold] border-t-transparent rounded-full" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No adventures yet</p>
                            <p className="text-sm mt-2">Start a new game to begin your journey!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session, index) => (
                                <motion.button
                                    key={session.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        onSelect(session.id)
                                        onOpenChange(false)
                                    }}
                                    className="w-full text-left p-4 rounded-lg border border-gray-700 hover:border-[--fantasy-gold]/50 bg-black/50 hover:bg-[--fantasy-gold]/5 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-[--fantasy-gold]" />
                                                <span className="font-serif font-medium text-white">
                                                    {session.character_name}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 line-clamp-2">
                                                {session.story_preview}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>Started: {formatDate(session.created_at)}</span>
                                                <span>Last played: {formatDate(session.updated_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 p-2 rounded-full bg-[--fantasy-gold]/10 group-hover:bg-[--fantasy-gold]/20 transition-colors">
                                            <PlayCircle className="w-5 h-5 text-[--fantasy-gold]" />
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
