import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastData = {
  id: string
  title: string
  variant?: 'default' | 'destructive'
}

const ToastCtx = createContext<{
  push: (t: Omit<ToastData, 'id'>) => void
  toasts: ToastData[]
  dismiss: (id: string) => void
}>({ push: () => { }, toasts: [], dismiss: () => { } })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const idRef = useRef(0)

  const value = useMemo(() => ({
    push: (t: Omit<ToastData, 'id'>) => {
      const id = `${Date.now()}-${idRef.current++}`
      setToasts((prev) => [...prev, { id, ...t }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, 4000)
    },
    dismiss: (id: string) => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    },
    toasts,
  }), [toasts])

  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>
}

export function useToast() {
  return useContext(ToastCtx)
}

export function Toast({ id, title, variant = 'default' }: ToastData) {
  const { dismiss } = useToast()

  return (
    <AnimatePresence>
      <motion.div
        key={id}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          fixed left-1/2 top-4 z-[200] -translate-x-1/2 
          flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl
          ${variant === 'destructive'
            ? 'border-red-500/50 bg-red-950/90 text-red-200'
            : 'border-[--fantasy-gold]/50 bg-black/90 text-[--fantasy-gold]'
          }
        `}
      >
        {variant === 'destructive' ? (
          <XCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
        ) : (
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-[--fantasy-gold]" />
        )}
        <span className="text-sm font-serif">{title}</span>
        <button
          onClick={() => dismiss(id)}
          className="ml-2 rounded-full p-1 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4 opacity-60" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
