import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraShake, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import Lockbox from './scene/Lockbox.jsx'
import Room from './scene/Room.jsx'
import TapeStation from './scene/TapeStation.jsx'
import CameraRig, { POSES } from './scene/CameraRig.jsx'
import Deck from './Deck.jsx'
import { useTapeDeck } from './useTapeDeck.js'
import { getOpensAt } from './countdown.js'
import { audio } from './audio/sfx.js'

const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const opensAt = useMemo(getOpensAt, [])
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const [mode, setMode] = useState('box') // box | tape | dropping
  const [name, setName] = useState('')
  const [items, setItems] = useState([])
  const [thunk, setThunk] = useState(0)
  const deck = useTapeDeck()

  const startTape = () => {
    audio() // unlock audio on this tap
    deck.reset()
    setMode('tape')
  }

  const insert = () => {
    deck.stop()
    setMode('dropping')
  }

  const dropped = () => {
    const tape = deck.take()
    if (tape) setItems((list) => [...list, { type: 'tape', from: name.trim(), duration: tape.duration, blob: tape.blob }])
    deck.reset()
    setThunk((n) => n + 1)
    setTimeout(() => setMode('box'), 450)
  }

  const count = items.length

  return (
    <>
      <Canvas shadows dpr={dpr} camera={{ position: POSES.box.pos, fov: 38 }} gl={{ antialias: true }}>
        <color attach="background" args={['#1b1512']} />
        <fog attach="fog" args={['#1b1512', 6, 12]} />
        <ambientLight intensity={0.18} color="#ffd9b0" />
        {/* desk lamp */}
        <spotLight
          position={[-2.2, 3.6, 1.6]}
          angle={0.62}
          penumbra={0.9}
          intensity={90}
          color="#ffcf94"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          target-position={[0.3, 0.3, 0.3]}
        />
        <Environment resolution={256} environmentIntensity={0.5}>
          <Lightformer form="rect" intensity={2.2} color="#ffe2bd" position={[-4, 3, 2]} scale={[4, 3, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#9db7ff" position={[4, 2, -2]} scale={[3, 2, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Room />
          <Lockbox opensAt={opensAt} thunk={thunk} />
          <TapeStation mode={mode} name={name.trim()} deck={deck} onDropped={dropped} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={1.2}
          maxDistance={5}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2 - 0.08}
          target={POSES.box.target}
          dampingFactor={0.07}
        />
        <CameraRig pose={mode} />
        {/* barely-there handheld wobble */}
        {!reducedMotion && <CameraShake maxYaw={0.006} maxPitch={0.006} maxRoll={0.004} yawFrequency={0.4} pitchFrequency={0.5} rollFrequency={0.3} />}
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.45} luminanceThreshold={0.85} mipmapBlur />
          <Noise opacity={0.07} />
          <Vignette offset={0.25} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <div className="hud">
        {mode === 'box' && (
          <>
            <div className="sticky count">
              inside
              <b>{count === 0 ? 'nothing yet' : `${count} ${count === 1 ? 'thing' : 'things'}`}</b>
            </div>
            <p className="dare">poke the padlock. i dare u.</p>
            <button className="sticky add" onClick={startTape}>
              + record a tape
              <small>voice note</small>
            </button>
          </>
        )}
        {mode === 'tape' && <Deck deck={deck} name={name} setName={setName} onInsert={insert} onBack={() => (deck.reset(), setMode('box'))} />}
      </div>
    </>
  )
}
