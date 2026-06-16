export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: userData }, { data: profile }] = await Promise.all([
    supabase.from('users').select('is_pro, subscription_period, ai_resume_calls_this_month, reminder_email_enabled').eq('id', user.id).single(),
    supabase.from('profiles').select('full_name, graduation_year, gpa, sat_score, act_score, intended_majors').eq('user_id', user.id).single(),
  ])

  const provider = (user.app_metadata?.provider as string) ?? 'email'

  return (
    <SettingsClient
      email={user.email!}
      provider={provider}
      isPro={userData?.is_pro ?? false}
      subscriptionPeriod={userData?.subscription_period ?? null}
      resumeCallsUsed={userData?.ai_resume_calls_this_month ?? 0}
      initialReminderEmail={userData?.reminder_email_enabled ?? false}
      initialName={profile?.full_name ?? ''}
      initialYear={profile?.graduation_year ?? null}
      initialGpa={profile?.gpa ?? null}
      initialSat={profile?.sat_score ?? null}
      initialAct={profile?.act_score ?? null}
      initialMajors={profile?.intended_majors ?? []}
    />
  )
}
