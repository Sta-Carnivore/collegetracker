'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight, Plus, FileText, Globe,
  CalendarRange, Table2, TrendingUp,
} from 'lucide-react'
import { C } from '@/lib/atlas'
import type { Application, School, Profile, ApplicationType } from '@/types/database'

interface Props {
  userEmail: string
  applications: Application[]
  schools: School[]
  profile: Profile | null
}

/* ── Status display ─────────────────────────────────── */
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not started', color: C.inkFaint,  bg: 'rgba(38,63,73,0.06)'  },
  in_progress:  { label: 'In progress', color: C.slate,    bg: C.slateLight            },
  submitted:    { label: 'Submitted',   color: C.plum,     bg: C.palePlum              },
  waiting:      { label: 'Waiting',     color: C.gold,     bg: C.paleGold              },
  deferred:     { label: 'Deferred',    color: '#9A7030',  bg: C.paleGold              },
  accepted:     { label: 'Accepted',    color: C.success,  bg: '#D1EBE0'               },
  rejected:     { label: 'Rejected',    color: C.danger,   bg: '#F5DDD9'               },
  waitlisted:   { label: 'Waitlisted',  color: '#9A7030',  bg: C.paleGold              },
}

const SUBMITTED_STATUSES = new Set(['submitted', 'waiting', 'deferred', 'accepted', 'rejected', 'waitlisted'])

/* ── Deadline helpers ───────────────────────────────── */
function getDeadline(school: School, appType: ApplicationType | null): string | null {
  if (school.deadline_rolling) return null
  if (appType === 'EA' || appType === 'REA') return school.deadline_ea
  if (appType === 'ED') return school.deadline_ed
  return school.deadline_rd ?? school.deadline_ea ?? school.deadline_ed ?? null
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const deadline = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function urgencyColor(days: number): string {
  if (days <= 7) return C.danger
  if (days <= 21) return C.gold
  return C.inkMuted
}

/* ── Main component ─────────────────────────────────── */
export default function DashboardClient({ userEmail, applications, schools, profile }: Props) {
  const [greeting, setGreeting] = useState('Hello')
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  const schoolMap = Object.fromEntries(schools.map(s => [s.id, s]))
  const name = profile?.full_name?.split(' ')[0] ?? userEmail.split('@')[0]

  const total      = applications.length
  const inProgress = applications.filter(a => a.status === 'in_progress').length
  const submitted  = applications.filter(a => SUBMITTED_STATUSES.has(a.status)).length
  const accepted   = applications.filter(a => a.status === 'accepted').length
  const progressPct = total > 0 ? Math.round((submitted / total) * 100) : 0

  const upcoming = applications
    .flatMap(app => {
      const school = schoolMap[app.school_id]
      if (!school) return []
      const dl = getDeadline(school, app.application_type)
      const days = daysUntil(dl)
      if (!days || days <= 0 || SUBMITTED_STATUSES.has(app.status)) return []
      return [{ app, school, dl: dl!, days }]
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)

  const recent = applications.slice(0, 6).flatMap(app => {
    const school = schoolMap[app.school_id]
    return school ? [{ app, school }] : []
  })

  if (total === 0) return <EmptyState name={name} />

  return (
    <div style={{ color: C.ink }}>

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="text-sm mb-1" style={{ color: C.inkMuted }}>{greeting}</p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem,2.5vw,2rem)',
            color: C.inkStrong,
            fontWeight: 600,
            lineHeight: 1.2,
          }}>{name}</h1>
          {profile?.graduation_year && (
            <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>Class of {profile.graduation_year}</p>
          )}
        </div>
        <Link href="/tracker"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: C.teal, color: 'white' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#267970'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.teal; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
          <Plus size={14}/> Add school
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Schools',     value: total,      accent: C.teal    },
          { label: 'In progress', value: inProgress,  accent: C.gold    },
          { label: 'Submitted',   value: submitted,   accent: C.plum    },
          { label: 'Accepted',    value: accepted,    accent: C.success },
        ].map(s => (
          <div key={s.label} className="rounded-2xl px-5 py-4"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: s.accent, lineHeight: 1 }}>
              {s.value}
            </div>
            <div className="mt-1 text-xs" style={{ color: C.inkMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Season progress bar */}
      <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-5"
        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.06)' }}>
        <TrendingUp size={16} style={{ color: C.gold, flexShrink: 0 }}/>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: C.inkMuted }}>Season progress</span>
            <span className="text-xs font-semibold" style={{ color: C.gold }}>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bgSoft }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: `linear-gradient(to right, ${C.teal}, ${C.gold})` }}/>
          </div>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: C.inkFaint }}>
          {submitted} / {total} submitted
        </span>
      </div>

      {/* ── Two-column: Deadlines + Quick links ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Upcoming deadlines */}
        <div className="lg:col-span-3 rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: C.inkStrong, fontFamily: 'var(--font-serif)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.gold }}/>
            Upcoming Deadlines
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: C.inkFaint }}>
              No upcoming deadlines — everything&apos;s submitted ✓
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(({ app, school, dl, days }) => {
                const st = STATUS[app.status] ?? STATUS.not_started
                return (
                  <Link key={app.id} href="/tracker"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                    style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.teal + '44'; (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'translateX(0)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: C.inkStrong }}>{school.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.inkFaint }}>
                        {app.application_type ?? 'RD'} · {fmtDate(dl)}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full flex-shrink-0 font-medium"
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <span className="text-sm font-semibold flex-shrink-0 tabular-nums"
                      style={{ color: urgencyColor(days), minWidth: 36, textAlign: 'right' }}>
                      {days}d
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="lg:col-span-2 flex flex-col gap-2.5">
          {[
            { href: '/tracker',     label: 'Tracker',     desc: `${total} school${total !== 1 ? 's' : ''}`, Icon: Table2,        accent: C.teal  },
            { href: '/resume',      label: 'AI Resume',   desc: profile?.resume_parsed ? 'Profile ready' : 'Upload to start',    Icon: FileText,  accent: C.gold  },
            { href: '/bio',         label: 'Bio Website', desc: 'Generate your site',                        Icon: Globe,         accent: C.plum  },
            { href: '/ai/strategy', label: 'AI Planner',  desc: "Get today's focus",                         Icon: CalendarRange, accent: C.slate },
          ].map(({ href, label, desc, Icon, accent }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.05)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = accent + '55'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(38,63,73,0.1)`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border
                ;(e.currentTarget as HTMLElement).style.transform = 'translateX(0)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(38,63,73,0.05)'
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}18`, color: accent }}>
                <Icon size={15}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: C.inkStrong }}>{label}</div>
                <div className="text-xs" style={{ color: C.inkFaint }}>{desc}</div>
              </div>
              <ArrowRight size={13} style={{ color: C.inkFaint, flexShrink: 0 }}/>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent schools ───────────────────────────── */}
      {recent.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.border}` }}>
            <h2 className="text-sm font-semibold" style={{ color: C.inkStrong, fontFamily: 'var(--font-serif)' }}>Recent Schools</h2>
            <Link href="/tracker" className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: C.teal }}>
              View all <ArrowRight size={11}/>
            </Link>
          </div>
          {recent.map(({ app, school }, i) => {
            const st = STATUS[app.status] ?? STATUS.not_started
            const dl = getDeadline(school, app.application_type)
            const days = daysUntil(dl)
            return (
              <div key={app.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                style={{ borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bgSoft}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: C.inkStrong }}>{school.name}</span>
                </div>
                {app.application_type && (
                  <span className="text-xs px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                    {app.application_type}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                  style={{ background: st.bg, color: st.color }}>{st.label}</span>
                {days !== null && days > 0 && (
                  <span className="text-xs tabular-nums flex-shrink-0"
                    style={{ color: urgencyColor(days), minWidth: 44, textAlign: 'right' }}>
                    {days}d left
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Empty state ────────────────────────────────────── */
function EmptyState({ name }: { name: string }) {
  return (
    <div>
      <div className="mb-10">
        <p className="text-sm mb-1" style={{ color: C.inkMuted }}>Welcome</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem,2.5vw,2rem)', color: C.inkStrong, fontWeight: 600 }}>
          {name}
        </h1>
      </div>

      <div className="rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto"
        style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 4px 32px rgba(38,63,73,0.08)' }}>
        {/* Route dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[C.teal, C.gold, C.plum].map((color, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: color }}/>
              {i < 2 && <div className="w-10 h-px" style={{ background: C.border }}/>}
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: C.inkStrong, fontWeight: 600, marginBottom: '0.75rem' }}>
          Start your application route
        </h2>
        <p className="text-sm leading-relaxed mb-8" style={{ color: C.inkMuted, maxWidth: '30ch', margin: '0 auto 2rem' }}>
          Add schools to your tracker and your season overview will appear here.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/tracker"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#267970'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.teal; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
            <Plus size={14}/> Add schools
          </Link>
          <Link href="/resume"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.inkMuted; (e.currentTarget as HTMLElement).style.color = C.ink }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.inkMuted }}>
            <FileText size={14}/> Upload resume
          </Link>
        </div>
      </div>
    </div>
  )
}
