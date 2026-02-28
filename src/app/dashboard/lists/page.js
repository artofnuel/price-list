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
import usePriceListStore from '@/store/priceListStore'
import styles from './page.module.css'

export default function ListsPage() {
  const { priceLists, setPriceLists, removePriceList } = usePriceListStore()
  const [loading, setLoading] = useState(true)
  const [copyingId, setCopyingId] = useState(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('price_lists')
        .select('*, professional_profiles(profession, skill_level, target_market)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPriceLists(data || [])
      setLoading(false)
    }
    load()
  }, [setPriceLists])

  async function handleDelete(id) {
    if (!confirm('Delete this price list?')) return
    const supabase = createClient()
    await supabase.from('price_lists').delete().eq('id', id)
    removePriceList(id)
  }

  async function handleDuplicate(list) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('price_lists').insert({
      profile_id: list.profile_id,
      user_id: user.id,
      title: `${list.title} (Copy)`,
      generated_data: list.generated_data,
    }).select('*, professional_profiles(profession, skill_level, target_market)').single()
    if (!error && data) {
      setPriceLists([data, ...priceLists])
    }
  }

  function copyLink(id) {
    const url = `${window.location.origin}/price/${id}`
    navigator.clipboard.writeText(url)
    setCopyingId(id)
    setTimeout(() => setCopyingId(null), 2000)
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Saved Price Lists</h1>
          <p className={styles.sub}>{priceLists.length} list{priceLists.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Link href="/dashboard/generate">
          <Button variant="primary" size="md">✨ Generate New</Button>
        </Link>
      </div>

      {priceLists.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No saved price lists"
          description="Generate your first AI price list and save it here for future use."
          cta={{ href: '/dashboard/generate', label: '✨ Generate Now' }}
        />
      ) : (
        <motion.div className={styles.grid} layout>
          <AnimatePresence>
            {priceLists.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                layout
              >
                <Card className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.badges}>
                      {l.is_public && <Badge label="Public" variant="success" />}
                      {l.professional_profiles?.target_market && <Badge label={l.professional_profiles.target_market} />}
                      {l.professional_profiles?.skill_level && <Badge label={l.professional_profiles.skill_level} />}
                    </div>
                    <span className={styles.date}>{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className={styles.listTitle}>{l.title}</h3>
                  <p className={styles.listProf}>{l.professional_profiles?.profession}</p>
                  {l.generated_data?.packages && (
                    <p className={styles.pkgCount}>{l.generated_data.packages.length} packages · {l.generated_data.upsells?.length || 0} upsells</p>
                  )}
                  <div className={styles.actions}>
                    <Link href={`/dashboard/lists/${l.id}`} style={{ flex: 1 }}>
                      <Button variant="primary" size="sm" fullWidth>Open & Edit</Button>
                    </Link>
                    {l.is_public && (
                      <Button variant="ghost" size="sm" onClick={() => copyLink(l.id)}>
                        {copyingId === l.id ? '✓' : '🔗'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(l)}>Duplicate</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(l.id)}>Delete</Button>
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
