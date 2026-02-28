import styles from './Badge.module.css'

const colorMap = {
  // Market
  Budget: 'budget',
  Standard: 'standard',
  Premium: 'premium',
  // Skill
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
  Expert: 'expert',
  // Tier
  Basic: 'basic',
  // Variants
  success: 'success',
  info: 'info',
  // default
  default: 'default',
}

export default function Badge({ label, variant }) {
  const key = variant || label
  const cls = colorMap[key] || colorMap.default
  return (
    <span className={[styles.badge, styles[cls]].join(' ')}>
      {label}
    </span>
  )
}
