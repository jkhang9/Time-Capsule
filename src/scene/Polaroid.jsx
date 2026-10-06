import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { canvasTexture, drawCaption, fontsReady } from './paper.js'

// 3.5 x 4.2 inch instant photo with a square picture and a wide chin
export const POLAROID = { w: 0.44, h: 0.535 }
const PIC = 0.38
const PIC_Y = POLAROID.h / 2 - 0.03 - PIC / 2
const CHIN_Y = (PIC_Y - PIC / 2 + -POLAROID.h / 2) / 2

// Instant film developing: starts murky blue-grey, a ghost image rises, then colour comes in.
const developShader = {
  uniforms: { map: { value: null }, dev: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    uniform float dev;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(map, vUv).rgb;
      float g = dot(c, vec3(0.299, 0.587, 0.114));
      vec3 murk = vec3(0.13, 0.17, 0.17);
      vec3 ghost = vec3(g) * vec3(0.72, 0.84, 0.92) + 0.06;
      vec3 col = mix(murk, ghost, smoothstep(0.05, 0.55, dev));
      col = mix(col, c * vec3(1.04, 1.0, 0.92), smoothstep(0.35, 1.0, dev));
      // a soft darkening toward the edges, like real instant film
      vec2 q = vUv - 0.5;
      col *= 1.0 - dot(q, q) * 0.35;
      gl_FragColor = vec4(col * 0.9, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
}

export default function Polaroid({ photo, caption, getDev, shakeAt }) {
  const cap = useMemo(() => canvasTexture(800, 200), [])
  const picture = useMemo(() => {
    const t = new THREE.Texture()
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const mat = useMemo(() => new THREE.ShaderMaterial({ ...developShader, uniforms: THREE.UniformsUtils.clone(developShader.uniforms) }), [])

  useEffect(() => {
    if (!photo) return
    picture.image = photo
    picture.needsUpdate = true
    mat.uniforms.map.value = picture
  }, [photo, picture, mat])

  useEffect(() => {
    const redraw = () => {
      drawCaption(cap.canvas, caption)
      cap.texture.needsUpdate = true
    }
    redraw()
    fontsReady.then(redraw)
  }, [caption, cap])

  const body = useRef()
  useFrame(() => {
    mat.uniforms.dev.value = photo ? getDev() : 0
    // flapping it about after a shake
    const since = (performance.now() - (shakeAt ?? -1e9)) / 1000
    const k = Math.max(0, 1 - since / 0.6)
    body.current.rotation.x = Math.sin(since * 30) * 0.35 * k
    body.current.position.z = Math.abs(Math.sin(since * 15)) * 0.12 * k
  })

  return (
    <group ref={body}>
      <RoundedBox args={[POLAROID.w, POLAROID.h, 0.008]} radius={0.004} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, PIC_Y, 0.0045]} material={mat}>
        <planeGeometry args={[PIC, PIC]} />
      </mesh>
      <mesh position={[0, CHIN_Y, 0.0045]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshStandardMaterial map={cap.texture} transparent roughness={0.7} />
      </mesh>
    </group>
  )
}
