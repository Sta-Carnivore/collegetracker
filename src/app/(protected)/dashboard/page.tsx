export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import type { Application, School, Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: applications }, { data: profile }] = await Promise.all([
    supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ])

  const schoolIds = (applications ?? []).map((a) => a.school_id)
  const { data: schools } = schoolIds.length > 0
    ? await supabase.from('schools').select('*').in('id', schoolIds)
    : { data: [] }

  return (
    <DashboardClient
      userEmail={user.email ?? ''}
      applications={(applications ?? []) as Application[]}
      schools={(schools ?? []) as School[]}
      profile={(profile ?? null) as Profile | null}
    />
  )
}
