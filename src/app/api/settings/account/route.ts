import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // 1. Remove the user's resume files from the private `resumes` bucket. Storage
  //    objects do NOT cascade on auth-user deletion, so the PII would otherwise
  //    linger. List everything under `${user.id}/` and remove it; also target the
  //    known fixed filenames in case list() returns nothing.
  try {
    const { data: files } = await admin.storage.from('resumes').list(user.id)
    const paths = (files ?? []).map(f => `${user.id}/${f.name}`)
    for (const p of [`${user.id}/resume.pdf`, `${user.id}/resume.docx`]) {
      if (!paths.includes(p)) paths.push(p)
    }
    if (paths.length) await admin.storage.from('resumes').remove(paths)
  } catch (err) {
    console.error('[account delete] storage cleanup failed:', err instanceof Error ? err.message : String(err))
  }

  // 2. Explicitly delete the public bio page + its version/cost history BEFORE
  //    removing the auth user, so a published /u/[slug] page can never outlive the
  //    account even if a FK cascade is misconfigured. (Where cascade IS set, this
  //    is just a harmless no-op done a moment early.)
  for (const table of ['bio_pages', 'bio_page_versions', 'bio_generations'] as const) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id)
    if (error) console.error(`[account delete] ${table} cleanup failed:`, error.message)
  }

  // 3. Delete the auth user. DB tables declared `on delete cascade` against
  //    auth.users (public.users, profiles, applications, reminders,
  //    user_essay_progress) are removed with it.
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account delete]', error.message)
    return NextResponse.json({ error: 'Could not delete your account. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
