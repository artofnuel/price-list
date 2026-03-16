'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import usePriceListStore from '@/store/priceListStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import styles from './page.module.css'
import publicStyles from '@/app/price/[id]/page.module.css'

export default function ListEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const { updatePriceLists, removePriceList } = usePriceListStore()
  const { isPremium } = useSubscriptionStore()

  const [list, setList] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [copying, setCopying] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [exporting, setExporting] = useState(false)

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

  // Auto-save the is_public toggle immediately on change
  const handleTogglePublic = useCallback(async (newValue) => {
    setIsPublic(newValue)
    setAutoSaving(true)
    setAutoSaved(false)
    try {
      const supabase = createClient()
      const { data: updated, error: dbErr } = await supabase
        .from('price_lists')
        .update({ is_public: newValue })
        .eq('id', id)
        .select()
        .single()
      if (dbErr) throw dbErr
      updatePriceLists(updated)
      setAutoSaved(true)
      setTimeout(() => setAutoSaved(false), 3000)
    } catch (err) {
      setError(err.message)
      // Revert the toggle if the save fails
      setIsPublic(!newValue)
    } finally {
      setAutoSaving(false)
    }
  }, [id, updatePriceLists])

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

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this price list?')) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error: dbErr } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', id)
      if (dbErr) throw dbErr
      removePriceList(id)
      router.push('/dashboard/lists')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
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

  const handleExportPDF = async () => {
    setExporting(true)
    await new Promise(resolve => setTimeout(resolve, 100)) // ensure layout is ready

    const element = document.getElementById('export-template')
    if (!element) {
      setExporting(false)
      return
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.8)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST')

      // Make portfolio link interactive
      const linkEl = element.querySelector(`.${publicStyles.portfolioLink}`)
      if (linkEl) {
        const containerRect = element.getBoundingClientRect()
        const linkRect = linkEl.getBoundingClientRect()
        const scale = 1.5 // matches html2canvas scale

        pdf.link(
          (linkRect.left - containerRect.left) * scale,
          (linkRect.top - containerRect.top) * scale,
          linkRect.width * scale,
          linkRect.height * scale,
          { url: linkEl.href }
        )
      }

      pdf.save(`${data.title.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('PDF Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  function copyLink() {
    const url = `${window?.location.origin}/price/${id}`
    navigator.clipboard.writeText(url)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  if (loading) return <PageLoader />
  if (!list || !data) return <p style={{ padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>List not found.</p>

  const profile = list.professional_profiles
  const showName = profile?.show_name_publicly && profile?.display_name
  const hasPortfolio = !!profile?.portfolio_url

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
                onChange={(e) => handleTogglePublic(e.target.checked)}
                disabled={autoSaving}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.publicLabel}>{isPublic ? 'Public' : 'Private'}</span>
            {autoSaving && <span className={styles.autoSaveMsg}>⏳ Saving…</span>}
            {autoSaved && !autoSaving && <span className={styles.autoSavedMsg}>✓ Visibility saved</span>}
          </div>

          {isPublic && (
            <Button variant="ghost" size="sm" onClick={copyLink} className={styles.copyBtn}>
              {copying ? '✓ Copied' : '🔗 Copy Link'}
            </Button>
          )}
          {isPremium && (
            <div className="text-xs text-premium bg-white flex justify-center gap-1 items-center p-2 px-3 rounded-full">
              <span>{data.views_count || 0}</span> total views
            </div>
          )}

          {isPremium && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleExportPDF}
              disabled={exporting}
              className="border-neutral-700"
            >
              {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
            </Button>
          )}
          <Button variant="primary" size="md" loading={saving} onClick={handleSave} disabled={deleting}>💾 Save Changes</Button>
          <Button variant="ghost" size="md" loading={deleting} onClick={handleDelete} style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>🗑️ Delete</Button>
        </div>
      </div>

      {/* Public visibility hint banner */}
      {isPublic && (
        <div className={styles.publicBanner}>
          🌐 This price list is <strong>public</strong> — anyone with the link can view it.
          <button className={styles.bannerCopy} onClick={copyLink}>
            {copying ? '✓ Link copied!' : 'Copy shareable link →'}
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div id="price-list-editor">
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
      </div>

      {/* Save footer */}
      <div className={styles.footer}>
        <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>💾 Save All Changes</Button>
        {saved && <span className={styles.savedMsg}>✓ Changes saved successfully</span>}
      </div>

      {/* Hidden Public Layout for Export */}
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
        <div id="export-template" className={`${publicStyles.page} ${publicStyles.exporting}`}>
          <main className={publicStyles.main}>
            <div className={publicStyles.container}>
              <div className={publicStyles.hero}>
                <div className={publicStyles.profileMeta}>
                  {profile?.profession && <span className={publicStyles.profession}>{profile.profession}</span>}
                </div>

                {(showName || hasPortfolio) && (
                  <div className={publicStyles.creatorRow}>
                    {showName && (
                      <div className={publicStyles.creatorName}>
                        <span className={publicStyles.creatorAvatar} style={{ background: isPremium && profile.brand_color ? profile.brand_color : 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                          {profile.display_name.charAt(0).toUpperCase()}
                        </span>
                        <span className={publicStyles.creatorLabel}>{profile.display_name}</span>
                      </div>
                    )}
                    {hasPortfolio && (
                      <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className={publicStyles.portfolioLink}>
                        🌐 Portfolio
                      </a>
                    )}
                    {(profile.public_email || profile.public_phone) && (
                      <div className={publicStyles.contactInfo} style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {profile.public_email && <span className={publicStyles.contactItem}>📧 {profile.public_email}</span>}
                        {profile.public_phone && <span className={publicStyles.contactItem}>📞 {profile.public_phone}</span>}
                      </div>
                    )}
                  </div>
                )}

                <h1 className={publicStyles.title} style={{ color: isPremium && profile?.brand_color ? profile.brand_color : 'inherit' }}>{data.title}</h1>
                {data.summary && <p className={publicStyles.summary}>{data.summary}</p>}
              </div>

              <div className={publicStyles.packages}>
                {data.packages?.map((pkg, i) => (
                  <div
                    key={pkg.tier || i}
                    className={publicStyles.package}
                    style={{ borderLeftColor: isPremium && profile?.brand_color ? profile.brand_color : '#6366f1' }}
                  >
                    <div className={publicStyles.pkgHeader}>
                      <div className={publicStyles.pkgBadge}>{pkg.tier} Pricing Tier</div>
                      <h3 className={publicStyles.pkgName}>{pkg.name}</h3>
                      <div className={publicStyles.pkgPrice}>{pkg.priceLabel}</div>
                    </div>
                    <p className={publicStyles.pkgDesc}>{pkg.description}</p>
                    <ul className={publicStyles.pkgServices}>
                      {pkg.services?.map((s, idx) => (
                        <li key={idx}><span className={publicStyles.check}>✓</span> {s}</li>
                      ))}
                    </ul>
                    {pkg.addons?.length > 0 && (
                      <div className={publicStyles.addons}>
                        <div className={publicStyles.addonsTitle}>Add-ons</div>
                        {pkg.addons.map((a, idx) => (
                          <div key={a.name || idx} className={publicStyles.addon}>
                            <span>{a.name}</span>
                            <span className={publicStyles.addonPrice}>{a.priceLabel}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {data.upsells?.length > 0 && (
                <section className={publicStyles.upsellsSection}>
                  <h2 className={publicStyles.sectionTitle}>Stand-alone Services</h2>
                  <div className={publicStyles.upsellGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                    {data.upsells.map((u, i) => (
                      <div
                        key={u.name || i}
                        className={publicStyles.upsell}
                        style={{ background: '#171717', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #262626' }}
                      >
                        <div className={publicStyles.upsellName} style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{u.name}</div>
                        <p className={publicStyles.upsellDesc} style={{ fontSize: '0.875rem', color: '#a3a3a3', marginBottom: '1rem' }}>{u.description}</p>
                        <div className={publicStyles.upsellPrice} style={{ fontWeight: 700, color: isPremium && profile?.brand_color ? profile.brand_color : '#6366f1' }}>{u.priceLabel}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
