import { useState } from 'react'
import styles from './Tooltip.module.css'

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className={styles.container}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className={`${styles.tooltip} ${styles[position]}`}>
          {content}
        </span>
      )}
    </span>
  )
}

export function InfoIcon({ text, position = 'top' }) {
  return (
    <Tooltip content={text} position={position}>
      <span className={styles.infoIcon}>ⓘ</span>
    </Tooltip>
  )
}
