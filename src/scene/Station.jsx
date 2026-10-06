import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SLOT } from './Lockbox.jsx'
import { clank, scrape } from '../audio/sfx.js'

// where things lie on the desk while you make them
export const DESK_SPOT = new THREE.Vector3(1.3, 0, 0.95)
const FLAT = new THREE.Euler(-Math.PI / 2, 0, 0.18)

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeIn = (t) => t * t * t

const LIFT = 1.0
const HOVER = 0.25
const SINK = 0.5

// Holds whatever is being made on the desk, then carries it up and through the lid slot.
// `height` is the object's upright height, `rest` how far its center sits above the desk.
export default function Station({ active, mode, height, rest = 0.004, onDropped, children }) {
  const g = useRef()
  const anim = useRef(null)
  const start = new THREE.Vector3(DESK_SPOT.x, rest, DESK_SPOT.z)
  const above = new THREE.Vector3(SLOT.x, SLOT.y + height / 2 + 0.12, SLOT.z)

  useEffect(() => {
    if (!active || !g.current) return
    if (mode === 'dropping') anim.current = { t: 0, scraped: false }
    if (mode === 'make') {
      anim.current = null
      g.current.position.copy(start)
      g.current.rotation.copy(FLAT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, active])

  useFrame((_, dt) => {
    const obj = g.current
    const a = anim.current
    if (!obj || !a || !active || mode !== 'dropping') return
    a.t += Math.min(dt, 1 / 30) // keep the motion visible even on a slow frame
    if (a.t < LIFT) {
      const k = ease(a.t / LIFT)
      obj.position.lerpVectors(start, above, k)
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
      obj.position.set(above.x, above.y - k * (height + 0.16), above.z)
    } else {
      anim.current = null
      clank()
      onDropped()
    }
  })

  return (
    <group ref={g} visible={active && mode !== 'box'} position={start.toArray()} rotation={[FLAT.x, FLAT.y, FLAT.z]}>
      {children}
    </group>
  )
}
