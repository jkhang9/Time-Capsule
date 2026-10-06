import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraShake, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import Lockbox from './scene/Lockbox.jsx'
import Room from './scene/Room.jsx'
import Station from './scene/Station.jsx'
import Cassette, { CASSETTE } from './scene/Cassette.jsx'
import Letter, { LETTER_PACKET_H } from './scene/Letter.jsx'
import Postcard, { POSTCARD } from './scene/Postcard.jsx'
import Polaroid, { POLAROID } from './scene/Polaroid.jsx'
import CameraRig, { POSES } from './scene/CameraRig.jsx'
import Deck from './panels/Deck.jsx'
import LetterPanel from './panels/LetterPanel.jsx'
import PostcardPanel from './panels/PostcardPanel.jsx'
import PolaroidPanel from './panels/PolaroidPanel.jsx'
import { useTapeDeck } from './useTapeDeck.js'
import { getOpensAt } from './countdown.js'
import { audio } from './audio/sfx.js'

const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const DEVELOP_MS = 25000

const KINDS = [
  ['tape', 'a tape', 'tapes'],
  ['letter', 'a letter', 'letters'],
  ['postcard', 'a postcard', 'postcards'],
  ['polaroid', 'a polaroid', 'polaroids'],
]

const blankLetter = () => ({ text: 'dear future us,\n\n', folded: false })
const blankCard = () => ({ design: 'greetings', place: '', image: null, message: '', stamped: false, flipped: false })
const blankSnap = () => ({ photo: null, caption: '', startedAt: 0, bonus: 0, shakeAt: null })

function rememberedName() {
  try {
    return localStorage.getItem('lockbox:name') || ''
  } catch {
    return ''
  }
}

function summary(items) {
  if (!items.length) return 'nothing yet'
  return KINDS.map(([k, one, many]) => {
    const n = items.filter((i) => i.type === k).length
    return n ? `${n} ${n === 1 ? one.replace(/^an? /, '') : many}` : null
  })
    .filter(Boolean)
    .join(', ')
}

export default function App() {
  const opensAt = useMemo(getOpensAt, [])
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const [mode, setMode] = useState('box') // box | make | dropping
  const [kind, setKind] = useState('tape')
  const [menu, setMenu] = useState(false)
  const [from, setFromState] = useState(rememberedName)
  const [items, setItems] = useState([])
  const [thunk, setThunk] = useState(0)
  const deck = useTapeDeck()
  const [letter, setLetter] = useState(blankLetter)
  const [card, setCard] = useState(blankCard)
  const [snap, setSnap] = useState(blankSnap)

  const setFrom = (v) => {
    setFromState(v)
    try {
      localStorage.setItem('lockbox:name', v)
    } catch {
      /* storage unavailable */
    }
  }

  const getDev = () => (snap.photo ? Math.min(1, (performance.now() - snap.startedAt) / DEVELOP_MS + snap.bonus) : 0)

  const start = (k) => {
    audio() // unlock audio on this tap
    deck.reset()
    setLetter(blankLetter())
    setCard(blankCard())
    setSnap(blankSnap())
    setKind(k)
    setMenu(false)
    setMode('make')
  }

  const back = () => {
    deck.reset()
    setMode('box')
  }

  const insert = () => {
    if (kind === 'tape') deck.stop()
    setMode('dropping')
  }

  const dropped = () => {
    const who = from.trim()
    let item = { type: kind, from: who }
    if (kind === 'tape') {
      const tape = deck.take()
      item = { ...item, duration: tape?.duration, blob: tape?.blob }
      deck.reset()
    } else if (kind === 'letter') item.text = letter.text
    else if (kind === 'postcard') item = { ...item, design: card.design, place: card.place, message: card.message }
    else item.caption = snap.caption
    setItems((list) => [...list, item])
    setThunk((n) => n + 1)
    setTimeout(() => setMode('box'), 450)
  }

  const station = (k, height, rest, child) => (
    <Station key={k} active={kind === k} mode={mode} height={height} rest={rest} onDropped={dropped}>
      {child}
    </Station>
  )

  const panelProps = { from, setFrom, onInsert: insert, onBack: back }

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
          {station('tape', CASSETTE.h, CASSETTE.d / 2 + 0.002, <Cassette name={from.trim()} getProgress={deck.getProgress} getSpin={deck.getSpin} />)}
          {station('letter', LETTER_PACKET_H, 0.008, <Letter text={letter.text} from={from.trim()} folded={letter.folded} />)}
          {station('postcard', POSTCARD.h, 0.004, <Postcard {...card} from={from.trim()} />)}
          {station('polaroid', POLAROID.h, 0.005, <Polaroid photo={snap.photo} caption={snap.caption} getDev={getDev} shakeAt={snap.shakeAt} />)}
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
        <CameraRig pose={mode === 'make' ? kind : mode} />
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
              <b>{summary(items)}</b>
            </div>
            <p className="dare">poke the padlock. i dare u.</p>
            {menu ? (
              <div className="menu" role="menu" aria-label="Put something in">
                {KINDS.map(([k, label]) => (
                  <button key={k} role="menuitem" className="sticky" onClick={() => start(k)}>
                    {label}
                  </button>
                ))}
                <button className="nah" onClick={() => setMenu(false)}>
                  nah
                </button>
              </div>
            ) : (
              <button className="sticky add" onClick={() => setMenu(true)}>
                + put something in
                <small>tape, letter, postcard, polaroid</small>
              </button>
            )}
          </>
        )}
        {mode === 'make' && kind === 'tape' && <Deck deck={deck} name={from} setName={setFrom} onInsert={insert} onBack={back} />}
        {mode === 'make' && kind === 'letter' && <LetterPanel letter={letter} setLetter={setLetter} {...panelProps} />}
        {mode === 'make' && kind === 'postcard' && <PostcardPanel card={card} setCard={setCard} {...panelProps} />}
        {mode === 'make' && kind === 'polaroid' && <PolaroidPanel snap={snap} setSnap={setSnap} getDev={getDev} {...panelProps} />}
      </div>
    </>
  )
}
