import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { LABEL, drawLabel, makeLabel } from './cassetteLabel.js'

export const CASSETTE = { w: 0.5, h: 0.315, d: 0.055 }
const HUB_X = 0.105
const R_MIN = 0.03
const R_MAX = 0.083
const TAPE_SPEED = 0.06 // world units per second of tape travel, exaggerated so you can see it move

function Hub({ hubRef, tapeRef, x, white }) {
  return (
    <group position={[x, 0, 0]}>
      {/* wound tape pack */}
      <mesh ref={tapeRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.026, 48]} />
        <meshStandardMaterial color="#3a2217" roughness={0.35} metalness={0.25} />
      </mesh>
      <group ref={hubRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={white}>
          <cylinderGeometry args={[0.026, 0.026, 0.03, 24]} />
        </mesh>
        {/* sprocket teeth */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.012, Math.sin(a) * 0.012, 0.016]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.009, 0.004, 0.004]} />
              <meshStandardMaterial color="#d8d2c4" />
            </mesh>
          )
        })}
        <mesh position={[0, 0, 0.0155]}>
          <circleGeometry args={[0.009, 20]} />
          <meshBasicMaterial color="#0d0907" />
        </mesh>
      </group>
    </group>
  )
}

// A procedural compact cassette. getProgress() gives how much tape has moved to the
// right-hand reel (0..1); getSpin() gives reel direction and speed.
export default function Cassette({ name, shell = '#ef7fa8', stripe = '#ff5f8f', getProgress, getSpin }) {
  const label = useMemo(() => makeLabel(), [])
  useEffect(() => {
    const redraw = () => {
      drawLabel(label.canvas, name, stripe)
      label.texture.needsUpdate = true
    }
    redraw()
    document.fonts?.ready.then(redraw)
  }, [name, stripe, label])

  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: shell,
        transmission: 0.85,
        thickness: 0.05,
        roughness: 0.06,
        ior: 1.49,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        attenuationColor: new THREE.Color(shell),
        attenuationDistance: 0.4,
      }),
    [shell],
  )
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1ece0', roughness: 0.5 }), [])
  const screw = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8c8c8', metalness: 1, roughness: 0.3 }), [])

  const leftHub = useRef()
  const rightHub = useRef()
  const leftTape = useRef()
  const rightTape = useRef()

  useFrame((_, dt) => {
    const p = getProgress?.() ?? 0
    const total = R_MAX * R_MAX - R_MIN * R_MIN
    const rl = Math.sqrt(R_MAX * R_MAX - p * total)
    const rr = Math.sqrt(R_MIN * R_MIN + p * total)
    leftTape.current?.scale.set(rl, 1, rl)
    rightTape.current?.scale.set(rr, 1, rr)
    const spin = getSpin?.() ?? 0
    if (spin && leftHub.current) {
      leftHub.current.rotation.z -= (spin * TAPE_SPEED * dt) / rl
      rightHub.current.rotation.z -= (spin * TAPE_SPEED * dt) / rr
    }
  })

  return (
    <group>
      <RoundedBox args={[CASSETTE.w, CASSETTE.h, CASSETTE.d]} radius={0.012} smoothness={3} material={shellMat} castShadow />
      <Hub hubRef={leftHub} tapeRef={leftTape} x={-HUB_X} white={white} />
      <Hub hubRef={rightHub} tapeRef={rightTape} x={HUB_X} white={white} />
      {/* label, front face */}
      <mesh position={[0, LABEL.top - LABEL.h / 2, CASSETTE.d / 2 + 0.0008]}>
        <planeGeometry args={[LABEL.w, LABEL.h]} />
        <meshStandardMaterial map={label.texture} transparent alphaTest={0.5} roughness={0.85} />
      </mesh>
      {/* tape head opening along the bottom edge */}
      <mesh position={[0, -CASSETTE.h / 2 + 0.022, CASSETTE.d / 2 + 0.001]}>
        <planeGeometry args={[0.3, 0.04]} />
        <meshStandardMaterial color="#2a1a20" roughness={0.6} />
      </mesh>
      {[
        [-0.225, 0.14],
        [0.225, 0.14],
        [-0.225, -0.14],
        [0.225, -0.14],
      ].map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, CASSETTE.d / 2 + 0.001]} rotation={[Math.PI / 2, 0, 0]} material={screw}>
          <cylinderGeometry args={[0.0075, 0.0075, 0.003, 12]} />
        </mesh>
      ))}
    </group>
  )
}
