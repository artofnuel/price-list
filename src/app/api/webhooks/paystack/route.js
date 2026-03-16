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

  console.log('--- PAYSTACK DEBUG INFO ---')
  console.log('Header Signature exists:', !!signature)
  console.log('Secret exists:', !!PAYSTACK_SECRET)
  if (PAYSTACK_SECRET) {
    console.log('Secret (masked):', PAYSTACK_SECRET.substring(0, 8) + '...' + PAYSTACK_SECRET.substring(PAYSTACK_SECRET.length - 4))
  }

  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(payload).digest('hex')

  if (hash !== signature) {
    console.error('CRITICAL: Invalid Paystack signature')
    console.log('Calculated Hash starts with:', hash.substring(0, 10))
    console.log('Received Signature starts with:', signature?.substring(0, 10))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  console.log('--- PAYSTACK WEBHOOK EVENT VERIFIED ---')
  console.log('Event Type:', event.event)

  if (event.event === 'charge.success') {
    const userId = event.data.metadata?.userId

    console.log('Metadata Info:')
    console.log('- User ID:', userId)
    console.log('- Reference:', event.data.reference)
    console.log('- Customer Code:', event.data.customer?.customer_code)

    if (!userId) {
      console.error('CRITICAL: No userId in Paystack metadata. Event metadata:', JSON.stringify(event.data.metadata))
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
