import { createContext, useContext, useMemo, useRef, useState } from 'react'

export type ToastData = {
  id: string
  title: string
  variant?: 'default' | 'destructive'
}

const ToastCtx = createContext<{
  push: (t: Omit<ToastData, 'id'>) => void
  toasts: ToastData[]
}>({ push: () => {}, toasts: [] })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const idRef = useRef(0)

  const value = useMemo(() => ({
    push: (t: Omit<ToastData, 'id'>) => {
      const id = `${Date.now()}-${idRef.current++}`
      setToasts((prev) => [...prev, { id, ...t }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, 3000)
    },
    toasts,
  }), [toasts])

  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>
}

export function useToast() {
  return useContext(ToastCtx)
}

export function Toast({ id, title, variant = 'default' }: ToastData) {
  return (
    <div
      key={id}
      className={
        'fixed left-1/2 top-4 z-[200] -translate-x-1/2 rounded-lg border-l-4 px-4 py-3 shadow-md ' +
        (variant === 'destructive'
          ? 'border-red-500 bg-red-100 text-red-800'
          : 'border-emerald-500 bg-emerald-100 text-emerald-800')
      }
    >
      {title}
    </div>
  )
}


