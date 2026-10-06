import { audio, startHiss } from './sfx.js'

export const MAX_SECONDS = 180

function levelOf(analyser, data) {
  analyser.getByteTimeDomainData(data)
  let s = 0
  for (const v of data) {
    const x = (v - 128) / 128
    s += x * x
  }
  return Math.min(1, Math.sqrt(s / data.length) * 4)
}

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
  const c = audio()
  const src = c.createMediaStreamSource(stream)
  const analyser = c.createAnalyser()
  analyser.fftSize = 512
  src.connect(analyser)
  const data = new Uint8Array(analyser.fftSize)
  const rec = new MediaRecorder(stream)
  const chunks = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  rec.start(250)
  return {
    level: () => levelOf(analyser, data),
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          src.disconnect()
          resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }))
        }
        rec.stop()
      }),
  }
}

export async function decode(blob) {
  return audio().decodeAudioData(await blob.arrayBuffer())
}

function softClip(amount = 2.5) {
  const curve = new Float32Array(1024)
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount)
  }
  return curve
}

// Plays a buffer the way a cheap walkman would: narrow band, a bit of saturation,
// slow wow and fast flutter on the pitch, hiss underneath.
export function playTape(buffer, { onEnd } = {}) {
  const c = audio()
  const src = c.createBufferSource()
  src.buffer = buffer
  const wow = c.createOscillator()
  wow.frequency.value = 0.6
  const wowDepth = c.createGain()
  wowDepth.gain.value = 9
  wow.connect(wowDepth).connect(src.detune)
  const flutter = c.createOscillator()
  flutter.frequency.value = 7
  const flutterDepth = c.createGain()
  flutterDepth.gain.value = 3
  flutter.connect(flutterDepth).connect(src.detune)

  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 150
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 4200
  const shaper = c.createWaveShaper()
  shaper.curve = softClip()
  const out = c.createGain()
  out.gain.value = 0.85
  const analyser = c.createAnalyser()
  analyser.fftSize = 512
  const data = new Uint8Array(analyser.fftSize)

  src.connect(hp).connect(lp).connect(shaper).connect(out)
  out.connect(c.destination)
  out.connect(analyser)

  const stopHiss = startHiss(0.018)
  const startedAt = c.currentTime
  src.start()
  wow.start()
  flutter.start()
  let stopped = false
  src.onended = () => {
    if (stopped) return
    stopped = true
    wow.stop()
    flutter.stop()
    stopHiss()
    onEnd?.()
  }
  return {
    position: () => Math.min(buffer.duration, c.currentTime - startedAt),
    level: () => levelOf(analyser, data),
    stop: () => {
      try {
        src.stop()
      } catch {
        /* already stopped */
      }
    },
  }
}
