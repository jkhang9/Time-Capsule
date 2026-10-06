import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { drawLed, makeLedCanvas } from './textures.js'
import { formatRemaining } from '../countdown.js'

// Kitchen-timer-meets-bomb-prop LED readout, duct-taped to the lid.
export default function LedTimer({ opensAt, complaint, ...props }) {
  const led = useMemo(() => makeLedCanvas(), [])
  const lastText = useRef('')
  const notYetUntil = useRef(0)

  useEffect(() => {
    if (complaint > 0) notYetUntil.current = performance.now() + 1400
  }, [complaint])

  useFrame(() => {
    const now = performance.now()
    const remaining = formatRemaining(opensAt.getTime() - Date.now())
    let text
    let on = true
    if (!remaining) {
      text = 'OPEN  NOW'
      on = Math.floor(now / 500) % 2 === 0
    } else if (now < notYetUntil.current) {
      text = 'NOT  YET'
      on = Math.floor(now / 140) % 2 === 0
    } else {
      text = remaining
    }
    const key = text + on
    if (key === lastText.current) return
    lastText.current = key
    drawLed(led.canvas, text, on)
    led.texture.needsUpdate = true
  })

  return (
    <group {...props}>
      <RoundedBox args={[0.5, 0.1, 0.22]} radius={0.015} smoothness={3} position={[0, 0.05, 0]} castShadow>
        <meshStandardMaterial color="#1d1b1a" roughness={0.5} />
      </RoundedBox>
      {/* display */}
      <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.44, 0.138]} />
        <meshStandardMaterial map={led.texture} emissive="#ff3a20" emissiveMap={led.texture} emissiveIntensity={1.3} roughness={0.3} />
      </mesh>
      {/* two strips of duct tape holding it down */}
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.103, 0]} rotation={[0, 0.05 * Math.sign(x), 0]} castShadow>
          <boxGeometry args={[0.07, 0.006, 0.34]} />
          <meshStandardMaterial color="#8a8d90" roughness={0.35} metalness={0.4} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  )
}
