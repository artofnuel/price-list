'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import axios from 'axios'

export default function BillingPage() {
  const { plan, status, isPremium, renewalDate, provider } = useSubscriptionStore()
  const [loading, setLoading] = useState(false)
  const STRIPE_PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE
  const PAYSTACK_PUBLIC = process.env.NEXT_PUBLIC_PAYSTACK_PUB

  const handleUpgrade = async (gateway) => {
    setLoading(true)
    try {
      const endpoint = gateway === 'stripe' ? '/api/checkout/stripe' : '/api/checkout/paystack'
      const response = await axios.post(endpoint, {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1QxY...', // Expecting this from env
      })
      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to initialize upgrade. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    setLoading(true)
    try {
      await axios.post('/api/checkout/cancel')
      alert('Subscription canceled successfully.')
      window.location.reload()
    } catch (error) {
      console.error('Cancel error:', error)
      alert('Failed to cancel subscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-neutral-400">Manage your plan and payments</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"
        >
          <h2 className="text-xl font-semibold mb-4 text-neutral-200">Current Plan</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${isPremium ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-800 text-neutral-400'
              }`}>
              {plan}
            </span>
            <span className="text-sm text-neutral-500">•</span>
            <span className="text-sm text-neutral-400 capitalize">{status || 'No status'}</span>
          </div>

          <p className="text-4xl font-bold mt-4 mb-2">
            {isPremium ? '$4' : '$0'}
            <span className="text-base font-normal text-neutral-500"> / month</span>
          </p>

          {isPremium && renewalDate && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-neutral-400">
                Next billing date: {new Date(renewalDate).toLocaleDateString()}
              </p>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          )}

          {!isPremium && (
            <div className="mt-6 space-y-4">
              <button
                onClick={() => handleUpgrade('stripe')}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Upgrade with Stripe
              </button>
              <button
                onClick={() => handleUpgrade('paystack')}
                disabled={loading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Upgrade with Paystack
              </button>
            </div>
          )}
        </motion.div>

        {/* Benefits Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"
        >
          <h2 className="text-xl font-semibold mb-4 text-neutral-200">Plan Benefits</h2>
          <ul className="space-y-3">
            {[
              { text: 'Unlimited Profiles', free: false },
              { text: 'Unlimited Price Lists', free: false },
              { text: 'Custom Branding', free: false },
              { text: 'Remove PriceForge Watermark', free: false },
              { text: 'PDF Export', free: false },
              { text: 'Advanced Analytics', free: false },
              { text: 'AI Generation', free: true },
              { text: 'Public Link Sharing', free: true },
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <svg className={`w-5 h-5 ${benefit.free || isPremium ? 'text-green-500' : 'text-neutral-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className={benefit.free || isPremium ? 'text-neutral-200' : 'text-neutral-500'}>
                  {benefit.text}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
