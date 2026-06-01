'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Check, AlertTriangle, Info, X } from 'lucide-react'
import { C } from '@/lib/atlas'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem { id: number; message: string; type: ToastType }

interface Ctx { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<Ctx>({ toast: () => {} })

export function useToast() { return useContext(ToastContext) }

let uid = 0

const CONFIG = {
  success: { bg: '#D1EBE0', color: C.success, border: '#3F856240', Icon: Check },
  error:   { bg: '#F5DDD9', color: C.danger,  border: '#BA5A5540', Icon: AlertTriangle },
  info:    { bg: C.paleTeal, color: C.teal,   border: C.teal + '40', Icon: Info },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = uid++
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800)
  }, [])

  const dismiss = (id: number) => setToasts(p => p.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-2 pointer-events-none"
        style={{ minWidth: 240 }}>
        {toasts.map(t => {
          const { bg, color, border, Icon } = CONFIG[t.type]
          return (
            <div key={t.id}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl pointer-events-auto"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: '0 8px 32px rgba(38,63,73,0.16)',
                fontFamily: 'var(--font-sans)',
                animation: 'toast-in 0.2s ease',
              }}>
              <Icon size={14} style={{ color, flexShrink: 0 }} strokeWidth={2.5} />
              <span className="text-sm font-medium" style={{ color }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity" style={{ color }}>
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
