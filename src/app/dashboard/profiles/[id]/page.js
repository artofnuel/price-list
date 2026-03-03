'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import useProfileStore from '@/store/profileStore'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import styles from '../new/page.module.css'

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const markets = ['Budget', 'Standard', 'Premium']

export default function EditProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    profession: '', experience_years: '', skill_level: 'Intermediate',
    target_market: 'Standard', region: '', servicesRaw: '',
    display_name: '', portfolio_url: '', show_name_publicly: false,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('professional_profiles').select('*').eq('id', id).single()
      if (data) {
        setForm({
          profession: data.profession || '',
          experience_years: String(data.experience_years || ''),
          skill_level: data.skill_level || 'Intermediate',
          target_market: data.target_market || 'Standard',
          region: data.region || '',
          servicesRaw: (data.services || []).join('\n'),
          display_name: data.display_name || '',
          portfolio_url: data.portfolio_url || '',
          show_name_publicly: data.show_name_publicly || false,
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const services = form.servicesRaw.split('\n').map((s) => s.trim()).filter(Boolean)
      const { data, error: dbError } = await supabase
        .from('professional_profiles')
        .update({
          profession: form.profession.trim(),
          experience_years: parseInt(form.experience_years) || 0,
          skill_level: form.skill_level,
          target_market: form.target_market,
          region: form.region.trim() || null,
          services,
          display_name: form.display_name.trim() || null,
          portfolio_url: form.portfolio_url.trim() || null,
          show_name_publicly: form.show_name_publicly,
        })
        .eq('id', id).select().single()
      if (dbError) throw dbError
      updateProfile(data)
      router.push('/dashboard/profiles')
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Edit Profile</h1>
          <p className={styles.sub}>Update your professional details</p>
        </div>
        <form onSubmit={handleSave} className={styles.formArea} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <Input id="profession" label="Profession" value={form.profession} onChange={(e) => update('profession', e.target.value)} required />
          <Input id="exp" label="Years of Experience" type="number" min="0" value={form.experience_years} onChange={(e) => update('experience_years', e.target.value)} />
          <div className={styles.skillGroup}>
            <label className={styles.label}>Skill Level</label>
            <div className={styles.skillOptions}>
              {skillLevels.map((s) => (
                <button key={s} type="button" className={[styles.skillOption, form.skill_level === s ? styles.skillSelected : ''].join(' ')} onClick={() => update('skill_level', s)}>{s}</button>
              ))}
            </div>
          </div>
          <Select id="market" label="Target Market" value={form.target_market} onChange={(e) => update('target_market', e.target.value)}>
            {markets.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input id="region" label="Country / Region (optional)" value={form.region} onChange={(e) => update('region', e.target.value)} />
          <Textarea id="services" label="Services (one per line)" value={form.servicesRaw} onChange={(e) => update('servicesRaw', e.target.value)} style={{ minHeight: 120 }} />

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <p className={styles.label} style={{ marginBottom: -8 }}>Public Identity</p>

          <Input
            id="display_name"
            label="Your Name (optional)"
            placeholder="e.g. Alex Johnson"
            value={form.display_name}
            onChange={(e) => update('display_name', e.target.value)}
          />
          <Input
            id="portfolio_url"
            label="Portfolio Link (optional)"
            placeholder="e.g. https://alexdesigns.com"
            type="url"
            value={form.portfolio_url}
            onChange={(e) => update('portfolio_url', e.target.value)}
          />
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Show name on public price lists</span>
              <span className={styles.toggleHint}>Your name will be visible to anyone who views your price list link.</span>
            </div>
            <button
              type="button"
              className={[styles.toggleBtn, form.show_name_publicly ? styles.toggleOn : ''].join(' ')}
              onClick={() => update('show_name_publicly', !form.show_name_publicly)}
              aria-label="Toggle name visibility"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.nav}>
            <Button variant="ghost" size="md" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button variant="primary" size="md" type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
