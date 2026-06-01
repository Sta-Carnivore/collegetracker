import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResumeClient from './ResumeClient'

export default async function ResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('resume_parsed, resume_raw_text')
    .eq('user_id', user.id)
    .single()

  const { data: userData } = await supabase
    .from('users')
    .select('is_pro, ai_resume_calls_this_month')
    .eq('id', user.id)
    .single()

  return (
    <ResumeClient
      initialParsed={profile?.resume_parsed ?? null}
      callsUsed={userData?.ai_resume_calls_this_month ?? 0}
      isPro={userData?.is_pro ?? false}
    />
  )
}
