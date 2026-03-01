'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import useAuthStore from '@/store/authStore'
import styles from './Sidebar.module.css'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { href: '/dashboard/profiles', label: 'Profiles', icon: '👤' },
  { href: '/dashboard/generate', label: 'Generate', icon: '✨' },
  { href: '/dashboard/lists', label: 'Saved Lists', icon: '📋' },
]

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/')
  }

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={[styles.sidebar, isOpen ? styles.open : ''].join(' ')}
        initial={false}
        animate={window.innerWidth <= 768 ? (isOpen ? { x: 0 } : { x: '-100%' }) : { x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Brand & Close */}
        <div className={styles.brand}>
          <div className={styles.brandInfo}>
            <span className={styles.logo}>⚡</span>
            <span className={styles.name}>PriceForge</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close Sidebar">
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={[styles.link, isActive ? styles.active : ''].join(' ')}
                onClick={handleLinkClick}
              >
                {isActive && (
                  <motion.div
                    className={styles.indicator}
                    layoutId="navIndicator"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={styles.linkIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout} className={styles.logout}>
          <span>↩</span>
          <span>Sign Out</span>
        </button>
      </motion.aside>
    </>
  )
}
