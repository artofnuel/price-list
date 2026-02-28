import styles from './Input.module.css'

export function Input({ label, error, id, ...rest }) {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <input id={id} className={[styles.input, error ? styles.error : ''].join(' ')} {...rest} />
      {error && <span className={styles.hint}>{error}</span>}
    </div>
  )
}

export function Select({ label, error, id, children, ...rest }) {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <select id={id} className={[styles.input, styles.select, error ? styles.error : ''].join(' ')} {...rest}>
        {children}
      </select>
      {error && <span className={styles.hint}>{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, id, ...rest }) {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <textarea id={id} className={[styles.input, styles.textarea, error ? styles.error : ''].join(' ')} {...rest} />
      {error && <span className={styles.hint}>{error}</span>}
    </div>
  )
}
