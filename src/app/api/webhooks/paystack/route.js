import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET

// Use standard @supabase/supabase-js for service role ops
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

export async function POST(req) {
  console.log('>>> PAYSTACK WEBHOOK TRIGGERED <<<')

  const payload = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(payload).digest('hex')

  if (hash !== signature) {
    console.error('CRITICAL: Invalid Paystack signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  console.log('--- PAYSTACK WEBHOOK EVENT ---')
  console.log('Event Type:', event.event)

  if (event.event === 'charge.success') {
    const userId = event.data.metadata?.userId

    console.log(`Processing charge.success for user: ${userId}`)
    console.log('Reference:', event.data.reference)

    if (!userId) {
      console.error('No userId in Paystack metadata')
      return NextResponse.json({ received: true })
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'premium',
        provider: 'paystack',
        provider_customer_id: event.data.customer.customer_code,
        provider_subscription_id: event.data.reference,
        status: 'active',
        current_period_end: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()

    if (error) {
      console.error('Supabase error (Paystack):', JSON.stringify(error))
    } else {
      console.log(`SUCCESS: Updated Paystack subscription for user ${userId}. Data:`, JSON.stringify(data))
    }
  }

  console.log('--- END PAYSTACK WEBHOOK HANDLING ---')
  return NextResponse.json({ received: true })
}
