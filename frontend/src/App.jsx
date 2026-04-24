import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchInfo, streamScan } from './api'
import InfoBar from './components/InfoBar'
import ProgressBar from './components/ProgressBar'
import StatCards from './components/StatCards'
import CoinTable from './components/CoinTable'
import styles from './App.module.css'

const AUTO_REFRESH_SEC = 60    // re-scan every minute (matches 1m candle interval)

export default function App() {
  const [info, setInfo]         = useState(null)
  const [result, setResult]     = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError]       = useState('')
  const [countdown, setCountdown] = useState(0)

  const stopStreamRef  = useRef(null)
  const countdownTimer = useRef(null)
  const autoTimer      = useRef(null)

  // ── pre-flight info ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchInfo()
      .then(setInfo)
      .catch(e => setError(`Cannot reach backend: ${e.message}. Is uvicorn running on :8000?`))
  }, [])

  // ── countdown ticker ─────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    clearInterval(countdownTimer.current)
    clearTimeout(autoTimer.current)
    setCountdown(AUTO_REFRESH_SEC)

    countdownTimer.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownTimer.current)
          return 0
        }
        return c - 1
      })
    }, 1000)

    autoTimer.current = setTimeout(() => runScan(), AUTO_REFRESH_SEC * 1000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── scan ─────────────────────────────────────────────────────────────────
  const runScan = useCallback(() => {
    if (scanning) return

    // cancel any previous stream
    if (stopStreamRef.current) stopStreamRef.current()

    setScanning(true)
    setProgress({ done: 0, total: info?.total_pairs ?? 1, pct: 0 })
    setError('')

    stopStreamRef.current = streamScan({
      onProgress: (evt) => {
        setProgress(evt)
      },
      onComplete: (data) => {
        setResult(data)
        setScanning(false)
        setProgress(null)
        // refresh info count (pair count can change between scans)
        fetchInfo().then(setInfo).catch(() => {})
        startCountdown()
      },
      onError: (msg) => {
        setError(`Scan error: ${msg}`)
        setScanning(false)
        setProgress(null)
      },
    })
  }, [scanning, info, startCountdown])

  // ── cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (stopStreamRef.current) stopStreamRef.current()
      clearInterval(countdownTimer.current)
      clearTimeout(autoTimer.current)
    }
  }, [])

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>

      {/* ── top bar ── */}
      <header className={styles.header}>
        <div className={styles.title}>
          <span className={styles.dot} />
          Crypto Volatility Scanner
        </div>
        <div className={styles.meta}>
          {result && !scanning && (
            <span className={styles.refreshNote}>
              Next scan in{' '}
              <span className={styles.cd}>{countdown}s</span>
              <button className={styles.scanNow} onClick={runScan}>
                scan now
              </button>
            </span>
          )}
          {result && (
            <span className={styles.timestamp}>
              Last scan: {new Date(result.scanned_at).toLocaleTimeString()}
              &nbsp;·&nbsp;
              {result.total_scanned.toLocaleString()} coins
            </span>
          )}
        </div>
      </header>

      {/* ── info / launch bar ── */}
      <InfoBar info={info} onScan={runScan} scanning={scanning} />

      {/* ── progress bar (visible during scan) ── */}
      {scanning && progress && <ProgressBar progress={progress} />}

      {/* ── error banner ── */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* ── empty state ── */}
      {!result && !scanning && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⬡</div>
          <div className={styles.emptyTitle}>Ready to scan</div>
          <p className={styles.emptyText}>
            {info
              ? `${info.total_pairs.toLocaleString()} coins found on Binance. Hit "Run Full Scan" to fetch 15 × 1m klines for each and rank by volatility.`
              : 'Connecting to backend…'}
          </p>
          {info && (
            <button className={styles.bigScanBtn} onClick={runScan}>
              Run Full Scan
            </button>
          )}
        </div>
      )}

      {/* ── scanning placeholder ── */}
      {scanning && !result && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⬡</div>
          <div className={styles.emptyTitle}>Scanning market…</div>
          <p className={styles.emptyText}>
            Fetching 15×1m klines in batches of 50. Usually takes 5–10 seconds.
          </p>
        </div>
      )}

      {/* ── results ── */}
      {result && (
        <div className={styles.results}>
          <StatCards result={result} />
          <CoinTable coins={result.coins} />
        </div>
      )}

    </div>
  )
}
