'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import styles from './page.module.css'

export default function PublicPriceListPage() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchList() {
      try {
        const supabase = createClient()
        const { data, error: sbError } = await supabase
          .from('price_lists')
          .select('*, professional_profiles(id, profession, skill_level, target_market, region)')
          .eq('id', id)
          .maybeSingle()

        if (sbError) throw sbError
        if (!data) {
          throw new Error('This price list is private or could not be found.')
        }

        setList(data)
      } catch (err) {
        console.error('Error fetching public list:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchList()
  }, [id])

  if (loading) return <PageLoader />

  if (error || !list) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <h1>Link Unavailable</h1>
          <p>This price list might be private or doesn't exist.</p>
          <a href="/" className={styles.homeLink}>Go to PriceForge</a>
        </div>
      </div>
    )
  }

  const data = list.generated_data
  const profile = list.professional_profiles

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.brand}>
            <span>⚡</span> PriceForge
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <motion.div 
            className={styles.hero}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.profileMeta}>
              {profile?.target_market && <Badge label={profile.target_market} />}
              {profile?.skill_level && <Badge label={profile.skill_level} />}
              {profile?.profession && <span className={styles.profession}>{profile.profession}</span>}
            </div>
            <h1 className={styles.title}>{data.title}</h1>
            {data.summary && <p className={styles.summary}>{data.summary}</p>}
          </motion.div>

          <div className={styles.packages}>
            {data.packages?.map((pkg, i) => (
              <motion.div
                key={pkg.tier}
                className={styles.package}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.pkgHeader}>
                  <div className={styles.pkgBadge}>{pkg.tier}</div>
                  <h3 className={styles.pkgName}>{pkg.name}</h3>
                  <div className={styles.pkgPrice}>{pkg.priceLabel}</div>
                </div>
                <p className={styles.pkgDesc}>{pkg.description}</p>
                <ul className={styles.pkgServices}>
                  {pkg.services?.map((s) => (
                    <li key={s}>
                      <span className={styles.check}>✓</span> {s}
                    </li>
                  ))}
                </ul>
                {pkg.addons?.length > 0 && (
                  <div className={styles.addons}>
                    <div className={styles.addonsTitle}>Add-ons</div>
                    {pkg.addons.map((a) => (
                      <div key={a.name} className={styles.addon}>
                        <span>{a.name}</span>
                        <span className={styles.addonPrice}>{a.priceLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {data.upsells?.length > 0 && (
            <section className={styles.upsellsSection}>
              <h2 className={styles.sectionTitle}>Stand-alone Services</h2>
              <div className={styles.upsells}>
                {data.upsells.map((u, i) => (
                  <motion.div 
                    key={u.name} 
                    className={styles.upsell}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <div className={styles.upsellName}>{u.name}</div>
                    <p className={styles.upsellDesc}>{u.description}</p>
                    <div className={styles.upsellPrice}>{u.priceLabel}</div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>Generated with AI to reflect market standard pricing.</p>
          <a href="/" className={styles.footerBrand}>
            Powered by <strong>PriceForge</strong>
          </a>
        </div>
      </footer>
    </div>
  )
}
