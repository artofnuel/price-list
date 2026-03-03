'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import useProfileStore from '@/store/profileStore'
import styles from './page.module.css'

const STEPS = ['Profession', 'Experience', 'Services', 'Identity', 'Review']

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const markets = ['Budget', 'Standard', 'Premium']

function StepIndicator({ current, steps }) {
  return (
    <div className={styles.steps}>
      {steps.map((s, i) => (
        <div key={s} className={[styles.step, i === current ? styles.stepActive : i < current ? styles.stepDone : ''].join(' ')}>
          <div className={styles.stepDot}>{i < current ? '✓' : i + 1}</div>
          <span className={styles.stepLabel}>{s}</span>
        </div>
      ))}
    </div>
  )
}

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function NewProfilePage() {
  const router = useRouter()
  const addProfile = useProfileStore((s) => s.addProfile)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    profession: '',
    experience_years: '',
    skill_level: 'Intermediate',
    target_market: 'Standard',
    region: '',
    servicesRaw: '',
    display_name: '',
    portfolio_url: '',
    show_name_publicly: false,
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const services = form.servicesRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const { data, error: dbError } = await supabase
        .from('professional_profiles')
        .insert({
          user_id: user.id,
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
        .select()
        .single()

      if (dbError) throw dbError
      addProfile(data)
      router.push('/dashboard/profiles')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Add Profession Profile</h1>
          <p className={styles.sub}>Tell us about your professional background</p>
        </div>

        <StepIndicator current={step} steps={STEPS} />

        <div className={styles.formArea}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className={styles.formStep}>
                <Input id="profession" label="What is your profession?" placeholder="e.g. UI Designer, Web Developer, Photographer" value={form.profession} onChange={(e) => update('profession', e.target.value)} />
                <Select id="market" label="Target Market" value={form.target_market} onChange={(e) => update('target_market', e.target.value)}>
                  {markets.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
                <Input id="region" label="Country / Region (optional)" placeholder="e.g. United States, UK, Nigeria" value={form.region} onChange={(e) => update('region', e.target.value)} />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className={styles.formStep}>
                <Input id="exp" label="Years of Experience" type="number" min="0" max="50" placeholder="e.g. 5" value={form.experience_years} onChange={(e) => update('experience_years', e.target.value)} />
                <div className={styles.skillGroup}>
                  <label className={styles.label}>Skill Level</label>
                  <div className={styles.skillOptions}>
                    {skillLevels.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={[styles.skillOption, form.skill_level === s ? styles.skillSelected : ''].join(' ')}
                        onClick={() => update('skill_level', s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className={styles.formStep}>
                <Textarea
                  id="services"
                  label="Services You Offer (one per line)"
                  placeholder={"Logo Design\nBrand Identity\nUI/UX Design\nFigma Prototyping"}
                  value={form.servicesRaw}
                  onChange={(e) => update('servicesRaw', e.target.value)}
                  style={{ minHeight: 160 }}
                />
                <p className={styles.hint}>Enter each service on a new line. These will be used by the AI to generate pricing.</p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className={styles.formStep}>
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
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className={styles.formStep}>
                <h3 className={styles.reviewTitle}>Profile Summary</h3>
                {[
                  ['Profession', form.profession],
                  ['Experience', `${form.experience_years} year(s)`],
                  ['Skill Level', form.skill_level],
                  ['Target Market', form.target_market],
                  ['Region', form.region || 'Not specified'],
                  ['Services', form.servicesRaw.split('\n').filter(Boolean).join(', ') || 'None'],
                  ['Display Name', form.display_name || 'Not specified'],
                  ['Portfolio', form.portfolio_url || 'Not specified'],
                  ['Public Name', form.show_name_publicly ? 'Yes – will show on public links' : 'No – name is private'],
                ].map(([k, v]) => (
                  <div key={k} className={styles.reviewRow}>
                    <span className={styles.reviewKey}>{k}</span>
                    <span className={styles.reviewVal}>{v}</span>
                  </div>
                ))}
                {error && <p className={styles.error}>{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.nav}>
          {step > 0 && <Button variant="ghost" size="md" onClick={() => setStep((s) => s - 1)}>← Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="md" onClick={() => setStep((s) => s + 1)} disabled={!form.profession && step === 0}>
              Continue →
            </Button>
          ) : (
            <Button variant="primary" size="md" loading={loading} onClick={handleSubmit}>
              Save Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
