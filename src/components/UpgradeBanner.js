'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSubscriptionStore } from '@/store/subscriptionStore'

export default function UpgradeBanner({ message, className = "" }) {
  const { isPremium } = useSubscriptionStore()

  if (isPremium) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-indigo-600/10 border border-indigo-500/20 overflow-hidden p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-neutral-200">{message || "You've reached your free plan limit."}</p>
          <p className="text-sm text-neutral-400 text-pretty">Upgrade to Premium to unlock unlimited profiles and price lists.</p>
        </div>
      </div>
      
      <Link href="/dashboard/billing" className='flex justify-center items-center h-16 w-[200px] bg-white rounded-xl'>
        <button className="text-bg">
          Upgrade for $4/month
        </button>
      </Link>
    </motion.div>
  )
}
