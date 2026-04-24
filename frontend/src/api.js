/**
 * api.js
 * All communication with the FastAPI backend.
 */

const BASE = '/api'

/** Pre-flight: get coin count + weight budget before scanning. */
export async function fetchInfo() {
  const r = await fetch(`${BASE}/info`)
  if (!r.ok) throw new Error(`/api/info failed: ${r.status}`)
  return r.json()
}

/** Blocking scan — returns full result JSON when done. */
export async function fetchScan() {
  const r = await fetch(`${BASE}/scan`)
  if (!r.ok) throw new Error(`/api/scan failed: ${r.status}`)
  return r.json()
}

/**
 * Streaming scan via Server-Sent Events.
 *
 * onProgress({ done, total, pct })  — called on each batch completion
 * onComplete(data)                  — called with the full result object
 * onError(message)                  — called on failure
 *
 * Returns a cleanup function that aborts the stream.
 */
export function streamScan({ onProgress, onComplete, onError }) {
  const ctrl = new AbortController()

  ;(async () => {
    try {
      const r = await fetch(`${BASE}/scan/stream`, { signal: ctrl.signal })
      if (!r.ok) throw new Error(`/api/scan/stream: ${r.status}`)

      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()   // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const raw = line.slice(5).trim()
          if (!raw) continue

          let event
          try { event = JSON.parse(raw) } catch { continue }

          if (event.type === 'progress' && onProgress) onProgress(event)
          else if (event.type === 'complete' && onComplete) onComplete(event.data)
          else if (event.type === 'error' && onError) onError(event.message)
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError' && onError) onError(e.message)
    }
  })()

  return () => ctrl.abort()
}
