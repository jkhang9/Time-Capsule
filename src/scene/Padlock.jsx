import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { rattle } from '../audio/sfx.js'

// Brass combination padlock. Refuses to open until the deadline, then pops its shackle.
export default function Padlock({ opensAt, onEarly, ...props }) {
  const body = useRef()
  const shackle = useRef()
  const shake = useRef(0)
  const [hover, setHover] = useState(false)

  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 1, roughness: 0.28 }), [])
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfcfca', metalness: 1, roughness: 0.2 }), [])

  const unlocked = () => Date.now() >= opensAt.getTime()

  useFrame((_, dt) => {
    const t = performance.now() / 1000
    const s = shake.current
    if (body.current) {
      body.current.rotation.z = Math.sin(t * 46) * s * 0.22
      body.current.position.y = -Math.abs(Math.sin(t * 20)) * s * 0.012
    }
    shake.current = Math.max(0, s - dt * 2.2)
    if (shackle.current) {
      const open = unlocked()
      shackle.current.position.y = THREE.MathUtils.damp(shackle.current.position.y, open ? 0.075 : 0, 9, dt)
      shackle.current.rotation.y = THREE.MathUtils.damp(shackle.current.rotation.y, open ? 0.9 : 0, 6, dt)
    }
  })

  const onClick = (e) => {
    e.stopPropagation()
    if (unlocked()) return
    shake.current = 1
    rattle()
    onEarly?.()
  }

  return (
    <group
      {...props}
      onClick={onClick}
      onPointerOver={() => {
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
      scale={hover ? 1.04 : 1}
    >
      <group ref={body}>
        <RoundedBox args={[0.17, 0.15, 0.06]} radius={0.02} smoothness={4} material={brass} castShadow />
        <group ref={shackle} position={[0, 0.075, 0]}>
          <mesh position={[0, 0.045, 0]} material={steel} castShadow>
            <torusGeometry args={[0.045, 0.01, 12, 24, Math.PI]} />
          </mesh>
          <mesh position={[-0.045, 0.012, 0]} material={steel}>
            <cylinderGeometry args={[0.01, 0.01, 0.07, 10]} />
          </mesh>
          <mesh position={[0.045, 0.012, 0]} material={steel}>
            <cylinderGeometry args={[0.01, 0.01, 0.07, 10]} />
          </mesh>
        </group>
        {/* four combination wheels */}
        {[-0.054, -0.018, 0.018, 0.054].map((x) => (
          <mesh key={x} position={[x, -0.03, 0.032]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.028, 16]} />
            <meshStandardMaterial color="#2a2420" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
