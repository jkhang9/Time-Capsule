// All sounds are synthesized, so there are no audio files to ship.
let ctx

export function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const noiseCache = new Map()
function noise(c, seconds) {
  const key = seconds
  if (noiseCache.has(key)) return noiseCache.get(key)
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  noiseCache.set(key, buf)
  return buf
}

function env(c, t, peak, decay) {
  const g = c.createGain()
  g.gain.setValueAtTime(peak, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  return g
}

// chunky deck key going down
export function clunk() {
  const c = audio()
  const t = c.currentTime
  const o = c.createOscillator()
  o.frequency.setValueAtTime(150, t)
  o.frequency.exponentialRampToValueAtTime(50, t + 0.09)
  o.connect(env(c, t, 0.45, 0.12)).connect(c.destination)
  o.start(t)
  o.stop(t + 0.14)
  const n = c.createBufferSource()
  n.buffer = noise(c, 0.1)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2400
  bp.Q.value = 1.4
  n.connect(bp).connect(env(c, t, 0.3, 0.045)).connect(c.destination)
  n.start(t)
}

// steady tape hiss; returns a stop function
export function startHiss(level = 0.02) {
  const c = audio()
  const n = c.createBufferSource()
  n.buffer = noise(c, 2)
  n.loop = true
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 2500
  const g = c.createGain()
  g.gain.value = 0
  g.gain.linearRampToValueAtTime(level, c.currentTime + 0.15)
  n.connect(hp).connect(g).connect(c.destination)
  n.start()
  return () => {
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.1)
    n.stop(c.currentTime + 0.12)
  }
}

// rewind whirr: motor pitch rising then settling
export function whirr(seconds) {
  const c = audio()
  const t = c.currentTime
  const o = c.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(90, t)
  o.frequency.linearRampToValueAtTime(240, t + seconds * 0.7)
  o.frequency.linearRampToValueAtTime(160, t + seconds)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 700
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.08)
  g.gain.setValueAtTime(0.08, t + seconds - 0.08)
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
  o.connect(lp).connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + seconds + 0.02)
}

// plastic scraping through the slot
export function scrape(seconds = 0.4) {
  const c = audio()
  const t = c.currentTime
  const n = c.createBufferSource()
  n.buffer = noise(c, 2)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(900, t)
  bp.frequency.linearRampToValueAtTime(1600, t + seconds)
  bp.Q.value = 2
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
  n.connect(bp).connect(g).connect(c.destination)
  n.start(t)
  n.stop(t + seconds + 0.05)
}

// something landing inside a steel box
export function clank() {
  const c = audio()
  const t = c.currentTime
  for (const [f, a, d] of [[310, 0.22, 0.5], [742, 0.12, 0.35], [1293, 0.07, 0.25], [2017, 0.04, 0.18]]) {
    const o = c.createOscillator()
    o.frequency.value = f
    o.connect(env(c, t, a, d)).connect(c.destination)
    o.start(t)
    o.stop(t + d + 0.02)
  }
  const o = c.createOscillator()
  o.frequency.setValueAtTime(110, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.15)
  o.connect(env(c, t, 0.5, 0.18)).connect(c.destination)
  o.start(t)
  o.stop(t + 0.2)
}

// padlock rattling against the hasp
export function rattle() {
  const c = audio()
  for (let i = 0; i < 5; i++) {
    const t = c.currentTime + i * 0.06 + Math.random() * 0.015
    const n = c.createBufferSource()
    n.buffer = noise(c, 0.1)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200 + Math.random() * 1500
    bp.Q.value = 6
    n.connect(bp).connect(env(c, t, 0.35 - i * 0.05, 0.05)).connect(c.destination)
    n.start(t)
  }
}

// paper being folded or handled: a scatter of tiny crackles
export function crinkle(seconds = 0.35) {
  const c = audio()
  const t0 = c.currentTime
  const count = Math.floor(seconds * 70)
  for (let i = 0; i < count; i++) {
    const t = t0 + Math.random() * seconds
    const n = c.createBufferSource()
    n.buffer = noise(c, 0.1)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800 + Math.random() * 3000
    n.connect(hp).connect(env(c, t, 0.05 + Math.random() * 0.12, 0.006 + Math.random() * 0.02)).connect(c.destination)
    n.start(t)
    n.stop(t + 0.05)
  }
}

// rubber stamp hitting a card on a desk
export function thump() {
  const c = audio()
  const t = c.currentTime
  const o = c.createOscillator()
  o.frequency.setValueAtTime(95, t)
  o.frequency.exponentialRampToValueAtTime(38, t + 0.12)
  o.connect(env(c, t, 0.6, 0.16)).connect(c.destination)
  o.start(t)
  o.stop(t + 0.18)
  const n = c.createBufferSource()
  n.buffer = noise(c, 0.1)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 700
  n.connect(lp).connect(env(c, t, 0.4, 0.06)).connect(c.destination)
  n.start(t)
}

// flapping a polaroid back and forth
export function flap() {
  const c = audio()
  for (let i = 0; i < 4; i++) {
    const t = c.currentTime + i * 0.09
    const n = c.createBufferSource()
    n.buffer = noise(c, 0.1)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900
    bp.Q.value = 0.8
    n.connect(bp).connect(env(c, t, 0.18, 0.06)).connect(c.destination)
    n.start(t)
  }
}
