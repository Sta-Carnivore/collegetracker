import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. SERVER-ONLY; never import into a client
// component. Used for admin analytics (reading every user's usage/cost log)
// after the caller has verified isAdminEmail().
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Null-safe variant: returns null if the service-role key isn't configured, so
// admin pages can show a setup notice instead of crashing.
export function tryCreateAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
