import styles from './ProgressBar.module.css'

export default function ProgressBar({ progress }) {
  if (!progress) return null
  const { done, total, pct } = progress

  return (
    <div className={styles.wrap}>
      <div className={styles.info}>
        <span className={styles.phase}>
          Fetching 15×1m klines — batch {Math.ceil(done / 50)} of {Math.ceil(total / 50)}
        </span>
        <span className={styles.counter}>
          {done.toLocaleString()} / {total.toLocaleString()} coins
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.pct}>{pct}%</div>
    </div>
  )
}
