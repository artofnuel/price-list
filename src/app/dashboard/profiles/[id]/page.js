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
        .update({ profession: form.profession.trim(), experience_years: parseInt(form.experience_years) || 0,
          skill_level: form.skill_level, target_market: form.target_market,
          region: form.region.trim() || null, services })
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
