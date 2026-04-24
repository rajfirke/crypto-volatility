import styles from './StatCards.module.css'

const PATTERNS = ['surging', 'ongoing', 'building', 'spiking', 'fading', 'flat']

const PAT_COLOR = {
  surging:  'cyan',
  ongoing:  'green',
  building: 'blue',
  spiking:  'amber',
  fading:   'red',
  flat:     'grey',
}

export default function StatCards({ result }) {
  if (!result) return null

  const { coins, total_scanned, elapsed_seconds, weight } = result

  const counts = PATTERNS.reduce((acc, p) => {
    acc[p] = coins.filter(c => c.pattern === p).length
    return acc
  }, {})

  const top = coins[0]
  const topHeat = [...coins].sort((a, b) => b.heat - a.heat)[0]
  const topRange = [...coins].sort((a, b) => b.max_range - a.max_range)[0]
  const topSpike = [...coins].sort((a, b) => b.spike_score - a.spike_score)[0]

  return (
    <div className={styles.wrap}>
      {/* scan meta */}
      <Card label="coins scanned" value={total_scanned.toLocaleString()} sub={`in ${elapsed_seconds}s`} color="blue" />
      <Card label="weight used" value={`${weight.total}`} sub={`of ${weight.limit} limit`} color={weight.safe ? 'green' : 'red'} />

      {/* pattern breakdown */}
      {PATTERNS.map(p => (
        <Card
          key={p}
          label={p}
          value={counts[p].toLocaleString()}
          sub={`${Math.round(counts[p] / total_scanned * 100)}% of coins`}
          color={PAT_COLOR[p]}
        />
      ))}

      {/* leaders */}
      {top && (
        <Card label="top score" value={top.base} sub={`score ${top.score.toFixed(3)}`} color="green" mono />
      )}
      {topHeat && (
        <Card label="hottest now" value={topHeat.base}
          sub={`${topHeat.heat.toFixed(1)}× heat`} color="cyan" mono />
      )}
      {topRange && (
        <Card label="widest candle" value={topRange.base}
          sub={`${topRange.max_range.toFixed(2)}% range`} color="amber" mono />
      )}
      {topSpike && (
        <Card label="biggest spike" value={topSpike.base}
          sub={`${topSpike.spike_score.toFixed(1)}× spike`} color="red" mono />
      )}
    </div>
  )
}

function Card({ label, value, sub, color, mono }) {
  return (
    <div className={`${styles.card} ${styles[color] || ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${mono ? styles.mono : ''}`}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  )
}
