import * as THREE from 'three'

// Label plane covers x -0.23..0.23, y -0.11..0.135 on the cassette face.
export const LABEL = { w: 0.46, h: 0.245, top: 0.135 }
const W = 920
const H = 490
const toX = (x) => ((x + LABEL.w / 2) / LABEL.w) * W
const toY = (y) => ((LABEL.top - y) / LABEL.h) * H

export function makeLabel() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { canvas, texture }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

export function drawLabel(canvas, name, stripe) {
  const g = canvas.getContext('2d')
  g.clearRect(0, 0, W, H)
  g.globalCompositeOperation = 'source-over'

  // paper
  roundRect(g, 0, 0, W, H, 26)
  g.fillStyle = '#fbf3df'
  g.fill()

  // colored bands, top and bottom
  g.fillStyle = stripe
  g.fillRect(0, 26, W, 30)
  g.fillRect(0, H - 92, W, 56)
  g.fillStyle = 'rgba(255,255,255,0.5)'
  g.fillRect(0, 60, W, 6)

  // side A
  g.fillStyle = '#2b1d16'
  g.font = '900 72px "Arial Black", Arial, sans-serif'
  g.textBaseline = 'alphabetic'
  g.fillText('A', 26, 150)
  g.font = '700 26px Arial, sans-serif'
  g.textAlign = 'right'
  g.fillText('C-90', W - 28, 104)
  g.textAlign = 'left'

  // writing lines
  g.strokeStyle = 'rgba(80,60,40,0.35)'
  g.lineWidth = 2
  for (const y of [152, 196]) {
    g.beginPath()
    g.moveTo(96, y)
    g.lineTo(W - 28, y)
    g.stroke()
  }

  // handwritten name
  g.save()
  g.translate(110, 146)
  g.rotate(-0.025)
  if (name) {
    g.fillStyle = '#1f2a6b'
    g.font = '56px "Permanent Marker", "Comic Sans MS", cursive'
    let size = 56
    while (g.measureText(`from ${name}`).width > W - 160 && size > 28) {
      size -= 4
      g.font = `${size}px "Permanent Marker", "Comic Sans MS", cursive`
    }
    g.fillText(`from ${name}`, 0, 0)
  } else {
    g.fillStyle = 'rgba(80,60,40,0.4)'
    g.font = '40px "Gaegu", "Comic Sans MS", cursive'
    g.fillText('from ________', 0, 0)
  }
  g.restore()

  g.fillStyle = '#fbf3df'
  g.font = '700 24px Arial, sans-serif'
  g.fillText('TYPE I  ·  NORMAL POSITION', 30, H - 54)

  // tape window and hub holes, punched out so the reels show through
  g.globalCompositeOperation = 'destination-out'
  const x0 = toX(-0.165)
  const x1 = toX(0.165)
  const y0 = toY(0.047)
  const y1 = toY(-0.047)
  roundRect(g, x0, y0, x1 - x0, y1 - y0, 40)
  g.fill()
  g.globalCompositeOperation = 'source-over'
  g.strokeStyle = 'rgba(40,25,15,0.5)'
  g.lineWidth = 4
  roundRect(g, x0, y0, x1 - x0, y1 - y0, 40)
  g.stroke()
}
