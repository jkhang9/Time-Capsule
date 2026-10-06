import { useRef } from 'react'
import { crinkle, thump } from '../audio/sfx.js'
import { loadImage } from '../scene/paper.js'
import { FromField, Footer, PaperPanel } from './Panel.jsx'

const DESIGNS = [
  ['greetings', 'greetings from'],
  ['sunset', 'sunset'],
  ['photo', 'my photo'],
]

export default function PostcardPanel({ card, setCard, from, setFrom, onInsert, onBack }) {
  const file = useRef()
  const set = (patch) => setCard({ ...card, ...patch })
  const flip = (flipped) => {
    if (flipped === card.flipped) return
    crinkle(0.18)
    set({ flipped })
  }

  const pick = (design) => {
    if (design === 'photo' && !card.image) file.current?.click()
    set({ design, flipped: false })
  }

  let note = 'pick a front, then write on the back'
  if (card.stamped) note = 'stamped and ready. mail it'
  else if (card.message.trim() && from.trim()) note = 'needs a stamp'
  else if (card.flipped) note = 'write something short and sweet'

  return (
    <PaperPanel label="Postcard">
      <div className="swatches" role="radiogroup" aria-label="Postcard front">
        {DESIGNS.map(([id, label]) => (
          <button key={id} role="radio" aria-checked={card.design === id} className={`chip ${card.design === id ? 'on' : ''}`} onClick={() => pick(id)}>
            {label}
          </button>
        ))}
        {card.design === 'greetings' && (
          <input
            id="postcard-place"
            className="inline-input"
            aria-label="Greetings from where"
            placeholder="where? (our room)"
            maxLength={14}
            value={card.place}
            onFocus={() => flip(false)}
            onChange={(e) => set({ place: e.target.value })}
          />
        )}
        {card.design === 'photo' && (
          <button className="back" onClick={() => file.current?.click()}>
            {card.image ? 'change photo' : 'choose photo'}
          </button>
        )}
      </div>
      <div className="panel-row">
        <div className="label-field grow">
          <label htmlFor="postcard-message">message</label>
          <textarea
            id="postcard-message"
            rows={3}
            maxLength={260}
            value={card.message}
            placeholder="having a great time…"
            onFocus={() => flip(true)}
            onChange={(e) => set({ message: e.target.value, flipped: true })}
          />
        </div>
        <FromField id="postcard-from" value={from} onChange={setFrom} />
      </div>
      <div className="actions">
        <button className="chip" onClick={() => flip(!card.flipped)}>
          flip it
        </button>
        <button
          className="chip"
          disabled={card.stamped || !card.message.trim() || !from.trim()}
          onClick={() => {
            thump()
            setTimeout(thump, 260)
            set({ stamped: true, flipped: true })
          }}
        >
          stamp it
        </button>
        <button className="chip go" disabled={!card.stamped} onClick={onInsert}>
          mail it
        </button>
      </div>
      <Footer note={note} onBack={onBack} />
      <input
        ref={file}
        id="postcard-photo"
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            set({ image: await loadImage(f), design: 'photo', flipped: false })
          } catch {
            /* unreadable file: keep the current front */
          }
        }}
      />
    </PaperPanel>
  )
}
