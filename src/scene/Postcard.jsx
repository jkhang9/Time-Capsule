import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canvasTexture, drawPostcardBack, drawPostcardFront, fontsReady } from './paper.js'

// 6x4 inch card
export const POSTCARD = { w: 0.74, h: 0.5 }

export default function Postcard({ design, place, image, message, from, stamped, flipped }) {
  const front = useMemo(() => canvasTexture(1110, 750), [])
  const back = useMemo(() => canvasTexture(1110, 750), [])

  useEffect(() => {
    const redraw = () => {
      drawPostcardFront(front.canvas, { design, place, image })
      front.texture.needsUpdate = true
    }
    redraw()
    fontsReady.then(redraw)
  }, [design, place, image, front])

  useEffect(() => {
    const redraw = () => {
      drawPostcardBack(back.canvas, { message, from, stamped })
      back.texture.needsUpdate = true
    }
    redraw()
    fontsReady.then(redraw)
  }, [message, from, stamped, back])

  const card = useRef()
  useFrame((_, dt) => {
    const c = card.current
    c.rotation.y = THREE.MathUtils.damp(c.rotation.y, flipped ? Math.PI : 0, 5, dt)
    // lift off the desk while turning over
    c.position.z = Math.sin(c.rotation.y) * 0.3
  })

  return (
    <group ref={card}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[POSTCARD.w, POSTCARD.h, 0.004]} />
        <meshStandardMaterial color="#efe7d6" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.0021]}>
        <planeGeometry args={[POSTCARD.w, POSTCARD.h]} />
        <meshPhysicalMaterial map={front.texture} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.0021]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[POSTCARD.w, POSTCARD.h]} />
        <meshStandardMaterial map={back.texture} roughness={0.9} />
      </mesh>
    </group>
  )
}
