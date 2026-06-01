import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { School, Application } from '@/types/database'

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

  return (
    <DashboardClient
      schools={schools}
      initialApplications={applications}
    />
  )
}
