'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import usePriceListStore from '@/store/priceListStore'
import styles from './page.module.css'

export default function ListEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const { updatePriceLists } = usePriceListStore()

  const [list, setList] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: row } = await supabase
        .from('price_lists')
        .select('*, professional_profiles(profession, skill_level, target_market)')
        .eq('id', id)
        .single()
      if (row) {
        setList(row)
        setIsPublic(row.is_public || false)
        // Deep clone so edits don't mutate original
        setData(JSON.parse(JSON.stringify(row.generated_data)))
      }
      setLoading(false)
    }
    load()
  }, [id])

  function updateTitle(val) { setData((d) => ({ ...d, title: val })) }
  function updateSummary(val) { setData((d) => ({ ...d, summary: val })) }

  function updatePackage(pkgIdx, field, val) {
    setData((d) => {
      const packages = [...d.packages]
      packages[pkgIdx] = { ...packages[pkgIdx], [field]: val }
      return { ...d, packages }
    })
  }

  function updateService(pkgIdx, svcIdx, val) {
    setData((d) => {
      const packages = [...d.packages]
      const services = [...packages[pkgIdx].services]
      services[svcIdx] = val
      packages[pkgIdx] = { ...packages[pkgIdx], services }
      return { ...d, packages }
    })
  }

  function updateAddon(pkgIdx, addonIdx, field, val) {
    setData((d) => {
      const packages = [...d.packages]
      const addons = [...packages[pkgIdx].addons]
      addons[addonIdx] = { ...addons[addonIdx], [field]: val }
      packages[pkgIdx] = { ...packages[pkgIdx], addons }
      return { ...d, packages }
    })
  }

  function updateUpsell(upsellIdx, field, val) {
    setData((d) => {
      const upsells = [...d.upsells]
      upsells[upsellIdx] = { ...upsells[upsellIdx], [field]: val }
      return { ...d, upsells }
    })
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setError('')
    try {
      const supabase = createClient()
      const { data: updated, error: dbErr } = await supabase
        .from('price_lists')
        .update({ 
          title: data.title, 
          generated_data: data,
          is_public: isPublic 
        })
        .eq('id', id)
        .select()
        .single()
      if (dbErr) throw dbErr
      updatePriceLists(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  function copyLink() {
    const url = `${window.location.origin}/price/${id}`
    navigator.clipboard.writeText(url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  if (loading) return <PageLoader />
  if (!list || !data) return <p style={{ padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>List not found.</p>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <button onClick={() => router.back()} className={styles.back}>← Back to Lists</button>
          <div className={styles.meta}>
            {list.professional_profiles?.target_market && <Badge label={list.professional_profiles.target_market} />}
            {list.professional_profiles?.skill_level && <Badge label={list.professional_profiles.skill_level} />}
            <span className={styles.prof}>{list.professional_profiles?.profession}</span>
          </div>
        </div>
        <div className={styles.saveRow}>
          <div className={styles.publicToggle}>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.publicLabel}>{isPublic ? 'Public' : 'Private'}</span>
          </div>

          {isPublic && (
            <Button variant="ghost" size="sm" onClick={copyLink} className={styles.copyBtn}>
              {copying ? '✓ Copied' : '🔗 Copy Link'}
            </Button>
          )}

          {saved && <span className={styles.savedMsg}>✓ Saved!</span>}
          {error && <span className={styles.errorMsg}>{error}</span>}
          <Button variant="primary" size="md" loading={saving} onClick={handleSave}>💾 Save Changes</Button>
        </div>
      </div>

      {/* Title & Summary */}
      <div className={styles.titleSection}>
        <Input id="list-title" label="List Title" value={data.title} onChange={(e) => updateTitle(e.target.value)} />
        <Textarea id="list-summary" label="Summary" value={data.summary || ''} onChange={(e) => updateSummary(e.target.value)} style={{ minHeight: 80 }} />
      </div>

      {/* Packages */}
      <h2 className={styles.sectionTitle}>Pricing Packages</h2>
      <div className={styles.packages}>
        {data.packages?.map((pkg, pkgIdx) => (
          <motion.div
            key={pkgIdx}
            className={styles.package}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pkgIdx * 0.1 }}
          >
            <div className={styles.pkgHeader}>
              <Badge label={pkg.tier} />
              <Input
                id={`pkg-name-${pkgIdx}`}
                label="Package Name"
                value={pkg.name}
                onChange={(e) => updatePackage(pkgIdx, 'name', e.target.value)}
              />
              <Input
                id={`pkg-price-${pkgIdx}`}
                label="Price Label"
                value={pkg.priceLabel}
                onChange={(e) => updatePackage(pkgIdx, 'priceLabel', e.target.value)}
                style={{ maxWidth: 140 }}
              />
            </div>
            <Textarea
              id={`pkg-desc-${pkgIdx}`}
              label="Description"
              value={pkg.description}
              onChange={(e) => updatePackage(pkgIdx, 'description', e.target.value)}
              style={{ minHeight: 72 }}
            />
            <div className={styles.servicesEdit}>
              <label className={styles.miniLabel}>Included Services</label>
              {pkg.services?.map((s, svcIdx) => (
                <Input
                  key={svcIdx}
                  id={`svc-${pkgIdx}-${svcIdx}`}
                  value={s}
                  onChange={(e) => updateService(pkgIdx, svcIdx, e.target.value)}
                  placeholder="Service"
                />
              ))}
            </div>
            {pkg.addons?.length > 0 && (
              <div className={styles.addonsEdit}>
                <label className={styles.miniLabel}>Add-ons</label>
                {pkg.addons.map((a, addonIdx) => (
                  <div key={addonIdx} className={styles.addonRow}>
                    <Input
                      id={`addon-name-${pkgIdx}-${addonIdx}`}
                      value={a.name}
                      onChange={(e) => updateAddon(pkgIdx, addonIdx, 'name', e.target.value)}
                      placeholder="Add-on name"
                    />
                    <Input
                      id={`addon-price-${pkgIdx}-${addonIdx}`}
                      value={a.priceLabel}
                      onChange={(e) => updateAddon(pkgIdx, addonIdx, 'priceLabel', e.target.value)}
                      placeholder="$00"
                      style={{ maxWidth: 120 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Upsells */}
      {data.upsells?.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Upsells</h2>
          <div className={styles.upsellGrid}>
            {data.upsells.map((u, uIdx) => (
              <div key={uIdx} className={styles.upsellCard}>
                <Input id={`u-name-${uIdx}`} label="Name" value={u.name} onChange={(e) => updateUpsell(uIdx, 'name', e.target.value)} />
                <Textarea id={`u-desc-${uIdx}`} label="Description" value={u.description} onChange={(e) => updateUpsell(uIdx, 'description', e.target.value)} style={{ minHeight: 72 }} />
                <Input id={`u-price-${uIdx}`} label="Price" value={u.priceLabel} onChange={(e) => updateUpsell(uIdx, 'priceLabel', e.target.value)} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Save footer */}
      <div className={styles.footer}>
        <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>💾 Save All Changes</Button>
        {saved && <span className={styles.savedMsg}>✓ Changes saved successfully</span>}
      </div>
    </div>
  )
}
