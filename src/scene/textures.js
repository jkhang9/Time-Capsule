import * as THREE from 'three'

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function tex(c, { srgb = true, repeat } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

// seeded rng so the box looks the same on every visit
function rng(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

// scuffed enamel: grayscale roughness map with scratches and worn patches
export function makeScuffMap() {
  const c = canvas(512, 512)
  const g = c.getContext('2d')
  const r = rng(7)
  g.fillStyle = '#9a9a9a'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 2200; i++) {
    const v = 120 + r() * 120
    g.strokeStyle = `rgba(${v},${v},${v},${0.15 + r() * 0.35})`
    g.lineWidth = 0.4 + r() * 1.2
    const x = r() * 512
    const y = r() * 512
    const a = r() * Math.PI
    const l = 4 + r() * 40
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  for (let i = 0; i < 40; i++) {
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 10 + r() * 30)
    grad.addColorStop(0, 'rgba(235,235,235,0.5)')
    grad.addColorStop(1, 'rgba(235,235,235,0)')
    g.save()
    g.translate(r() * 512, r() * 512)
    g.fillStyle = grad
    g.fillRect(-40, -40, 80, 80)
    g.restore()
  }
  return tex(c, { srgb: false })
}

function heart(g, x, y, s) {
  g.beginPath()
  g.moveTo(x, y + s * 0.35)
  g.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.4, y - s, x, y - s * 0.4)
  g.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.4, x, y + s * 0.35)
  g.closePath()
}

function star(g, x, y, R, rr = R * 0.45) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const rad = i % 2 ? rr : R
    g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad)
  }
  g.closePath()
}

function smiley(g, x, y, s) {
  g.beginPath()
  g.arc(x, y, s, 0, Math.PI * 2)
  g.fill()
  g.stroke()
  g.fillStyle = '#2a1a14'
  g.beginPath()
  g.arc(x - s * 0.35, y - s * 0.2, s * 0.1, 0, Math.PI * 2)
  g.arc(x + s * 0.35, y - s * 0.2, s * 0.1, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#2a1a14'
  g.lineWidth = s * 0.09
  g.beginPath()
  g.arc(x, y + s * 0.05, s * 0.5, 0.15 * Math.PI, 0.85 * Math.PI)
  g.stroke()
}

const PALETTE = ['#ff8fb1', '#ffd36e', '#8fd3c8', '#b69cff', '#ff9d6c', '#a8e06f', '#fff3d6']

// transparent sticker sheet for the lid: die-cut stickers with a white border
export function makeStickerMap() {
  const W = 1024
  const H = 640
  const c = canvas(W, H)
  const g = c.getContext('2d')
  const r = rng(42)
  g.lineJoin = 'round'
  const kinds = ['heart', 'star', 'smiley', 'circle']
  for (let i = 0; i < 26; i++) {
    const x = 70 + r() * (W - 140)
    const y = 70 + r() * (H - 140)
    const s = 34 + r() * 36
    const kind = kinds[Math.floor(r() * kinds.length)]
    g.save()
    g.translate(x, y)
    g.rotate((r() - 0.5) * 0.9)
    g.translate(-x, -y)
    g.shadowColor = 'rgba(0,0,0,0.35)'
    g.shadowBlur = 6
    g.shadowOffsetY = 2
    g.fillStyle = PALETTE[Math.floor(r() * PALETTE.length)]
    g.strokeStyle = '#fffaf0'
    g.lineWidth = 9
    if (kind === 'heart') { heart(g, x, y, s); g.stroke(); g.shadowColor = 'transparent'; g.fill() }
    else if (kind === 'star') { star(g, x, y, s); g.stroke(); g.shadowColor = 'transparent'; g.fill() }
    else if (kind === 'circle') { g.beginPath(); g.arc(x, y, s * 0.8, 0, Math.PI * 2); g.stroke(); g.shadowColor = 'transparent'; g.fill() }
    else { smiley(g, x, y, s * 0.85) }
    g.restore()
  }
  // strip of masking tape with a marker title
  g.save()
  g.translate(W / 2, H / 2 + 20)
  g.rotate(-0.06)
  g.fillStyle = 'rgba(244,226,170,0.96)'
  g.shadowColor = 'rgba(0,0,0,0.4)'
  g.shadowBlur = 8
  g.shadowOffsetY = 3
  g.fillRect(-300, -52, 600, 104)
  g.shadowColor = 'transparent'
  g.fillStyle = '#2b1d16'
  g.font = '64px "Permanent Marker", cursive'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('DO NOT OPEN', 0, 4)
  g.restore()
  return tex(c)
}

export function makeWoodMap() {
  const c = canvas(1024, 1024)
  const g = c.getContext('2d')
  const r = rng(11)
  const plank = 128
  for (let i = 0; i < 8; i++) {
    const base = 70 + r() * 25
    g.fillStyle = `rgb(${base + 40},${base + 8},${base - 22})`
    g.fillRect(0, i * plank, 1024, plank)
    for (let k = 0; k < 90; k++) {
      g.strokeStyle = `rgba(40,20,8,${0.04 + r() * 0.1})`
      g.lineWidth = 1 + r() * 2
      const y = i * plank + r() * plank
      g.beginPath()
      g.moveTo(0, y)
      g.bezierCurveTo(300, y + (r() - 0.5) * 8, 700, y + (r() - 0.5) * 8, 1024, y)
      g.stroke()
    }
    g.fillStyle = 'rgba(15,8,3,0.65)'
    g.fillRect(0, i * plank, 1024, 3)
  }
  return tex(c, { repeat: [2, 2] })
}

// LED digits live on a canvas that the timer redraws every tick
export function makeLedCanvas() {
  const c = canvas(512, 160)
  const texture = tex(c)
  return { canvas: c, texture }
}

export function drawLed(c, text, on = true) {
  const g = c.getContext('2d')
  g.fillStyle = '#1a0504'
  g.fillRect(0, 0, c.width, c.height)
  g.font = '700 66px "Courier New", monospace'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = 'rgba(80,10,6,0.55)'
  g.fillText('8'.repeat(text.length).replace(/8/g, (_, i) => (text[i] === ':' ? ':' : '8')), c.width / 2, c.height / 2)
  if (on) {
    g.shadowColor = '#ff2a12'
    g.shadowBlur = 22
    g.fillStyle = '#ff5a3c'
    g.fillText(text, c.width / 2, c.height / 2)
  }
}
