import { useMemo } from 'react'
import { makeWoodMap } from './textures.js'

// A desk with a lamp pooling light on it. The rest of the room stays dark.
export default function Room() {
  const wood = useMemo(() => makeWoodMap(), [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={wood} roughness={0.62} />
      </mesh>
      <mesh position={[0, 3, -3.2]}>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#2a1f24" roughness={1} />
      </mesh>
    </group>
  )
}
