'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import axios from 'axios'

export default function BillingPage() {
  const { plan, status, isPremium, renewalDate, provider, loading: storeLoading } = useSubscriptionStore()
  const [loading, setLoading] = useState(false)

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const isActuallyCanceled = status === 'canceled'
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
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            Billing & Subscription
          </h1>
          <p className="text-text-muted mt-2 text-lg">Manage your workspace plan and payment methods</p>
        </div>
        {isPremium && (
          <div className="px-4 py-2 bg-premium/10 border border-premium/20 rounded-full flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActuallyCanceled ? 'bg-red-400' : 'bg-premium animate-pulse'}`} />
            <span className={`text-sm font-semibold uppercase tracking-wider ${isActuallyCanceled ? 'text-red-400' : 'text-premium'}`}>
              {isActuallyCanceled ? 'Canceled' : 'Premium Active'}
            </span>
          </div>
        )}
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Plan Status & Upgrades */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface border border-border p-8 rounded-3xl shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-.39-.07-.75-.17-1.1-.31l.3-.92c.31.11.64.19.97.24.81.12 1.58-.2 1.58-.96 0-.58-.38-.85-1.03-1.12-.96-.4-2.11-.87-2.11-2.22 0-1.04.72-1.89 1.76-2.12V9h2.82v1.89c.31.05.61.12.91.21l-.23.97c-.23-.08-.47-.14-.72-.18-.79-.11-1.47.23-1.47.9 0 .54.38.79 1.07 1.09.96.42 2.07.96 2.07 2.22 0 1.13-.77 1.95-1.85 2.12z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="p-2 bg-primary/10 rounded-xl">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0c.062.398.094.805.094 1.233 0 3.31-2.094 6.184-5.044 7.273a11.956 11.956 0 01-6.906 0C5.094 14.417 3 11.544 3 8.233c0-.428.032-.835.094-1.233M12 22.18V12" />
                </svg>
              </span>
              Current Plan
            </h2>

            <div className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-text">
                  {isPremium ? '$4' : '$0'}
                </span>
                <span className="text-text-muted text-lg font-medium">/ month</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest ${isPremium ? 'bg-premium text-bg' : 'bg-border text-text-muted'}`}>
                  {plan}
                </span>
                {isPremium && (
                  <>
                    <span className="text-border">|</span>
                    <span className="text-sm font-medium text-text-soft capitalize">Via {provider}</span>
                  </>
                )}
              </div>

              {!isPremium && (
                <div className="pt-6 border-t border-border space-y-4">
                  <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">Choose a Payment Gateway</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleUpgrade('stripe')}
                      disabled={loading}
                      className="group flex items-center justify-center gap-3 py-4 bg-[#635BFF] hover:bg-[#534bb3] text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.962 8.885l-3.736.521c-.056.008-.106.033-.14.075-.034.041-.048.094-.04.148l.69 4.838c.008.056.033.106.075.14.041.034.094.048.148.04l3.736-.521c.056-.008.106-.033.14-.075.034-.041.048-.094.04-.148l-.69-4.838c-.008-.056-.033-.106-.075-.14-.041-.034-.094-.048-.148-.04zm-4.322-.505l-.69-4.838c-.008-.056-.033-.106-.075-.14a.208.208 0 00-.148-.04l-3.736.521c-.056.008-.106.033-.14.075-.034.041-.048.094-.04.148l.69 4.838c.008.056.033.106.075.14.041.034.094.048.148.04l3.736-.521c.056-.008.106-.033.14-.075.034-.041.048-.094.04-.148z" />
                      </svg>
                      Stripe
                    </button>
                    <button
                      onClick={() => handleUpgrade('paystack')}
                      disabled={loading}
                      className="group flex items-center justify-center gap-3 py-4 bg-[#09A5DB] hover:bg-[#088ab8] text-white rounded-2xl font-bold text-lg shadow-xl shadow-teal-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" />
                      </svg>
                      Paystack
                    </button>
                  </div>
                </div>
              )}

              {isPremium && renewalDate && (
                <div className="pt-8 border-t border-border space-y-6">
                  <div className="flex items-center justify-between p-4 bg-surface-2/50 rounded-2xl border border-border">
                    <span className="text-text-muted font-medium">
                      {isActuallyCanceled ? 'Access expires on' : 'Next billing date'}
                    </span>
                    <span className={`text-text font-bold ${isActuallyCanceled ? 'text-red-400' : ''}`}>
                      {new Date(renewalDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>

                  {!isActuallyCanceled && (
                    <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                      <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
                      <p className="text-sm text-text-muted mb-4">Once you cancel, you'll lose access to all premium features at the end of your billing cycle.</p>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="w-full py-3 px-6 bg-red-500/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        {loading ? 'Processing Cancellation...' : 'Cancel Subscription'}
                      </button>
                    </div>
                  )}

                  {isActuallyCanceled && (
                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                      <p className="text-sm text-text-soft leading-relaxed">
                        Your subscription has been canceled. You still have full access to all premium features until the end of your current period.
                        <strong> You can resubscribe anytime after the expiry date.</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Benefits & Value Prop */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-2 border border-border p-8 rounded-3xl h-full shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-8 text-text">Plan Features</h2>
            <ul className="space-y-4">
              {[
                { text: 'Unlimited Profiles', prem: true },
                { text: 'Unlimited Price Lists', prem: true },
                { text: 'Custom Branding', prem: true },
                { text: 'Remove PriceForge Watermark', prem: true },
                { text: 'PDF Export', prem: true },
                { text: 'Advanced Analytics', prem: true },
                { text: 'AI Generation', prem: false },
                { text: 'Public Link Sharing', prem: false },
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${benefit.prem ? (isPremium ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted group-hover:bg-primary/20 group-hover:text-primary') : 'bg-accent/20 text-accent'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-semibold ${benefit.prem && !isPremium ? 'text-text-muted group-hover:text-text' : 'text-text'}`}>
                      {benefit.text}
                    </span>
                    {benefit.prem && !isPremium && (
                      <span className="text-[10px] font-bold text-premium uppercase tracking-tighter">Premium Only</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {!isPremium && (
              <div className="mt-12 p-6 bg-linear-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 border-dashed">
                <p className="text-text font-bold mb-2 italic">"The most powerful pricing tool for freelancers and agencies."</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-border border-2 border-bg" />
                    ))}
                  </div>
                  <span className="text-xs text-text-muted font-medium">Joined by 500+ pros</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
