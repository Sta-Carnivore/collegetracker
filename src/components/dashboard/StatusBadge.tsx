import { ApplicationStatus } from '@/types/database'
import { C } from '@/lib/atlas'

export const statusConfig: Record<ApplicationStatus, {
  label: string
  bg: string
  color: string
}> = {
  not_started: { label: 'Not started', bg: 'rgba(38,63,73,0.07)', color: C.inkFaint  },
  in_progress:  { label: 'In progress', bg: C.slateLight,          color: C.slate     },
  submitted:    { label: 'Submitted',   bg: C.palePlum,            color: C.plum      },
  waiting:      { label: 'Waiting',     bg: C.paleGold,            color: '#9A7030'   },
  accepted:     { label: 'Accepted',    bg: '#D1EBE0',             color: C.success   },
  rejected:     { label: 'Rejected',    bg: '#F5DDD9',             color: C.danger    },
  waitlisted:   { label: 'Waitlisted',  bg: C.paleGold,            color: '#9A7030'   },
  deferred:     { label: 'Deferred',    bg: '#F5E6D3',             color: '#8B5E2A'   },
}

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }}/>
      {cfg.label}
    </span>
  )
}
