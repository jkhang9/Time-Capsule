import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export const POSES = {
  box: { pos: [1.9, 1.9, 2.8], target: [0, 0.5, 0] },
  tape: { pos: [1.45, 0.95, 1.75], target: [1.28, 0.02, 0.92] },
  letter: { pos: [1.42, 1.6, 1.85], target: [1.3, 0, 0.88] },
  postcard: { pos: [1.45, 1.4, 2.0], target: [1.3, 0.02, 0.9] },
  polaroid: { pos: [1.42, 1.15, 1.75], target: [1.29, 0.02, 0.9] },
  dropping: { pos: [1.2, 2.3, 2.1], target: [-0.15, 0.95, -0.15] },
}

const tmp = new THREE.Vector3()

// Glides the camera between poses; in the box pose it hands control back to the viewer.
export default function CameraRig({ pose }) {
  const { camera, controls } = useThree()
  const goal = useRef(null)

  useEffect(() => {
    goal.current = POSES[pose]
  }, [pose])

  useFrame((_, dt) => {
    if (!controls) return
    const free = pose === 'box'
    const g = goal.current
    controls.enabled = free && !g
    if (!g) return
    const speed = pose === 'dropping' ? 2.2 : 3
    tmp.set(...g.pos)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tmp.x, speed, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, tmp.y, speed, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tmp.z, speed, dt)
    const far = camera.position.distanceTo(tmp)
    tmp.set(...g.target)
    controls.target.x = THREE.MathUtils.damp(controls.target.x, tmp.x, speed, dt)
    controls.target.y = THREE.MathUtils.damp(controls.target.y, tmp.y, speed, dt)
    controls.target.z = THREE.MathUtils.damp(controls.target.z, tmp.z, speed, dt)
    controls.update()
    if (free && far < 0.02 && controls.target.distanceTo(tmp) < 0.02) goal.current = null
  })

  return null
}
