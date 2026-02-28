'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import styles from './page.module.css'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ profiles: 0, lists: 0 })
  const [recentLists, setRecentLists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setLoading(false); return }

      const [{ count: pCount }, { count: lCount }, { data: recent }] = await Promise.all([
        supabase.from('professional_profiles').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('price_lists').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('price_lists')
          .select('id, title, created_at, is_public, professional_profiles(profession)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      setStats({ profiles: pCount || 0, lists: lCount || 0 })
      setRecentLists(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <PageLoader />

  const firstName = user?.email?.split('@')[0] || 'there'

  return (
    <div className={styles.page}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className={styles.header} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <div>
            <h1 className={styles.greeting}>Hey, {firstName} 👋</h1>
            <p className={styles.sub}>What are we pricing today?</p>
          </div>
          <Link href="/dashboard/generate">
            <Button variant="primary" size="md">✨ Generate Price List</Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div className={styles.statsRow} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.profiles}</span>
            <span className={styles.statLabel}>Profession Profiles</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.lists}</span>
            <span className={styles.statLabel}>Generated Lists</span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            {[
              { icon: '👤', label: 'Add Profession Profile', href: '/dashboard/profiles/new', desc: 'Set up a new professional identity' },
              { icon: '✨', label: 'Generate Pricing', href: '/dashboard/generate', desc: 'Create an AI-powered price list' },
              { icon: '📋', label: 'View Saved Lists', href: '/dashboard/lists', desc: 'Browse and edit your saved lists' },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <Card hover className={styles.actionCard}>
                  <div className={styles.actionIcon}>{a.icon}</div>
                  <div>
                    <div className={styles.actionLabel}>{a.label}</div>
                    <div className={styles.actionDesc}>{a.desc}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Lists */}
        {recentLists.length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Price Lists</h2>
              <Link href="/dashboard/lists" className={styles.viewAll}>View all →</Link>
            </div>
            <div className={styles.listsGrid}>
              {recentLists.map((l) => (
                <Link key={l.id} href={`/dashboard/lists/${l.id}`}>
                  <Card hover className={styles.listCard}>
                    <div className={styles.listTitle}>
                      {l.title} {l.is_public && <span title="Public" className={styles.publicIcon}>🌐</span>}
                    </div>
                    <div className={styles.listMeta}>
                      {l.professional_profiles?.profession} · {new Date(l.created_at).toLocaleDateString()}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
