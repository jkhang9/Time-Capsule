import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canvasTexture, drawLetter, drawLetterBack, fontsReady } from './paper.js'

// a small notebook page, folded in half and in half again
export const LETTER = { w: 0.6, h: 0.78 }
export const LETTER_PACKET_H = LETTER.h / 2
const QW = LETTER.w / 2
const QH = LETTER.h / 2

// plane for one quarter of the sheet, showing its slice [u0,u1]x[v0,v1] of the texture
function quarter(u0, v0, u1, v1) {
  const geo = new THREE.PlaneGeometry(QW, QH)
  const uv = geo.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0))
  return geo
}

function Quarter({ slice, front, back, position }) {
  const [u0, v0, u1, v1] = slice
  // the back face shows the mirrored slice of the (mirrored) back artwork
  const geos = useMemo(() => [quarter(u0, v0, u1, v1), quarter(1 - u1, v0, 1 - u0, v1)], [u0, v0, u1, v1])
  return (
    <group position={position}>
      <mesh geometry={geos[0]} material={front} castShadow />
      <mesh geometry={geos[1]} material={back} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

const easeInOut = (t) => t * t * (3 - 2 * t)

export default function Letter({ text, from, folded }) {
  const front = useMemo(() => canvasTexture(900, 1170), [])
  const back = useMemo(() => canvasTexture(900, 1170), [])
  const frontMat = useMemo(() => new THREE.MeshStandardMaterial({ map: front.texture, transparent: true, alphaTest: 0.5, roughness: 0.92 }), [front])
  const backMat = useMemo(() => new THREE.MeshStandardMaterial({ map: back.texture, transparent: true, alphaTest: 0.5, roughness: 0.95 }), [back])

  useEffect(() => {
    const redraw = () => {
      drawLetter(front.canvas, { text, from })
      front.texture.needsUpdate = true
      drawLetterBack(back.canvas, from)
      back.texture.needsUpdate = true
    }
    redraw()
    fontsReady.then(redraw)
  }, [text, from, front, back])

  const center = useRef()
  const topRight = useRef()
  const topLeft = useRef()
  const leftCol = useRef()
  const fold = useRef(0) // 0 flat, 1 halved, 2 quartered

  useFrame((_, dt) => {
    const target = folded ? 2 : 0
    fold.current += THREE.MathUtils.clamp(target - fold.current, -dt * 2.2, dt * 2.2)
    const e1 = easeInOut(THREE.MathUtils.clamp(fold.current, 0, 1))
    const e2 = easeInOut(THREE.MathUtils.clamp(fold.current - 1, 0, 1))
    topRight.current.rotation.x = e1 * Math.PI
    topLeft.current.rotation.x = e1 * Math.PI
    leftCol.current.rotation.y = e2 * Math.PI
    // keep the packet centered on the spot as it shrinks
    center.current.position.set((-QW / 2) * e2, (QH / 2) * e1, 0)
  })

  return (
    <group ref={center}>
      <Quarter slice={[0.5, 0, 1, 0.5]} front={frontMat} back={backMat} position={[QW / 2, -QH / 2, 0]} />
      <group ref={topRight}>
        <Quarter slice={[0.5, 0.5, 1, 1]} front={frontMat} back={backMat} position={[QW / 2, QH / 2, -0.002]} />
      </group>
      <group ref={leftCol}>
        <group position={[0, 0, -0.006]}>
          <Quarter slice={[0, 0, 0.5, 0.5]} front={frontMat} back={backMat} position={[-QW / 2, -QH / 2, 0]} />
          <group ref={topLeft}>
            <Quarter slice={[0, 0.5, 0.5, 1]} front={frontMat} back={backMat} position={[-QW / 2, QH / 2, -0.002]} />
          </group>
        </group>
      </group>
    </group>
  )
}
