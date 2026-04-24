import styles from './InfoBar.module.css'

export default function InfoBar({ info, onScan, scanning }) {
  if (!info) return (
    <div className={styles.bar}>
      <span className={styles.loading}>Connecting to Binance…</span>
    </div>
  )

  const { total_pairs, estimated_scan_seconds, weight } = info
  const util = weight.utilization_pct

  return (
    <div className={styles.bar}>
      <div className={styles.pills}>
        <Pill label="coins found" value={total_pairs.toLocaleString()} color="blue" />
        <Pill label="weight needed" value={`${weight.total} / ${weight.limit}`} color={weight.safe ? 'green' : 'red'} />
        <Pill label="utilization" value={`${util}%`} color={util < 70 ? 'green' : util < 90 ? 'amber' : 'red'} />
        <Pill label="est. scan time" value={`~${estimated_scan_seconds}s`} color="purple" />
        <Pill label="batch size" value={`${info.batch_size} / wave`} color="blue" />
      </div>

      <button
        className={styles.scanBtn}
        onClick={onScan}
        disabled={scanning}
      >
        {scanning ? 'Scanning…' : 'Run Full Scan'}
      </button>
    </div>
  )
}

function Pill({ label, value, color }) {
  return (
    <div className={`${styles.pill} ${styles[color]}`}>
      <span className={styles.pillLabel}>{label}</span>
      <span className={styles.pillValue}>{value}</span>
    </div>
  )
}
