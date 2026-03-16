'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getCurrencyForRegion } from '@/lib/utils/currency'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import styles from './page.module.css'

export default function PublicPriceListPage() {
  const { id } = useParams()
  const [list, setList] = useState(null)
  const [ownerSubscription, setOwnerSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function fetchList() {
      try {
        const supabase = createClient()
        const { data, error: sbError } = await supabase
          .from('price_lists')
          .select('*, professional_profiles(*)')
          .eq('id', id)
          .maybeSingle()

        if (sbError) throw sbError
        if (!data) {
          throw new Error('This price list is private or could not be found.')
        }

        setList(data)

        // Fetch owner's subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', data.user_id)
          .maybeSingle()

        setOwnerSubscription(subData)

        // Increment view count
        fetch('/api/analytics/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listId: id }),
        }).catch(err => console.error('Failed to increment view:', err))

      } catch (err) {
        console.error('Error fetching public list:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchList()
  }, [id])

  const handleExportPDF = async () => {
    setExporting(true)
    const element = document.getElementById('price-list-content')

    // Add temporary class for perfect PDF layout
    const pageElement = element.closest(`.${styles.page}`)
    pageElement.classList.add(styles.exporting)

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
      const linkEl = element.querySelector(`.${styles.portfolioLink}`)
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

      pdf.save(`${list.title.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('PDF Export failed:', err)
    } finally {
      pageElement.classList.remove(styles.exporting)
      setExporting(false)
    }
  }

  if (loading) return <PageLoader />

  if (error || !list) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <h1>Link Unavailable</h1>
          <p>This price list might be private or doesn&apos;t exist.</p>
          <a href="/" className={styles.homeLink}>Go to PriceForge</a>
        </div>
      </div>
    )
  }

  const data = list.generated_data
  const profile = list.professional_profiles
  const isPremiumOwner = ownerSubscription?.plan_type === 'premium' && ownerSubscription?.status === 'active'

  const showName = profile?.show_name_publicly && profile?.display_name
  const hasPortfolio = !!profile?.portfolio_url

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className="flex justify-between items-center w-full">
            <div className={styles.brand}>
              {isPremiumOwner && profile.logo_url ? (
                <img src={profile.logo_url} alt="Brand Logo" className="h-8 w-auto object-contain" />
              ) : (
                <><span className="mr-2">⚡</span> PriceForge</>
              )}
            </div>
            {isPremiumOwner && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors flex items-center gap-2"
              >
                {exporting ? 'Exporting...' : '📄 Export PDF'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main} id="price-list-content">
        <div className={styles.container}>
          <motion.div
            className={styles.hero}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.profileMeta}>
              {profile?.profession && <span className={styles.profession}>{profile.profession}</span>}
            </div>

            {(showName || hasPortfolio) && (
              <div className={styles.creatorRow}>
                {showName && (
                  <div className='flex justify-center items-center gap-2'>
                    <span className={styles.creatorAvatar} style={{ background: isPremiumOwner && profile.brand_color ? profile.brand_color : 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.creatorLabel}>{profile.display_name}</span>
                    {hasPortfolio && (
                      <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className={styles.portfolioLink}>
                        🌐 Portfolio
                      </a>
                    )}
                  </div>
                )}
                {(profile.public_email || profile.public_phone) && (
                  <div className={styles.contactInfo} style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {profile.public_email && <a href={`mailto:${profile.public_email}`} className={styles.contactItem}>📧 {profile.public_email}</a>}
                    {profile.public_phone && <span className={styles.contactItem}>📞 {profile.public_phone}</span>}
                  </div>
                )}
              </div>
            )}

            <h1 className={styles.title} style={{ color: isPremiumOwner && profile.brand_color ? profile.brand_color : 'inherit' }}>{data.title}</h1>
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
                style={{ borderLeftColor: isPremiumOwner && profile.brand_color ? profile.brand_color : '#6366f1' }}
              >
                <div className={styles.pkgHeader}>
                  <div className={styles.pkgBadge}>{pkg.tier} Pricing Tier</div>
                  <h3 className={styles.pkgName}>{pkg.name}</h3>
                  <div className={styles.pkgPrice}>{pkg.priceLabel}</div>
                </div>
                <p className={styles.pkgDesc}>{pkg.description}</p>
                <ul className={styles.pkgServices}>
                  {pkg.services?.map((s) => (
                    <li key={s}><span className={styles.check}>✓</span> {s}</li>
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
              <div className={styles.upsellGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {data.upsells.map((u, i) => (
                  <motion.div
                    key={u.name}
                    className={styles.upsell}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    style={{ background: '#171717', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #262626' }}
                  >
                    <div className={styles.upsellName} style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{u.name}</div>
                    <p className={styles.upsellDesc} style={{ fontSize: '0.875rem', color: '#a3a3a3', marginBottom: '1rem' }}>{u.description}</p>
                    <div className={styles.upsellPrice} style={{ fontWeight: 700, color: isPremiumOwner && profile.brand_color ? profile.brand_color : '#6366f1' }}>{u.priceLabel}</div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          {isPremiumOwner ? (
            <p className="text-xs text-neutral-500">© {new Date().getFullYear()} {profile.display_name || profile.profession}</p>
          ) : (
            <a href="/" className={styles.footerBrand}>
              Powered by <strong>PriceForge</strong>
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}
