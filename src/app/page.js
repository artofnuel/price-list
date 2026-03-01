'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import useAuthStore from '@/store/authStore'
import styles from './page.module.css'

const features = [
  {
    icon: '✨',
    title: 'AI-Powered Pricing',
    desc: 'Get realistic, market-appropriate pricing generated from your experience level, location, and target client base.',
  },
  {
    icon: '🎯',
    title: 'Multi-Niche Support',
    desc: 'Manage multiple professional identities. Designer by day, consultant by night — keep separate price lists.',
  },
  {
    icon: '📋',
    title: 'Tiered Packages',
    desc: 'Instantly generate Basic, Standard, and Premium packages with add-ons and upsells — ready to send to clients.',
  },
  {
    icon: '✏️',
    title: 'Fully Editable',
    desc: 'AI gives you a starting point, you make it yours. Edit, save, and reuse pricing structures any time.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function LandingPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span>⚡</span>
            <span className={styles.brandName}>PriceForge</span>
          </div>
          <div className={styles.headerActions}>
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <motion.div
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className={styles.heroBadge} variants={itemVariants}>
            AI-Powered Pricing Intelligence
          </motion.div>
          <motion.h1 className={styles.heroTitle} variants={itemVariants}>
            Stop guessing.<br />
            <span className={styles.heroGradient}>Price with confidence.</span>
          </motion.h1>
          <motion.p className={styles.heroDesc} variants={itemVariants}>
            PriceForge uses AI to generate structured, realistic price lists tailored to your profession, experience, and market — in seconds.
          </motion.p>
          <motion.div className={styles.heroCta} variants={itemVariants}>
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="xl">Go to Dashboard →</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button variant="primary" size="xl">Generate My Price List →</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="ghost" size="lg">Sign In</Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.container}>
          <motion.h2
            className={styles.sectionTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Everything you need to price like a pro
          </motion.h2>
          <motion.div
            className={styles.featureGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={containerVariants}
          >
            {features.map((f) => (
              <motion.div key={f.title} className={styles.featureCard} variants={itemVariants}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.container}>
          <motion.div
            className={styles.ctaInner}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={styles.ctaTitle}>Ready to know your worth?</h2>
            <p className={styles.ctaDesc}>Join professionals who price confidently.</p>
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="lg">Go to Dashboard →</Button>
              </Link>
            ) : (
              <Link href="/auth/signup">
                <Button variant="primary" size="lg">Start for Free →</Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 PriceForge. Built for professionals.</p>
      </footer>
    </div>
  )
}
