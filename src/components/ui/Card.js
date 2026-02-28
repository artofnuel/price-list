'use client'

import { motion } from 'framer-motion'
import styles from './Card.module.css'

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function Card({
  children,
  className = '',
  onClick,
  hover = false,
  delay = 0,
  animate = true,
  ...rest
}) {
  return (
    <motion.div
      className={[styles.card, hover ? styles.hoverable : '', className].join(' ')}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      initial={animate ? 'hidden' : false}
      animate={animate ? 'visible' : false}
      variants={cardVariants}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
