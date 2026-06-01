import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id
    const period = session.metadata?.period as 'monthly' | 'quarterly'

    if (userId) {
      await supabaseAdmin.from('users').update({
        is_pro: true,
        stripe_subscription_id: session.subscription as string,
        subscription_period: period,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabaseAdmin.from('users').update({
      is_pro: false,
      stripe_subscription_id: null,
      subscription_period: null,
    }).eq('stripe_customer_id', subscription.customer as string)
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const isActive = subscription.status === 'active'
    await supabaseAdmin.from('users').update({
      is_pro: isActive,
    }).eq('stripe_customer_id', subscription.customer as string)
  }

  return NextResponse.json({ received: true })
}
