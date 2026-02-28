import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  return (
    <div className={styles.wrapper} role="status" aria-label={label}>
      <span className={[styles.spinner, styles[size]].join(' ')} />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className={styles.page}>
      <LoadingSpinner size="lg" />
    </div>
  )
}
