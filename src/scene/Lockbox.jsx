import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { makeScuffMap, makeStickerMap } from './textures.js'
import Padlock from './Padlock.jsx'
import LedTimer from './LedTimer.jsx'

const ENAMEL = '#3f7f78'
const STEEL = '#b8b8b2'

export default function Lockbox({ opensAt }) {
  const group = useRef()
  const [nudge, setNudge] = useState(0)
  const [complaint, setComplaint] = useState(0)

  const scuff = useMemo(() => makeScuffMap(), [])
  const stickers = useMemo(() => makeStickerMap(), [])

  const enamel = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: ENAMEL,
        metalness: 0.55,
        roughness: 0.55,
        roughnessMap: scuff,
        clearcoat: 0.6,
        clearcoatRoughness: 0.35,
      }),
    [scuff],
  )
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: STEEL, metalness: 1, roughness: 0.32, roughnessMap: scuff }),
    [scuff],
  )

  // whole box gives a small shove when someone tries to open it early
  useFrame((_, dt) => {
    if (!group.current) return
    const t = performance.now() / 1000
    group.current.rotation.z = Math.sin(t * 38) * nudge * 0.02
    group.current.position.x = Math.sin(t * 31) * nudge * 0.01
    if (nudge > 0) setNudge(Math.max(0, nudge - dt * 2.4))
  })

  const early = () => {
    setNudge(1)
    setComplaint((c) => c + 1)
  }

  return (
    <group ref={group} position={[0, 0.5, 0]}>
      {/* body */}
      <RoundedBox args={[1.7, 0.72, 1.05]} radius={0.04} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow material={enamel} />
      {/* lid */}
      <RoundedBox args={[1.74, 0.3, 1.09]} radius={0.05} smoothness={4} position={[0, 0.5, 0]} castShadow receiveShadow material={enamel} />
      {/* steel seam between lid and body */}
      <mesh position={[0, 0.355, 0]} material={steel} castShadow>
        <boxGeometry args={[1.71, 0.025, 1.06]} />
      </mesh>
      {/* corner caps */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.85, -0.3, sz * 0.52]} material={steel} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
          </mesh>
        )),
      )}
      {/* sticker sheet on the lid */}
      <mesh position={[0, 0.652, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshPhysicalMaterial
          map={stickers}
          transparent
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.08}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
      {/* folding handle */}
      <group position={[0, 0.66, -0.44]}>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.005, 0]} material={steel} castShadow>
            <boxGeometry args={[0.07, 0.04, 0.09]} />
          </mesh>
        ))}
        <mesh position={[0, 0.045, 0]} rotation={[0, 0, Math.PI / 2]} material={steel} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.66, 14]} />
        </mesh>
      </group>
      {/* front hasp + padlock */}
      <mesh position={[0, 0.36, 0.545]} material={steel} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.025]} />
      </mesh>
      <mesh position={[0, 0.2, 0.545]} material={steel} castShadow>
        <boxGeometry args={[0.16, 0.18, 0.02]} />
      </mesh>
      <Padlock position={[0, 0.17, 0.6]} opensAt={opensAt} onEarly={early} />
      {/* countdown, taped to the lid */}
      <LedTimer position={[0.3, 0.68, -0.2]} rotation={[0, -0.1, 0]} opensAt={opensAt} complaint={complaint} />
    </group>
  )
}
