import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
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

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('users').update({
      stripe_customer_id: customerId,
    }).eq('id', user.id)
  }

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode,
    success_url: `${origin}/settings?success=true`,
    cancel_url: `${origin}/settings?canceled=true`,
    metadata: {
      supabase_user_id: user.id,
      period,
    },
  })

  return NextResponse.json({ url: session.url })
}
