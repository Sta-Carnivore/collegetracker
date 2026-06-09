export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { School, Application, SchoolEssay } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  // null = existing user before onboarding was added; treat as completed
  if (profile?.onboarding_completed === false) redirect('/onboarding')

  const { data: rows } = await supabase
    .from('applications')
    .select('*, schools(*)')
    .eq('user_id', user.id)

  const schools: School[] = []
  const applications: Application[] = []

  for (const row of rows ?? []) {
    const { schools: school, ...app } = row
    if (school) {
      schools.push(school as School)
      applications.push(app as Application)
    }
  }

  // Fetch real essay data so the tracker drawer shows actual prompts with checkboxes.
  const schoolIds = schools.map(s => s.id)
  const [{ data: essayRows }, { data: progressRows }] = schoolIds.length > 0
    ? await Promise.all([
        supabase.from('school_essays').select('*').in('school_id', schoolIds),
        supabase.from('user_essay_progress').select('school_essay_id, done').eq('user_id', user.id),
      ])
    : [{ data: [] }, { data: [] }]

  const essaysBySchool: Record<string, SchoolEssay[]> = {}
  const essayCountBySchool: Record<string, number> = {}
  for (const e of (essayRows ?? []) as SchoolEssay[]) {
    (essaysBySchool[e.school_id] ??= []).push(e)
    essayCountBySchool[e.school_id] = (essayCountBySchool[e.school_id] ?? 0) + 1
  }

  const essayProgress: Record<string, boolean> = {}
  for (const p of progressRows ?? []) {
    essayProgress[(p as { school_essay_id: string; done: boolean }).school_essay_id] =
      (p as { school_essay_id: string; done: boolean }).done
  }

  // Patch schools/applications so the tracker total always reflects school_essays count.
  const patchedSchools: School[] = schools.map(s => ({
    ...s,
    supplemental_essay_count: essayCountBySchool[s.id] ?? s.supplemental_essay_count,
  }))

  const patchedApplications: Application[] = applications.map(a => ({
    ...a,
    supplemental_essays_total: essayCountBySchool[a.school_id] != null
      ? essayCountBySchool[a.school_id]
      : a.supplemental_essays_total,
  }))

  return (
    <DashboardClient
      schools={patchedSchools}
      initialApplications={patchedApplications}
      essaysBySchool={essaysBySchool}
      initialEssayProgress={essayProgress}
    />
  )
}
