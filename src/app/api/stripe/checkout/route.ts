import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { period } = await request.json() as { period: 'monthly' | 'quarterly' | 'bio_onetime' }
  const priceMap: Record<string, string> = {
    monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
    quarterly: process.env.STRIPE_QUARTERLY_PRICE_ID!,
    bio_onetime: process.env.STRIPE_BIO_ONETIME_PRICE_ID!,
  }
  const priceId = priceMap[period]
  const mode = period === 'bio_onetime' ? 'payment' : 'subscription'

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = userData?.stripe_customer_id

  // Create Stripe customer if doesn't exist. Use the admin client to write
  // stripe_customer_id — it's not in the authenticated column grant (users must
  // not be able to set their own customer ID) so the user session would be silently
  // rejected by RLS.
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    const admin = createAdminClient()
    const { error } = await admin.from('users').update({
      stripe_customer_id: customerId,
    }).eq('id', user.id)
    if (error) console.error('[checkout] failed to save stripe_customer_id:', error.message)
  }

  // Prefer the server-configured site URL; only fall back to the (client-controlled)
  // Origin header in dev so a forged Origin can't redirect the post-payment user.
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode,
    success_url: `${origin}/settings?success=${period === 'bio_onetime' ? 'bio' : 'pro'}`,
    cancel_url: `${origin}/settings?canceled=true`,
    metadata: {
      supabase_user_id: user.id,
      period,
    },
  })

  return NextResponse.json({ url: session.url })
}
