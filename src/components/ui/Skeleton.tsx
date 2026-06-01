import { C } from '@/lib/atlas'
import { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: C.bgSoft, animation: 'skeleton-pulse 1.6s ease-in-out infinite', ...style }}
    />
  )
}

export function TrackerSkeleton() {
  return (
    <div style={{ color: C.ink }}>
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <Skeleton style={{ width: 200, height: 28 }} />
          <Skeleton style={{ width: 140, height: 14 }} />
        </div>
        <Skeleton style={{ width: 100, height: 36, borderRadius: 12 }} />
      </div>
      <div className="flex gap-2 mb-6">
        {[100, 100, 100, 148].map((w, i) => (
          <Skeleton key={i} style={{ width: w, height: 36, borderRadius: 8 }} />
        ))}
      </div>
      {[0, 1].map(g => (
        <div key={g} className="mb-8">
          <Skeleton style={{ width: 160, height: 18, marginBottom: 16 }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl p-5 space-y-3"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Skeleton style={{ height: 16, width: '80%' }} />
                <Skeleton style={{ height: 12, width: '60%' }} />
                <Skeleton style={{ height: 8, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton style={{ width: 240, height: 32 }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <Skeleton style={{ height: 12, width: '60%', marginBottom: 12 }} />
            <Skeleton style={{ height: 28, width: '40%' }} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Skeleton style={{ height: 14, width: 120, marginBottom: 12 }} />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex justify-between items-center py-3"
            style={{ borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <Skeleton style={{ height: 14, width: 140 }} />
            <Skeleton style={{ height: 22, width: 72, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
