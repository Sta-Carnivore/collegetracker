export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlannerClient from './PlannerClient'
import { computePlannerEvents, daysFromNow, type PlannerEvent } from '@/lib/reminders'
import type { Application, School, SchoolRound, SchoolEssay } from '@/types/database'

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applications } = await supabase
    .from('applications').select('*').eq('user_id', user.id)

  const schoolIds = (applications ?? []).map(a => a.school_id)

  // These reference tables may not exist yet (before planner-schema.sql is run);
  // a failed query just yields null → [] and the page still renders.
  const [{ data: schools }, { data: rounds }, { data: essays }, { data: progress }, { data: reminders }] =
    schoolIds.length > 0
      ? await Promise.all([
          supabase.from('schools').select('*').in('id', schoolIds),
          supabase.from('school_rounds').select('*').in('school_id', schoolIds),
          supabase.from('school_essays').select('*').in('school_id', schoolIds),
          supabase.from('user_essay_progress').select('school_essay_id, done').eq('user_id', user.id),
          supabase.from('reminders').select('id, school_id, round, kind, title, due_at, status').eq('user_id', user.id),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const schoolsById: Record<string, School> = {}
  for (const s of (schools ?? []) as School[]) schoolsById[s.id] = s

  const roundsBySchool: Record<string, SchoolRound[]> = {}
  for (const r of (rounds ?? []) as SchoolRound[]) (roundsBySchool[r.school_id] ??= []).push(r)

  const derived = computePlannerEvents({
    applications: (applications ?? []) as Application[],
    schoolsById,
    roundsBySchool,
  })

  // User-created custom events live in `reminders` (kind='custom', no school).
  // Load both active and dismissed so dismissed ones can be restored.
  const customEvents: PlannerEvent[] = (reminders ?? [])
    .filter(r => r.kind === 'custom' && r.due_at)
    .map(r => ({
      key: `custom:${r.id}`,
      id: r.id,
      kind: 'deadline' as const,
      schoolId: '',
      schoolName: r.title,
      round: 'Custom',
      dueAt: new Date(r.due_at).toISOString(),
      daysUntil: daysFromNow(new Date(r.due_at)),
      verified: false,
      sourceYear: null,
      custom: true,
    }))

  const events = [...derived, ...customEvents].sort((a, b) => a.dueAt.localeCompare(b.dueAt))

  // Essays grouped by school, with the user's done state merged in.
  const doneByEssay: Record<string, boolean> = {}
  for (const p of progress ?? []) doneByEssay[p.school_essay_id] = p.done
  const essaysBySchool = Object.values(
    ((essays ?? []) as SchoolEssay[]).reduce((acc, e) => {
      const s = schoolsById[e.school_id]
      if (!s) return acc
      ;(acc[e.school_id] ??= { schoolId: e.school_id, schoolName: s.name, essays: [] }).essays.push({
        id: e.id,
        prompt: e.essay_prompt,
        wordLimit: e.word_limit,
        required: e.required,
        group: e.essay_group,
        sourceYear: e.source_year,
        done: doneByEssay[e.id] ?? false,
      })
      return acc
    }, {} as Record<string, { schoolId: string; schoolName: string; essays: { id: string; prompt: string; wordLimit: number | null; required: boolean; group: string | null; sourceYear: string | null; done: boolean }[] }>),
  )

  // Custom events are keyed by their row id; derived events by school:round:kind.
  const dismissedKeys = (reminders ?? [])
    .filter(r => r.status === 'dismissed')
    .map(r => r.kind === 'custom' ? `custom:${r.id}` : `${r.school_id}:${r.round}:${r.kind}`)

  return (
    <PlannerClient
      events={events}
      essaysBySchool={essaysBySchool}
      dismissedKeys={dismissedKeys}
      hasApplications={(applications ?? []).length > 0}
    />
  )
}
