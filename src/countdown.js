// Open date comes from ?opens=2027-03-14 (any Date-parsable string); defaults to 30 days out for the demo.
export function getOpensAt() {
  const raw = new URLSearchParams(location.search).get('opens')
  const parsed = raw ? new Date(raw) : null
  if (parsed && !isNaN(parsed)) return parsed
  return new Date(Date.now() + 30 * 24 * 3600 * 1000)
}

const pad = (n, l = 2) => String(n).padStart(l, '0')

export function formatRemaining(ms) {
  if (ms <= 0) return null
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${pad(d, 3)}:${pad(h)}:${pad(m)}:${pad(s % 60)}`
}
