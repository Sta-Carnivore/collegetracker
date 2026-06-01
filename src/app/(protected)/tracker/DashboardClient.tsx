'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { School, Application, ApplicationStatus, ApplicationType } from '@/types/database'
import SchoolCard from '@/components/dashboard/SchoolCard'
import SchoolRow from '@/components/dashboard/SchoolRow'
import SchoolDrawer from '@/components/dashboard/SchoolDrawer'
import AddSchoolModal from '@/components/dashboard/AddSchoolModal'
import { LayoutGrid, List, Download, Search, Plus } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface Props {
  schools: School[]
  initialApplications: Application[]
}

type ViewMode = 'icon' | 'list'
type GroupKey = 'EA' | 'REA' | 'ED' | 'UC' | 'RD' | 'Rolling' | 'not_set'

const GROUP_ORDER: GroupKey[] = ['EA', 'REA', 'ED', 'UC', 'RD', 'Rolling', 'not_set']

const GROUP_META: Record<GroupKey, { label: string; color: string; bg: string }> = {
  EA:      { label: 'Early Action',             color: C.teal,    bg: C.paleTeal  },
  REA:     { label: 'Restrictive Early Action',  color: C.plum,    bg: C.palePlum  },
  ED:      { label: 'Early Decision',            color: C.gold,    bg: C.paleGold  },
  UC:      { label: 'University of California',  color: '#9A7030', bg: C.paleGold  },
  RD:      { label: 'Regular Decision',          color: C.success, bg: '#D1EBE0'   },
  Rolling: { label: 'Rolling Admission',         color: C.slate,   bg: C.slateLight},
  not_set: { label: 'Round Not Set',             color: C.inkFaint, bg: C.bgSoft   },
}

const allStatuses: ApplicationStatus[] = [
  'not_started','in_progress','submitted','waiting','deferred','accepted','rejected','waitlisted',
]

function isUC(school: School) { return school.name.startsWith('University of California-') }

function getGroup(school: School, appType: ApplicationType | null | undefined): GroupKey {
  if (isUC(school)) return 'UC'
  if (!appType) return 'not_set'
  if (appType === 'EA') return 'EA'
  if (appType === 'REA') return 'REA'
  if (appType === 'ED') return 'ED'
  if (appType === 'Rolling') return 'Rolling'
  return 'RD'
}

function getDeadlineSort(school: School, appType: ApplicationType | null | undefined): string {
  if (school.deadline_rolling) return '9998'
  if (appType === 'EA' || appType === 'REA') return school.deadline_ea ?? '9999'
  if (appType === 'ED') return school.deadline_ed ?? '9999'
  if (appType === 'RD') return school.deadline_rd ?? '9999'
  return school.deadline_ea ?? school.deadline_ed ?? school.deadline_rd ?? '9999'
}

function exportCSV(schools: School[], applications: Application[]) {
  const appBySchool = Object.fromEntries(applications.map(a => [a.school_id, a]))
  const rows = [
    ['School','Round','Status','Deadline','Notification','Essays Done','Essays Total','Major','Notes'],
    ...schools.map(s => {
      const a = appBySchool[s.id]
      return [
        s.name, a?.application_type ?? '', a?.status ?? 'not_started',
        s.deadline_rolling ? 'Rolling' : s.deadline_rd ?? '',
        s.notification_date ?? '',
        String(a?.supplemental_essays_done ?? 0), String(s.supplemental_essay_count),
        a?.intended_major ?? '', a?.notes ?? '',
      ]
    }),
  ]
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'applications.csv'; a.click()
  URL.revokeObjectURL(url)
}

const selectStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  color: C.ink,
  fontSize: 13,
  padding: '6px 10px',
  borderRadius: 8,
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
} as const

export default function DashboardClient({ schools, initialApplications }: Props) {
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [view, setView]               = useState<ViewMode>('icon')
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | ''>('')
  const [filterType, setFilterType]   = useState<ApplicationType | ''>('')
  const [sortBy, setSortBy]           = useState<'name' | 'deadline'>('deadline')
  const [drawerSchool, setDrawerSchool] = useState<School | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('tracker-view') as ViewMode | null
    if (saved) setView(saved)
  }, [])
  useEffect(() => { localStorage.setItem('tracker-view', view) }, [view])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/applications')
    if (res.ok) setApplications(await res.json())
  }, [])
  const refreshAll = useCallback(() => window.location.reload(), [])

  async function updateApplication(schoolId: string, fields: Record<string, unknown>) {
    const res = await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, ...fields }),
    })
    if (res.ok) toast('Saved')
    else toast('Failed to save', 'error')
    refresh()
  }

  async function addSchool(schoolId: string) {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, status: 'not_started' }),
    })
    toast('School added')
  }

  const existingSchoolIds = useMemo(() => new Set(schools.map(s => s.id)), [schools])
  const appBySchool = useMemo(() => Object.fromEntries(applications.map(a => [a.school_id, a])), [applications])

  const filtered = useMemo(() => {
    let list = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus) list = list.filter(s => (appBySchool[s.id]?.status ?? 'not_started') === filterStatus)
    if (filterType) {
      if (filterType === 'RD') list = list.filter(s => isUC(s) || appBySchool[s.id]?.application_type === 'RD')
      else list = list.filter(s => appBySchool[s.id]?.application_type === filterType)
    }
    return list
  }, [schools, search, filterStatus, filterType, appBySchool])

  const grouped = useMemo(() => {
    const map: Partial<Record<GroupKey, School[]>> = {}
    for (const school of filtered) {
      const appType = appBySchool[school.id]?.application_type
      const key = getGroup(school, appType)
      if (!map[key]) map[key] = []
      map[key]!.push(school)
    }
    for (const key of GROUP_ORDER) {
      if (!map[key]) continue
      map[key]!.sort((a, b) => sortBy === 'name'
        ? a.name.localeCompare(b.name)
        : getDeadlineSort(a, appBySchool[a.id]?.application_type).localeCompare(getDeadlineSort(b, appBySchool[b.id]?.application_type))
      )
    }
    return map
  }, [filtered, appBySchool, sortBy])

  const activeGroups = GROUP_ORDER.filter(k => (grouped[k]?.length ?? 0) > 0)
  const drawerApp = drawerSchool ? (appBySchool[drawerSchool.id] ?? null) : null
  const applied = applications.filter(a => a.status !== 'not_started').length

  return (
    <div style={{ color: C.ink }}>

      {/* Title row */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
            My Applications
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
            {applied} in progress · {schools.length} school{schools.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => exportCSV(schools, applications)}
          className="flex-shrink-0 flex items-center gap-2 text-sm rounded-xl px-3.5 py-2 transition-all"
          style={{ color: C.inkMuted, border: `1px solid ${C.border}`, background: C.card }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.ink; (e.currentTarget as HTMLElement).style.borderColor = `rgba(38,63,73,0.22)` }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.inkMuted; (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
          <Download size={13}/> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-2.5 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#267970'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.teal; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
            <Plus size={14}/> Add School
          </button>

          {/* View toggle mobile */}
          <div className="sm:hidden ml-auto flex items-center rounded-lg p-0.5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {(['icon','list'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="p-1.5 rounded-md transition-colors"
                style={{ background: view === v ? C.ink : 'transparent', color: view === v ? C.bgSoft : C.inkFaint }}>
                {v === 'icon' ? <LayoutGrid size={15}/> : <List size={15}/>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ApplicationStatus | '')}
            style={selectStyle}>
            <option value="">All Statuses</option>
            {allStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value as ApplicationType | '')}
            style={selectStyle}>
            <option value="">All Rounds</option>
            {(['EA','REA','ED','RD','Rolling'] as ApplicationType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'deadline')}
            style={selectStyle}>
            <option value="deadline">Sort: Deadline</option>
            <option value="name">Sort: Name</option>
          </select>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }}/>
            <input
              type="text" placeholder="Filter schools…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...selectStyle, paddingLeft: 28, width: 148 }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = C.teal; (e.currentTarget as HTMLInputElement).style.width = '180px' }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLInputElement).style.width = '148px' }}
            />
          </div>

          {/* View toggle desktop */}
          <div className="hidden sm:flex items-center rounded-lg p-0.5 sm:ml-auto"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {(['icon','list'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="p-1.5 rounded-md transition-colors"
                style={{ background: view === v ? C.ink : 'transparent', color: view === v ? C.bgSoft : C.inkFaint }}>
                {v === 'icon' ? <LayoutGrid size={15}/> : <List size={15}/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter result count */}
      {(search || filterStatus || filterType) && (
        <p className="text-sm mb-4" style={{ color: C.inkFaint }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Empty state */}
      {schools.length === 0 && (
        <div className="py-20 text-center rounded-2xl"
          style={{ border: `1.5px dashed ${C.border}`, background: C.card }}>
          <p className="font-medium mb-1" style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong }}>No schools yet</p>
          <p className="text-sm mb-6" style={{ color: C.inkMuted }}>Search from 1,600+ US universities and add them to your tracker</p>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 font-semibold transition-all"
            style={{ background: C.teal, color: 'white' }}>
            <Plus size={14}/> Add your first school
          </button>
        </div>
      )}

      {/* Grouped sections */}
      {activeGroups.length > 0 && (
        <div className="space-y-8">
          {activeGroups.map(groupKey => {
            const groupSchools = grouped[groupKey]!
            const meta = GROUP_META[groupKey]
            return (
              <section key={groupKey}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4 pb-3"
                  style={{ borderBottom: `2px solid ${meta.color}60` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: meta.color }}/>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: meta.color, fontFamily: 'var(--font-sans)' }}>
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: meta.bg, color: meta.color }}>
                    {groupSchools.length}
                  </span>
                </div>

                {/* Card view */}
                {view === 'icon' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupSchools.map(school => (
                      <SchoolCard key={school.id} school={school}
                        application={appBySchool[school.id] ?? null}
                        onOpen={() => setDrawerSchool(school)}
                        onUpdate={fields => updateApplication(school.id, fields)}/>
                    ))}
                  </div>
                )}

                {/* List view */}
                {view === 'list' && (
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: C.card, border: `1px solid rgba(38,63,73,0.18)`, boxShadow: '0 2px 14px rgba(38,63,73,0.10)' }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {['School','Deadline','Notification','Status','Essays','Portal',''].map(h => (
                            <th key={h} className="text-left py-3 px-2 first:pl-4 last:pr-4 text-xs font-semibold uppercase tracking-wider"
                              style={{ color: C.inkFaint }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupSchools.map(school => (
                          <SchoolRow key={school.id} school={school}
                            application={appBySchool[school.id] ?? null}
                            onOpen={() => setDrawerSchool(school)}
                            onUpdate={fields => updateApplication(school.id, fields)}/>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && schools.length > 0 && (
        <div className="py-16 text-center text-sm" style={{ color: C.inkFaint }}>
          No schools match your filters.
        </div>
      )}

      {drawerSchool && (
        <SchoolDrawer school={drawerSchool} application={drawerApp}
          onClose={() => setDrawerSchool(null)}
          onUpdate={() => { refresh(); setDrawerSchool(null) }}
          onRemove={() => { setDrawerSchool(null); refreshAll() }}/>
      )}

      {showAddModal && (
        <AddSchoolModal existingSchoolIds={existingSchoolIds} onAdd={addSchool}
          onClose={() => { setShowAddModal(false); refreshAll() }}/>
      )}
    </div>
  )
}
