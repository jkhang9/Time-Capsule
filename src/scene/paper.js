import * as THREE from 'three'

// Canvas artwork for the paper things: notebook letter, postcards, polaroid caption.

export const HAND = 'Gaegu, "Comic Sans MS", cursive'
export const MARKER = '"Permanent Marker", "Comic Sans MS", cursive'
const BLOCK = 'Bungee, Impact, "Arial Black", sans-serif'
const SCRIPT = 'Yellowtail, "Brush Script MT", cursive'

export const fontsReady =
  typeof document !== 'undefined' && document.fonts
    ? Promise.all(['40px Gaegu', '40px "Permanent Marker"', '40px Bungee', '40px Yellowtail'].map((f) => document.fonts.load(f).catch(() => {})))
    : Promise.resolve()

export function canvasTexture(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { canvas, texture }
}

export const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()

export function wrapLines(g, text, maxW) {
  const out = []
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (g.measureText(next).width > maxW && line) {
        out.push(line)
        line = word
      } else line = next
    }
    out.push(line)
  }
  return out
}

// fit text into a box by stepping down through [lineSpacing, fontSize] pairs
function fitText(g, text, family, maxW, maxLines, sizes) {
  for (const [sp, fs] of sizes) {
    g.font = `${fs}px ${family}`
    const lines = wrapLines(g, text, maxW)
    if (lines.length <= maxLines(sp)) return { sp, fs, lines }
  }
  const [sp, fs] = sizes[sizes.length - 1]
  g.font = `${fs}px ${family}`
  return { sp, fs, lines: wrapLines(g, text, maxW).slice(0, maxLines(sp)) }
}

const ripAt = (x) => 5 + 9 * (Math.sin(x * 12.9898) * 43758.5453 - Math.floor(Math.sin(x * 12.9898) * 43758.5453))

// spiral-notebook rip along the top edge; mirrored for the back of the sheet
function rip(g, W, mirror) {
  g.globalCompositeOperation = 'destination-out'
  g.beginPath()
  g.moveTo(0, 0)
  for (let x = 0; x <= W; x += 10) g.lineTo(x, ripAt(mirror ? W - x : x))
  g.lineTo(W, 0)
  g.closePath()
  g.fill()
  for (let x = 34; x < W; x += 58) {
    g.beginPath()
    g.arc(mirror ? W - x : x, 30, 11, 0, Math.PI * 2)
    g.fill()
  }
  g.globalCompositeOperation = 'source-over'
}

const LETTER_TOP = 150

export function drawLetter(c, { text, from }) {
  const g = c.getContext('2d')
  const W = c.width
  const H = c.height
  g.clearRect(0, 0, W, H)
  g.fillStyle = '#fdfaf0'
  g.fillRect(0, 0, W, H)

  const sign = from ? `love, ${from}` : ''
  const fit = fitText(g, text, HAND, W - 175, (sp) => Math.floor((H - LETTER_TOP - 30) / sp) - (sign ? 2 : 0), [
    [56, 44],
    [46, 36],
    [38, 29],
  ])

  g.strokeStyle = 'rgba(90,130,200,0.45)'
  g.lineWidth = 2
  for (let y = LETTER_TOP; y < H - 10; y += fit.sp) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(W, y)
    g.stroke()
  }
  g.strokeStyle = 'rgba(220,80,90,0.6)'
  g.beginPath()
  g.moveTo(118, 60)
  g.lineTo(118, H)
  g.stroke()

  g.fillStyle = '#213a8f'
  g.font = `${fit.fs}px ${HAND}`
  g.textAlign = 'right'
  g.fillText(today(), W - 36, LETTER_TOP - 12)
  g.textAlign = 'left'
  fit.lines.forEach((line, i) => g.fillText(line, 132, LETTER_TOP + fit.sp * (i + 1) - 10))
  if (sign) g.fillText(sign, W * 0.5, LETTER_TOP + fit.sp * (fit.lines.length + 2) - 10)

  rip(g, W, false)
}

// The back of the sheet is drawn mirrored so its holes line up with the front.
// Its lower-right quarter becomes the outside of the folded packet.
export function drawLetterBack(c, from) {
  const g = c.getContext('2d')
  const W = c.width
  const H = c.height
  g.clearRect(0, 0, W, H)
  g.fillStyle = '#f6f1e3'
  g.fillRect(0, 0, W, H)
  g.save()
  g.translate(W * 0.75, H * 0.75)
  g.rotate(-0.12)
  g.fillStyle = '#c4204f'
  g.font = `64px ${MARKER}`
  g.textAlign = 'center'
  g.fillText('open me', 0, -20)
  g.fillStyle = '#213a8f'
  g.font = `44px ${HAND}`
  g.fillText(from ? `(from ${from})` : 'later!!', 0, 50)
  g.restore()
  rip(g, W, true)
}

function border(g, W, H, size = 22) {
  g.strokeStyle = '#fffaf0'
  g.lineWidth = size * 2
  g.strokeRect(0, 0, W, H)
}

function cover(g, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height)
  const iw = img.width * s
  const ih = img.height * s
  g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
}

function greetings(g, W, H, place) {
  const sky = g.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#6cc6e4')
  sky.addColorStop(0.65, '#fff1c1')
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#f59ab3'
  g.beginPath()
  g.moveTo(0, H)
  g.lineTo(0, H * 0.72)
  g.quadraticCurveTo(W * 0.25, H * 0.55, W * 0.5, H * 0.72)
  g.quadraticCurveTo(W * 0.75, H * 0.6, W, H * 0.7)
  g.lineTo(W, H)
  g.fill()

  g.save()
  g.translate(70, 150)
  g.rotate(-0.06)
  g.font = `110px ${SCRIPT}`
  g.lineWidth = 14
  g.strokeStyle = '#fffaf0'
  g.strokeText('Greetings from', 0, 0)
  g.fillStyle = '#e2365b'
  g.fillText('Greetings from', 0, 0)
  g.restore()

  const word = (place || 'our room').toUpperCase()
  let size = 230
  g.font = `${size}px ${BLOCK}`
  while (g.measureText(word).width > W - 110 && size > 60) {
    size -= 8
    g.font = `${size}px ${BLOCK}`
  }
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const y = H * 0.62
  for (let i = 14; i > 0; i -= 2) {
    g.fillStyle = '#5a2340'
    g.fillText(word, W / 2 + i, y + i)
  }
  const fill = g.createLinearGradient(0, y - size / 2, 0, y + size / 2)
  ;['#ffd84a', '#ff9f43', '#ff6b8b', '#a77bff'].forEach((col, i, arr) => {
    fill.addColorStop(i / arr.length, col)
    fill.addColorStop((i + 1) / arr.length - 0.001, col)
  })
  g.lineWidth = 10
  g.strokeStyle = '#fffaf0'
  g.strokeText(word, W / 2, y)
  g.fillStyle = fill
  g.fillText(word, W / 2, y)
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
}

function sunset(g, W, H) {
  const sky = g.createLinearGradient(0, 0, 0, H * 0.66)
  sky.addColorStop(0, '#2d1b54')
  sky.addColorStop(0.55, '#ff5f8f')
  sky.addColorStop(1, '#ffb86b')
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)

  // striped retro sun
  const sun = document.createElement('canvas')
  sun.width = sun.height = 420
  const s = sun.getContext('2d')
  const sg = s.createLinearGradient(0, 0, 0, 420)
  sg.addColorStop(0, '#fff07a')
  sg.addColorStop(1, '#ff5a7a')
  s.fillStyle = sg
  s.beginPath()
  s.arc(210, 210, 200, 0, Math.PI * 2)
  s.fill()
  s.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 7; i++) s.fillRect(0, 230 + i * 28, 420, 6 + i * 2.2)
  g.drawImage(sun, W / 2 - 210, H * 0.66 - 330)

  g.fillStyle = '#3b1f5e'
  g.fillRect(0, H * 0.66, W, H)
  g.strokeStyle = 'rgba(255,170,150,0.55)'
  g.lineWidth = 4
  for (let i = 0; i < 9; i++) {
    const y = H * 0.7 + i * 22
    const half = 160 - i * 14
    g.beginPath()
    g.moveTo(W / 2 - half, y)
    g.lineTo(W / 2 + half, y)
    g.stroke()
  }

  const palm = (x, lean, h) => {
    g.strokeStyle = g.fillStyle = '#170c26'
    g.lineWidth = 16
    g.beginPath()
    g.moveTo(x, H)
    g.quadraticCurveTo(x + lean * 0.3, H - h * 0.6, x + lean, H - h)
    g.stroke()
    const tx = x + lean
    const ty = H - h
    for (const a of [-2.7, -2.1, -1.4, -0.7, -0.15, 0.5]) {
      g.beginPath()
      g.moveTo(tx, ty)
      g.quadraticCurveTo(tx + Math.cos(a) * 80, ty + Math.sin(a) * 80 - 30, tx + Math.cos(a) * 150, ty + Math.sin(a) * 150 + 40)
      g.quadraticCurveTo(tx + Math.cos(a) * 70, ty + Math.sin(a) * 70 + 4, tx, ty)
      g.fill()
    }
  }
  palm(120, 70, 520)
  palm(W - 140, -90, 470)

  g.save()
  g.translate(W / 2, H * 0.24)
  g.rotate(-0.05)
  g.textAlign = 'center'
  g.font = `120px ${SCRIPT}`
  g.fillStyle = '#ff3d77'
  g.fillText('wish you were here', 6, 6)
  g.fillStyle = '#fffaf0'
  g.fillText('wish you were here', 0, 0)
  g.restore()
}

function photoFront(g, W, H, image) {
  g.fillStyle = '#2a2230'
  g.fillRect(0, 0, W, H)
  if (image) cover(g, image, 0, 0, W, H)
  else {
    g.fillStyle = '#e8dccb'
    g.font = `60px ${HAND}`
    g.textAlign = 'center'
    g.fillText('(your photo goes here)', W / 2, H / 2)
    g.textAlign = 'left'
  }
  g.save()
  g.translate(60, H - 70)
  g.rotate(-0.05)
  g.font = `110px ${SCRIPT}`
  g.lineWidth = 12
  g.strokeStyle = '#2a1030'
  g.strokeText('hello!', 0, 0)
  g.fillStyle = '#ffe27a'
  g.fillText('hello!', 0, 0)
  g.restore()
}

export function drawPostcardFront(c, { design, place, image }) {
  const g = c.getContext('2d')
  const W = c.width
  const H = c.height
  g.clearRect(0, 0, W, H)
  if (design === 'sunset') sunset(g, W, H)
  else if (design === 'photo') photoFront(g, W, H, image)
  else greetings(g, W, H, place)
  border(g, W, H)
}

function stamp(g, x, y, w, h) {
  const s = document.createElement('canvas')
  s.width = w
  s.height = h
  const k = s.getContext('2d')
  k.fillStyle = '#fffdf6'
  k.fillRect(0, 0, w, h)
  k.globalCompositeOperation = 'destination-out'
  for (let i = 0; i <= w; i += 16) {
    k.beginPath()
    k.arc(i, 0, 6, 0, Math.PI * 2)
    k.arc(i, h, 6, 0, Math.PI * 2)
    k.fill()
  }
  for (let j = 0; j <= h; j += 16) {
    k.beginPath()
    k.arc(0, j, 6, 0, Math.PI * 2)
    k.arc(w, j, 6, 0, Math.PI * 2)
    k.fill()
  }
  k.globalCompositeOperation = 'source-over'
  k.fillStyle = '#ffb3c7'
  k.fillRect(14, 14, w - 28, h - 28)
  k.fillStyle = '#e2365b'
  k.beginPath()
  const cx = w / 2
  const cy = h * 0.46
  const r = w * 0.22
  k.moveTo(cx, cy + r)
  k.bezierCurveTo(cx - r * 1.8, cy - r * 0.2, cx - r * 0.6, cy - r * 1.7, cx, cy - r * 0.5)
  k.bezierCurveTo(cx + r * 0.6, cy - r * 1.7, cx + r * 1.8, cy - r * 0.2, cx, cy + r)
  k.fill()
  k.fillStyle = '#7a1230'
  k.font = '700 20px Arial, sans-serif'
  k.textAlign = 'center'
  k.fillText('FOREVER', cx, h - 30)
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.25)'
  g.shadowBlur = 6
  g.drawImage(s, x, y)
  g.restore()
}

function postmark(g, x, y) {
  g.save()
  g.translate(x, y)
  g.rotate(-0.18)
  g.strokeStyle = g.fillStyle = 'rgba(30,28,60,0.72)'
  g.lineWidth = 5
  g.beginPath()
  g.arc(0, 0, 74, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 2
  g.beginPath()
  g.arc(0, 0, 62, 0, Math.PI * 2)
  g.stroke()
  g.font = '700 20px Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('THE LOCKBOX', 0, -24)
  g.font = '700 24px "Courier New", monospace'
  g.fillText(today().toUpperCase(), 0, 10)
  g.font = '700 16px Arial, sans-serif'
  g.fillText('DESK 1', 0, 38)
  g.lineWidth = 5
  for (let i = 0; i < 4; i++) {
    g.beginPath()
    for (let t = 0; t <= 240; t += 6) g.lineTo(80 + t, -36 + i * 24 + Math.sin(t / 14) * 7)
    g.stroke()
  }
  g.restore()
}

export function drawPostcardBack(c, { message, from, stamped }) {
  const g = c.getContext('2d')
  const W = c.width
  const H = c.height
  const split = W * 0.56
  g.clearRect(0, 0, W, H)
  g.fillStyle = '#fbf5e6'
  g.fillRect(0, 0, W, H)

  g.fillStyle = '#8a7a64'
  g.font = '700 26px Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('P O S T   C A R D', split, 58)
  g.textAlign = 'left'
  g.strokeStyle = '#b9a98f'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(split, 90)
  g.lineTo(split, H - 50)
  g.stroke()

  const sign = from ? `xo ${from}` : ''
  const fit = fitText(g, message || '', HAND, split - 90, (sp) => Math.floor((H - 130) / sp) - (sign ? 1 : 0), [
    [50, 40],
    [42, 33],
    [34, 27],
  ])
  g.fillStyle = '#213a8f'
  fit.lines.forEach((line, i) => g.fillText(line, 50, 120 + fit.sp * i))
  if (sign) g.fillText(sign, 50 + 120, 120 + fit.sp * (fit.lines.length + 0.4))

  g.strokeStyle = '#b9a98f'
  g.lineWidth = 2
  const lines = ['future us', 'c/o the lockbox', 'do not open early']
  lines.forEach((t, i) => {
    const y = 400 + i * 80
    g.beginPath()
    g.moveTo(split + 40, y)
    g.lineTo(W - 50, y)
    g.stroke()
    g.fillStyle = '#3b2f6e'
    g.font = `46px ${HAND}`
    g.fillText(t, split + 56, y - 12)
  })

  const sx = W - 200
  const sy = 50
  if (stamped) {
    stamp(g, sx, sy, 150, 182)
    postmark(g, sx - 30, sy + 120)
  } else {
    g.setLineDash([10, 8])
    g.strokeStyle = '#b9a98f'
    g.strokeRect(sx, sy, 150, 182)
    g.setLineDash([])
    g.fillStyle = '#b9a98f'
    g.font = '700 16px Arial, sans-serif'
    g.textAlign = 'center'
    g.fillText('PLACE', sx + 75, sy + 80)
    g.fillText('STAMP', sx + 75, sy + 102)
    g.fillText('HERE', sx + 75, sy + 124)
    g.textAlign = 'left'
  }
}

export function drawCaption(c, caption) {
  const g = c.getContext('2d')
  const W = c.width
  const H = c.height
  g.clearRect(0, 0, W, H)
  if (!caption) return
  let size = 92
  g.font = `${size}px ${MARKER}`
  while (g.measureText(caption).width > W - 60 && size > 40) {
    size -= 6
    g.font = `${size}px ${MARKER}`
  }
  g.save()
  g.translate(W / 2, H / 2 + size * 0.32)
  g.rotate(-0.025)
  g.textAlign = 'center'
  g.fillStyle = '#1c1c22'
  g.fillText(caption, 0, 0)
  g.restore()
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable image'))
    }
    img.src = url
  })
}

// center-crop to a square canvas, the polaroid's picture area
export function squareCrop(img, size = 768) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  cover(c.getContext('2d'), img, 0, 0, size, size)
  return c
}
