import { useState, useMemo } from 'react'
import styles from './CoinTable.module.css'
import { InfoIcon } from './Tooltip'
import { PATTERN_DESCRIPTIONS, METRIC_DESCRIPTIONS, SORT_DESCRIPTIONS } from '../constants/metrics'

const SORTS = [
  { id: 'score',       label: 'Score' },
  { id: 'heat',        label: 'Heat' },
  { id: 'spike_score', label: 'Spike' },
  { id: 'max_range',   label: 'Max Range' },
  { id: 'fading',      label: 'Coolest' },
  { id: 'vol24h',      label: 'Volume 24h' },
]

const PATTERNS = ['all', 'surging', 'ongoing', 'building', 'spiking', 'fading', 'flat']

const PAT_META = {
  surging:  { color: 'var(--cyan)',   bg: 'var(--cyan-dim)'  },
  ongoing:  { color: 'var(--green)',  bg: 'var(--green-dim)' },
  building: { color: 'var(--blue)',   bg: 'var(--blue-dim)'  },
  spiking:  { color: 'var(--amber)',  bg: 'var(--amber-dim)' },
  fading:   { color: 'var(--red)',    bg: 'var(--red-dim)'   },
  flat:     { color: 'var(--text-3)', bg: 'transparent'      },
  unknown:  { color: 'var(--text-3)', bg: 'transparent'      },
}

function fmt(n, d = 2) {
  return typeof n === 'number' ? n.toFixed(d) : '—'
}

function fmtVol(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function Sparkbar({ ranges, pattern }) {
  if (!ranges || !ranges.length) return null
  const mx = Math.max(...ranges, 0.001)
  const meta = PAT_META[pattern] || PAT_META.unknown
  const n = ranges.length
  return (
    <div className={styles.spark}>
      {ranges.map((r, i) => (
        <div
          key={i}
          className={styles.sparkBar}
          style={{
            height: `${Math.max(3, (r / mx) * 100)}%`,
            background: i >= n - 3 ? meta.color : 'var(--border-2)',
          }}
          title={`m${i + 1}: ${r.toFixed(3)}%`}
        />
      ))}
    </div>
  )
}

function HeatBadge({ heat }) {
  if (heat == null) return <span className={styles.dim}>—</span>
  let color = 'var(--text-3)'
  if (heat >= 3.0) color = 'var(--cyan)'
  else if (heat >= 2.0) color = 'var(--green)'
  else if (heat >= 1.3) color = 'var(--blue)'
  else if (heat < 0.5) color = 'var(--red)'
  return (
    <span className={styles.mono} style={{ color, fontWeight: heat >= 2 ? 600 : 400 }}>
      {fmt(heat, 1)}×
    </span>
  )
}

export default function CoinTable({ coins }) {
  const [sort, setSort] = useState('score')
  const [patFilter, setPatFilter] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = coins

    if (patFilter !== 'all') list = list.filter(c => c.pattern === patFilter)
    if (query) list = list.filter(c => c.base.toLowerCase().includes(query.toLowerCase()))

    list = [...list].sort((a, b) => {
      if (sort === 'fading')      return a.heat - b.heat
      if (sort === 'score')       return b.score - a.score
      if (sort === 'heat')        return b.heat - a.heat
      if (sort === 'spike_score') return b.spike_score - a.spike_score
      if (sort === 'max_range')   return b.max_range - a.max_range
      if (sort === 'vol24h')      return b.vol24h_usdt - a.vol24h_usdt
      return 0
    })

    return list
  }, [coins, sort, patFilter, query])

  return (
    <div className={styles.wrap}>
      {/* controls */}
      <div className={styles.controls}>
        <div className={styles.sortGroup}>
          {SORTS.map(s => (
            <button
              key={s.id}
              className={`${styles.sortBtn} ${sort === s.id ? styles.active : ''}`}
              onClick={() => setSort(s.id)}
            >
              {s.label}
              {SORT_DESCRIPTIONS[s.id] && (
                <InfoIcon text={SORT_DESCRIPTIONS[s.id]} position="bottom" />
              )}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          {PATTERNS.map(p => {
            const meta = PAT_META[p] || {}
            return (
              <button
                key={p}
                className={`${styles.patBtn} ${patFilter === p ? styles.patActive : ''}`}
                onClick={() => setPatFilter(p)}
                style={patFilter === p && p !== 'all' ? { color: meta.color, borderColor: meta.color, background: meta.bg } : {}}
              >
                {p}
                {p !== 'all' && PATTERN_DESCRIPTIONS[p] && (
                  <InfoIcon text={PATTERN_DESCRIPTIONS[p]} position="bottom" />
                )}
              </button>
            )
          })}
          <input
            className={styles.search}
            type="text"
            placeholder="Filter coin…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* count */}
      <div className={styles.count}>
        Showing {filtered.length.toLocaleString()} of {coins.length.toLocaleString()} coins
      </div>

      {/* header */}
      <div className={styles.header}>
        <span>#</span>
        <span>Coin</span>
        <span>
          Pattern
          <InfoIcon text={METRIC_DESCRIPTIONS.pattern} />
        </span>
        <span className={styles.right}>
          Score
          <InfoIcon text={METRIC_DESCRIPTIONS.score} />
        </span>
        <span>Trend (15 × 1m)</span>
        <span className={styles.right}>
          Heat
          <InfoIcon text={METRIC_DESCRIPTIONS.heat} />
        </span>
        <span className={styles.right}>
          Spike
          <InfoIcon text={METRIC_DESCRIPTIONS.spike_score} />
        </span>
        <span className={styles.right}>
          Max range
          <InfoIcon text={METRIC_DESCRIPTIONS.max_range} />
        </span>
        <span className={styles.right}>
          15m Δ
          <InfoIcon text={METRIC_DESCRIPTIONS.price_change_15m} />
        </span>
        <span className={styles.right}>
          Vol 24h
          <InfoIcon text={METRIC_DESCRIPTIONS.vol24h} />
        </span>
      </div>

      {/* rows */}
      <div className={styles.body}>
        {filtered.slice(0, 300).map((coin, i) => {
          const meta = PAT_META[coin.pattern] || PAT_META.unknown
          const pricePos = coin.price_change_15m >= 0

          return (
            <div key={coin.symbol} className={`${styles.row} ${i === 0 ? styles.top : ''}`}>
              <span className={styles.rank}>{i + 1}</span>

              <div className={styles.coinCell}>
                <span className={styles.base}>{coin.base}</span>
                <span className={styles.price}>{fmt(coin.price, coin.price < 0.1 ? 5 : coin.price < 10 ? 4 : 2)}</span>
              </div>

              <span
                className={styles.pat}
                style={{ color: meta.color, background: meta.bg }}
                title={PATTERN_DESCRIPTIONS[coin.pattern] || coin.pattern}
              >
                {coin.pattern}
              </span>

              <span className={`${styles.mono} ${styles.right} ${styles.scoreVal}`}>
                {fmt(coin.score, 3)}
              </span>

              <div className={styles.trendCell}>
                <Sparkbar ranges={coin.ranges} pattern={coin.pattern} />
              </div>

              <span className={`${styles.right}`}>
                <HeatBadge heat={coin.heat} />
              </span>

              <span className={`${styles.mono} ${styles.right} ${styles.dim}`}>
                {fmt(coin.spike_score, 1)}×
              </span>

              <span className={`${styles.mono} ${styles.right}`}>
                {fmt(coin.max_range, 2)}%
              </span>

              <span className={`${styles.mono} ${styles.right}`}
                style={{ color: pricePos ? 'var(--green)' : 'var(--red)' }}>
                {pricePos ? '+' : ''}{fmt(coin.price_change_15m, 2)}%
              </span>

              <span className={`${styles.mono} ${styles.right} ${styles.dim}`}>
                {fmtVol(coin.vol24h_usdt)}
              </span>
            </div>
          )
        })}

        {filtered.length > 300 && (
          <div className={styles.overflow}>
            Showing top 300 of {filtered.length.toLocaleString()} — use filters to narrow down
          </div>
        )}

        {filtered.length === 0 && (
          <div className={styles.empty}>No coins match the current filters</div>
        )}
      </div>
    </div>
  )
}
