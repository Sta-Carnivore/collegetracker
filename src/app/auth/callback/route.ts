import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/tracker'

  if (code) {
    const redirectResponse = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single()

        const destination = profile?.onboarding_completed ? next : '/onboarding'

        if (destination !== next) {
          const onboardingRedirect = NextResponse.redirect(`${origin}${destination}`)
          redirectResponse.cookies.getAll().forEach(({ name, value }) => {
            onboardingRedirect.cookies.set(name, value, { path: '/' })
          })
          return onboardingRedirect
        }
      }
      return redirectResponse
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
