import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE)
const webhookSecret = process.env.NEXT_PUBLIC_STRIPE_WEBH

// Use standard @supabase/supabase-js for service role ops
// This is often more reliable in webhook/service contexts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERV
)

export async function POST(req) {
  console.log('>>> WEBHOOK ENDPOINT TRIGGERED <<<')
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log('--- STRIPE WEBHOOK EVENT ---')
  console.log('Event ID:', event.id)
  console.log('Event Type:', event.type)

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId

      console.log('Checkout Session ID:', session.id)
      console.log('Metadata:', JSON.stringify(session.metadata))
      console.log('User ID from metadata:', userId)

      if (!userId) {
        console.error('CRITICAL: No userId found in session metadata. Cannot update subscription.')
        break
      }

      console.log(`Attempting to upsert subscription for user: ${userId}`)

      // Update subscription in database
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: 'premium',
          provider: 'stripe',
          provider_customer_id: session.customer,
          provider_subscription_id: session.subscription,
          status: 'active',
          current_period_end: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()

      if (error) {
        console.error('Supabase UPSERT error (checkout.session.completed):', JSON.stringify(error))
      } else {
        console.log(`SUCCESS: Updated subscription in DB for user ${userId}. Data:`, JSON.stringify(data))
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object

      console.log('Invoice ID:', invoice.id)
      console.log('Subscription ID from Invoice:', invoice.subscription)

      if (!invoice.subscription) {
        console.log('No subscription associated with this invoice. Skipping.')
        break
      }

      // Fetch the subscription to find the userId
      console.log(`Checking DB for subscription: ${invoice.subscription}`)
      const { data: subData, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('provider_subscription_id', invoice.subscription)
        .single()

      if (fetchError || !subData) {
        console.warn('Subscription not found in DB for invoice update. This might be okay if checkout.session.completed hasn\'t run yet or failed.')
        console.warn('Fetch Error:', JSON.stringify(fetchError))
        break
      }

      console.log(`Updating active status for user: ${subData.user_id}`)
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
        })
        .eq('provider_subscription_id', invoice.subscription)

      if (error) {
        console.error('Supabase UPDATE error (invoice.payment_succeeded):', JSON.stringify(error))
      } else {
        console.log(`SUCCESS: Updated invoice status for user ${subData.user_id}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const deletedSub = event.data.object
      console.log(`Processing deletion for subscription: ${deletedSub.id}`)

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('provider_subscription_id', deletedSub.id)

      if (error) {
        console.error('Supabase DELETE-UPDATE error:', JSON.stringify(error))
      } else {
        console.log(`SUCCESS: Canceled subscription ${deletedSub.id} in DB`)
      }
      break
    }
  }

  console.log('--- END WEBHOOK HANDLING ---')
  return NextResponse.json({ received: true })
}
