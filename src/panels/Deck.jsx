import { useEffect, useRef } from 'react'
import { MAX_SECONDS } from '../audio/tape.js'

const fmt = (s) => {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// The cassette deck panel shown while you're making a tape.
export default function Deck({ deck, name, setName, onInsert, onBack }) {
  const needle = useRef()
  const fileInput = useRef()
  const { status } = deck

  // VU needle follows the live level
  useEffect(() => {
    let id
    let smooth = 0
    const tick = () => {
      smooth += (deck.getLevel() - smooth) * 0.3
      if (needle.current) needle.current.style.transform = `rotate(${-45 + smooth * 90}deg)`
      id = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(id)
  }, [deck])

  const busy = status === 'saving' || status === 'rewinding'
  const hasTape = status === 'recorded' || status === 'playing' || status === 'rewinding'

  let note
  if (deck.micBlocked && status === 'empty') note = "can't reach your mic here. pick a voice memo from your phone instead"
  else if (status === 'empty') note = `press REC and talk. you get ${MAX_SECONDS / 60} minutes of tape`
  else if (status === 'recording') note = 'recording… say something embarrassing'
  else if (status === 'saving') note = 'popping it out…'
  else if (status === 'rewinding') note = 'rewinding…'
  else if (status === 'playing') note = 'playing back'
  else note = name ? 'sounds good? put it in the box' : 'write your name on the label first'

  return (
    <div className="deck" role="group" aria-label="Cassette recorder">
      <div className="deck-top">
        <div className="label-field">
          <label htmlFor="tape-name">label</label>
          <input id="tape-name" value={name} maxLength={16} placeholder="your name" autoComplete="off" onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="meters">
          <div className="counter" aria-label="Tape time">
            <span>
              <i className={`rec-light ${status === 'recording' ? 'on' : ''}`} />
              TIME
            </span>
            {fmt(deck.seconds)}
          </div>
          <div className="vu" aria-hidden="true">
            <div className="needle" ref={needle} />
          </div>
        </div>
      </div>

      <div className="keys">
        <button className={`key rec ${status === 'recording' ? 'down' : ''}`} disabled={status !== 'empty'} onClick={deck.record}>
          <i>●</i>REC
        </button>
        <button className={`key ${status === 'playing' || status === 'rewinding' ? 'down' : ''}`} disabled={status !== 'recorded'} onClick={deck.play}>
          <i>▶</i>PLAY
        </button>
        <button className="key" disabled={status !== 'recording' && status !== 'playing'} onClick={deck.stop}>
          <i>■</i>STOP
        </button>
        <button className="key insert" disabled={!hasTape || busy || !name.trim()} onClick={onInsert}>
          <i>⏏</i>PUT IN
        </button>
      </div>

      <p className="deck-note">
        <span aria-live="polite">{note}</span>
        <span className="links">
          {status === 'empty' && (
            <button className="back" onClick={() => fileInput.current?.click()}>
              use a voice memo
            </button>
          )}
          {hasTape && !busy && (
            <button className="back" onClick={deck.reset}>
              tape over it
            </button>
          )}
          <button className="back" onClick={onBack}>
            never mind
          </button>
        </span>
      </p>
      <input
        ref={fileInput}
        id="voice-memo"
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) deck.loadFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
