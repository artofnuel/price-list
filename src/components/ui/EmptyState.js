import Link from 'next/link'
import Button from './Button'
import styles from './EmptyState.module.css'

export default function EmptyState({ icon, title, description, cta }) {
  return (
    <div className={styles.wrapper}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {cta && (
        <Link href={cta.href}>
          <Button variant="primary" size="md">{cta.label}</Button>
        </Link>
      )}
    </div>
  )
}
