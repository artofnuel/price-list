'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Select, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import usePriceListStore from '@/store/priceListStore'
import styles from './page.module.css'

function GeneratePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('profileId')

  const { setCurrentList } = usePriceListStore()
  const [profiles, setProfiles] = useState([])
  const [selectedProfileId, setSelectedProfileId] = useState(preselectedId || '')
  const [servicesRaw, setServicesRaw] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [profilesLoading, setProfilesLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setProfilesLoading(false); return }
      const { data } = await supabase.from('professional_profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setProfiles(data || [])
      if (!preselectedId && data?.length > 0) setSelectedProfileId(data[0].id)
      if (preselectedId) {
        const p = data?.find((x) => x.id === preselectedId)
        if (p?.services) setServicesRaw(p.services.join('\n'))
      }
      setProfilesLoading(false)
    }
    load()
  }, [preselectedId])

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)

  async function handleGenerate() {
    if (!selectedProfile) { setError('Select a profile first.'); return }
    setError(''); setResult(null); setSaved(false); setGenerating(true)
    try {
      const services = servicesRaw.split('\n').map((s) => s.trim()).filter(Boolean)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: selectedProfile, services }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Generation failed')
      setResult(json.data)
      setCurrentList(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!result || !selectedProfile) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error: dbError } = await supabase.from('price_lists').insert({
        profile_id: selectedProfile.id,
        user_id: user.id,
        title: result.title,
        generated_data: result,
      }).select().single()
      if (dbError) throw dbError
      setSaved(true)
      router.push(`/dashboard/lists/${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (profilesLoading) return <PageLoader />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI Price Generator</h1>
        <p className={styles.sub}>Select your profile and services — let AI do the rest</p>
      </div>

      {profiles.length === 0 ? (
        <Card className={styles.noProfiles}>
          <p>You need at least one profession profile before generating pricing.</p>
          <Button variant="primary" size="md" onClick={() => router.push('/dashboard/profiles/new')}>
            + Create Profile First
          </Button>
        </Card>
      ) : (
        <div className={styles.layout}>
          {/* Config Panel */}
          <div className={styles.configPanel}>
            <Card>
              <div className={styles.configForm}>
                <Select
                  id="profile-select"
                  label="Profession Profile"
                  value={selectedProfileId}
                  onChange={(e) => {
                    setSelectedProfileId(e.target.value)
                    const p = profiles.find((x) => x.id === e.target.value)
                    if (p?.services) setServicesRaw(p.services.join('\n'))
                  }}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profession} ({p.skill_level} · {p.target_market})
                    </option>
                  ))}
                </Select>

                {selectedProfile && (
                  <motion.div
                    className={styles.profilePreview}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedProfileId}
                  >
                    <div className={styles.previewBadges}>
                      <Badge label={selectedProfile.skill_level} />
                      <Badge label={selectedProfile.target_market} />
                      {selectedProfile.region && <Badge label={selectedProfile.region} />}
                    </div>
                    <p className={styles.previewDetail}>{selectedProfile.experience_years} yr(s) experience</p>
                  </motion.div>
                )}

                <Textarea
                  id="services-input"
                  label="Services to Price (one per line)"
                  placeholder={"Logo Design\nBrand Guidelines\nSocial Media Kit"}
                  value={servicesRaw}
                  onChange={(e) => setServicesRaw(e.target.value)}
                  style={{ minHeight: 140 }}
                />

                {error && <p className={styles.error}>{error}</p>}

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button variant="primary" size="lg" fullWidth loading={generating} onClick={handleGenerate}>
                    {generating ? 'Generating...' : '✨ Generate Price List'}
                  </Button>
                </motion.div>
              </div>
            </Card>
          </div>

          {/* Result Panel */}
          <div className={styles.resultPanel}>
            <AnimatePresence mode="wait">
              {generating && (
                <motion.div
                  key="generating"
                  className={styles.generatingState}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div className={styles.genSpinner} />
                  <p className={styles.genText}>AI is crafting your price list...</p>
                  <p className={styles.genSub}>This usually takes 5–15 seconds</p>
                </motion.div>
              )}

              {!generating && !result && (
                <motion.div
                  key="empty"
                  className={styles.emptyResult}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <span className={styles.emptyIcon}>✨</span>
                  <p>Your generated price list will appear here</p>
                </motion.div>
              )}

              {!generating && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className={styles.resultHeader}>
                    <div>
                      <h2 className={styles.resultTitle}>{result.title}</h2>
                      {result.summary && <p className={styles.resultSummary}>{result.summary}</p>}
                    </div>
                    <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
                      💾 Save List
                    </Button>
                  </div>

                  {/* Packages */}
                  <div className={styles.packages}>
                    {result.packages?.map((pkg, i) => (
                      <motion.div
                        key={pkg.tier}
                        className={styles.package}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className={styles.pkgHeader}>
                          <div>
                            <Badge label={pkg.tier} />
                            <h3 className={styles.pkgName}>{pkg.name}</h3>
                            <p className={styles.pkgDesc}>{pkg.description}</p>
                          </div>
                          <div className={styles.pkgPrice}>{pkg.priceLabel}</div>
                        </div>
                        {pkg.services?.length > 0 && (
                          <ul className={styles.pkgServices}>
                            {pkg.services.map((s) => (
                              <li key={s}><span className={styles.checkmark}>✓</span> {s}</li>
                            ))}
                          </ul>
                        )}
                        {pkg.addons?.length > 0 && (
                          <div className={styles.addons}>
                            <span className={styles.addonsLabel}>Add-ons:</span>
                            {pkg.addons.map((a) => (
                              <span key={a.name} className={styles.addon}>{a.name} <strong>{a.priceLabel}</strong></span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Upsells */}
                  {result.upsells?.length > 0 && (
                    <div className={styles.upsells}>
                      <h3 className={styles.upsellsTitle}>Suggested Upsells</h3>
                      <div className={styles.upsellGrid}>
                        {result.upsells.map((u) => (
                          <div key={u.name} className={styles.upsell}>
                            <div className={styles.upsellName}>{u.name}</div>
                            <div className={styles.upsellDesc}>{u.description}</div>
                            <div className={styles.upsellPrice}>{u.priceLabel}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GeneratePageContent />
    </Suspense>
  )
}
