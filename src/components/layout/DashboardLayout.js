'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className={styles.shell}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚡</span>
          <span className={styles.name}>PriceForge</span>
        </div>
        <button 
          className={styles.toggle}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open Sidebar"
        >
          ☰
        </button>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
