'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import useProfileStore from '@/store/profileStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import styles from '../new/page.module.css'

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const markets = ['Budget', 'Standard', 'Premium']

export default function EditProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const { updateProfile, removeProfile } = useProfileStore()
  const { isPremium } = useSubscriptionStore()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    profession: '', experience_years: '', skill_level: 'Intermediate',
    target_market: 'Standard', region: '', servicesRaw: '',
    display_name: '', portfolio_url: '', show_name_publicly: false,
    public_email: '', public_phone: '',
    logo_url: '', brand_color: '#6366f1'
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
          public_email: data.public_email || '',
          public_phone: data.public_phone || '',
          logo_url: data.logo_url || '',
          brand_color: data.brand_color || '#6366f1',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!isPremium) return

    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}-${Math.random()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      update('logo_url', publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload logo. Make sure you have a "profiles" bucket in Supabase.')
    } finally {
      setUploading(false)
    }
  }

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
          public_email: form.public_email.trim() || null,
          public_phone: form.public_phone.trim() || null,
          logo_url: isPremium ? form.logo_url : null,
          brand_color: isPremium ? form.brand_color : null,
        })
        .eq('id', id).select().single()
      if (dbError) throw dbError
      updateProfile(data)
      router.push('/dashboard/profiles')
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this profile? All associated price lists will be deleted.')) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error: dbErr } = await supabase.from('professional_profiles').delete().eq('id', id)
      if (dbErr) throw dbErr
      removeProfile(id)
      router.push('/dashboard/profiles')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
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
          <Input id="region" label="Client's Region" value={form.region} onChange={(e) => update('region', e.target.value)} />
          <Textarea id="services" label="Services (one per line)" value={form.servicesRaw} onChange={(e) => update('servicesRaw', e.target.value)} style={{ minHeight: 120 }} />

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          {/* Premium Branding Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className={styles.label}>Custom Branding (Premium)</p>
              {!isPremium && <Link href="/dashboard/billing" className="text-xs text-indigo-400 hover:underline">Upgrade to unlock</Link>}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="text-sm font-medium text-neutral-400 block mb-2">Business Logo</label>
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo Preview" className="w-12 h-12 rounded object-contain bg-neutral-800 p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center text-neutral-600">Logo</div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors"
                  >
                    {uploading ? 'Uploading...' : form.logo_url ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-400 block mb-2">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_color}
                    onChange={(e) => update('brand_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                  />
                  <span className="text-xs font-mono text-neutral-500 uppercase">{form.brand_color}</span>
                </div>
              </div>
            </div>
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              id="public_email"
              label="Public Email (optional)"
              placeholder="e.g. contact@alex.com"
              type="email"
              value={form.public_email}
              onChange={(e) => update('public_email', e.target.value)}
            />
            <Input
              id="public_phone"
              label="Public Phone (optional)"
              placeholder="e.g. +1 234 567 890"
              value={form.public_phone}
              onChange={(e) => update('public_phone', e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.nav}>
            <Button variant="ghost" size="md" type="button" onClick={() => router.back()}>Cancel</Button>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="ghost" size="md" type="button" loading={deleting} onClick={handleDelete} style={{ color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)' }}>Delete</Button>
              <Button variant="primary" size="md" type="submit" loading={saving} disabled={deleting}>Save Changes</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
