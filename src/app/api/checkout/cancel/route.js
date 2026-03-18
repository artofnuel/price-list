import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import axios from 'axios'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET)
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error || !subscription) {
      console.log('No active subscription found for user:', user.id)
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    console.log(`Attempting to cancel ${subscription.provider} subscription: ${subscription.provider_subscription_id}`)

    if (subscription.provider === 'stripe') {
      try {
        // Cancel Stripe
        await stripe.subscriptions.update(subscription.provider_subscription_id, {
          cancel_at_period_end: true,
        })
      } catch (stripeErr) {
        console.error('Stripe cancellation error:', stripeErr.message)
        // We continue anyway to update our DB if the stripe sub is already gone or invalid
      }
    } else if (subscription.provider === 'paystack') {
      // For Paystack, if it's a simple transaction reference (not a real sub), 
      // the disable API will fail. We log it and move on to update our DB.
      try {
        await axios.post(
          'https://api.paystack.co/subscription/disable',
          {
            code: subscription.provider_subscription_id,
            token: 'not_available' 
          },
          {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' }
          }
        )
      } catch (paystackErr) {
        console.warn("Paystack API warning (likely expected for transaction-based 'subs'):", paystackErr.response?.data || paystackErr.message)
      }
    }

    // Always update our local DB to reflect the cancellation
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled'
      })
      .eq('id', subscription.id)
      .eq('user_id', user.id) // Extra safety

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update database', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
