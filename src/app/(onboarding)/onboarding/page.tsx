export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profile?.onboarding_completed === true) redirect('/dashboard')

  return (
    <OnboardingClient
      initialName={profile?.full_name ?? ''}
      initialYear={profile?.graduation_year ?? null}
      initialGpa={profile?.gpa ?? null}
      initialSat={profile?.sat_score ?? null}
      initialAct={profile?.act_score ?? null}
      initialMajors={profile?.intended_majors ?? []}
    />
  )
}
