import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Cassette, { CASSETTE } from './Cassette.jsx'
import { SLOT } from './Lockbox.jsx'
import { clank, scrape } from '../audio/sfx.js'

// where the cassette lies on the desk while you record
export const DESK_SPOT = new THREE.Vector3(1.3, CASSETTE.d / 2 + 0.002, 0.95)
const FLAT = new THREE.Euler(-Math.PI / 2, 0, 0.18)

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeIn = (t) => t * t * t

const LIFT = 1.0
const HOVER = 0.25
const SINK = 0.5

export default function TapeStation({ mode, name, deck, onDropped }) {
  const g = useRef()
  const anim = useRef(null)
  const above = new THREE.Vector3(SLOT.x, SLOT.y + CASSETTE.h / 2 + 0.12, SLOT.z)

  useEffect(() => {
    if (mode === 'dropping') anim.current = { t: 0, scraped: false }
    if (mode === 'tape' && g.current) {
      g.current.position.copy(DESK_SPOT)
      g.current.rotation.copy(FLAT)
    }
  }, [mode])

  useFrame((_, dt) => {
    const obj = g.current
    if (!obj) return
    if (mode !== 'dropping' || !anim.current) return
    const a = anim.current
    a.t += Math.min(dt, 1 / 30) // keep the motion visible even on a slow frame
    if (a.t < LIFT) {
      const k = ease(a.t / LIFT)
      obj.position.lerpVectors(DESK_SPOT, above, k)
      obj.position.y += Math.sin(k * Math.PI) * 0.35
      obj.rotation.set(THREE.MathUtils.lerp(FLAT.x, 0, k), 0, THREE.MathUtils.lerp(FLAT.z, 0, k))
    } else if (a.t < LIFT + HOVER) {
      // a little hesitation lining it up with the slot
      const k = (a.t - LIFT) / HOVER
      obj.position.copy(above)
      obj.rotation.set(0, 0, Math.sin(k * Math.PI * 2) * 0.03)
    } else if (a.t < LIFT + HOVER + SINK) {
      if (!a.scraped) {
        a.scraped = true
        scrape(SINK)
      }
      const k = easeIn((a.t - LIFT - HOVER) / SINK)
      obj.rotation.set(0, 0, 0)
      obj.position.set(above.x, above.y - k * (CASSETTE.h + 0.16), above.z)
    } else {
      anim.current = null
      clank()
      onDropped()
    }
  })

  return (
    <Cassette
      ref={g}
      visible={mode === 'tape' || mode === 'dropping'}
      name={name}
      getProgress={deck.getProgress}
      getSpin={deck.getSpin}
      position={DESK_SPOT.toArray()}
      rotation={[FLAT.x, FLAT.y, FLAT.z]}
    />
  )
}
