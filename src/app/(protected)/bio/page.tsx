export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BioClient from './BioClient'

export default async function BioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: bioPage }] = await Promise.all([
    supabase.from('profiles')
      .select('full_name, intended_major, intended_majors, resume_parsed, resume_raw_text')
      .eq('user_id', user.id).single(),
    supabase.from('bio_pages')
      .select('slug, published, html, style')
      .eq('user_id', user.id).single(),
  ])

  const resumeParsed = profile?.resume_parsed as any
  const resumeItems: { title: string; description?: string }[] = [
    ...(resumeParsed?.activities ?? []).map((a: any) => ({ title: a.name ?? a.title, description: a.description })),
    ...(resumeParsed?.awards ?? []).map((a: any) => ({ title: a.name })),
    ...(resumeParsed?.work_experience ?? []).map((w: any) => ({ title: `${w.role} @ ${w.company}`, description: w.description })),
  ].filter(i => i.title)

  const major = profile?.intended_major ?? profile?.intended_majors?.[0] ?? ''

  // A resume is "present" if we have raw text or any extracted item. Generation
  // uses the raw text directly, so this — not the structured arrays alone —
  // reflects whether we actually have resume data to work from.
  const hasResume = !!(profile?.resume_raw_text?.trim() || resumeItems.length > 0)

  return (
    <BioClient
      profileName={profile?.full_name ?? ''}
      resumeItems={resumeItems}
      hasResume={hasResume}
      prefillGoal={major ? `Study ${major}` : ''}
      existingSlug={bioPage?.published ? bioPage.slug : null}
      existingHtml={bioPage?.html ?? null}
      existingStyle={(bioPage?.style as any) ?? null}
    />
  )
}
