'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import useProfileStore from '@/store/profileStore'
import styles from './page.module.css'

export default function ProfilesPage() {
  const { profiles, setProfiles, removeProfile, setActiveProfile } = useProfileStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setProfiles(data || [])
      setLoading(false)
    }
    load()
  }, [setProfiles])

  async function handleDelete(id) {
    if (!confirm('Delete this profile and all its price lists?')) return
    const supabase = createClient()
    await supabase.from('professional_profiles').delete().eq('id', id)
    removeProfile(id)
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Profession Profiles</h1>
          <p className={styles.sub}>Manage your professional identities</p>
        </div>
        <Link href="/dashboard/profiles/new">
          <Button variant="primary" size="md">+ Add Profile</Button>
        </Link>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No profiles yet"
          description="Create your first profession profile to start generating price lists."
          cta={{ href: '/dashboard/profiles/new', label: '+ Add Profile' }}
        />
      ) : (
        <motion.div className={styles.grid} layout>
          <AnimatePresence>
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                layout
              >
                <Card className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.profIcon}>💼</div>
                    <div className={styles.badges}>
                      <Badge label={p.skill_level} />
                      <Badge label={p.target_market} />
                    </div>
                  </div>
                  <h3 className={styles.profession}>{p.profession}</h3>
                  <p className={styles.details}>
                    {p.experience_years} yr{p.experience_years !== 1 ? 's' : ''} experience
                    {p.region ? ` · ${p.region}` : ''}
                  </p>
                  {p.services?.length > 0 && (
                    <div className={styles.services}>
                      {p.services.slice(0, 3).map((s) => (
                        <span key={s} className={styles.serviceTag}>{s}</span>
                      ))}
                      {p.services.length > 3 && (
                        <span className={styles.serviceTag}>+{p.services.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className={styles.actions}>
                    <Link href={`/dashboard/generate?profileId=${p.id}`}>
                      <Button variant="primary" size="sm" onClick={() => setActiveProfile(p)}>
                        ✨ Generate
                      </Button>
                    </Link>
                    <Link href={`/dashboard/profiles/${p.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
