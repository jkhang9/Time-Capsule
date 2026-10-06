import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraShake, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import Lockbox from './scene/Lockbox.jsx'
import Room from './scene/Room.jsx'
import { getOpensAt } from './countdown.js'

export default function App() {
  const opensAt = useMemo(getOpensAt, [])
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  return (
    <>
      <Canvas shadows dpr={dpr} camera={{ position: [1.9, 1.9, 2.8], fov: 38 }} gl={{ antialias: true }}>
        <color attach="background" args={['#1b1512']} />
        <fog attach="fog" args={['#1b1512', 6, 12]} />
        <ambientLight intensity={0.18} color="#ffd9b0" />
        {/* desk lamp */}
        <spotLight
          position={[-2.2, 3.6, 1.6]}
          angle={0.5}
          penumbra={0.9}
          intensity={90}
          color="#ffcf94"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          target-position={[0, 0.4, 0]}
        />
        <Environment resolution={256} environmentIntensity={0.5}>
          <Lightformer form="rect" intensity={2.2} color="#ffe2bd" position={[-4, 3, 2]} scale={[4, 3, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#9db7ff" position={[4, 2, -2]} scale={[3, 2, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Room />
          <Lockbox opensAt={opensAt} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={2.2}
          maxDistance={5}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2 - 0.08}
          target={[0, 0.5, 0]}
          dampingFactor={0.07}
        />
        {/* barely-there handheld wobble */}
        <CameraShake maxYaw={0.006} maxPitch={0.006} maxRoll={0.004} yawFrequency={0.4} pitchFrequency={0.5} rollFrequency={0.3} intensity={1} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.45} luminanceThreshold={0.85} mipmapBlur />
          <Noise opacity={0.07} />
          <Vignette offset={0.25} darkness={0.7} />
        </EffectComposer>
      </Canvas>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'max(18px, env(safe-area-inset-bottom))', textAlign: 'center', fontSize: 24, pointerEvents: 'none', textShadow: '0 1px 6px #000a', transform: 'rotate(-1deg)' }}>
        poke the padlock. i dare u.
      </div>
    </>
  )
}
