import styles from './auth.module.css'

export default function AuthLayout({ children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.brand}>
        <span>⚡</span>
        <span className={styles.brandName}>PriceForge</span>
      </div>
      <div className={styles.card}>
        {children}
      </div>
      <div className={styles.orb} />
    </div>
  )
}
