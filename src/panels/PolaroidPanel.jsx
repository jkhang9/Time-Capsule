import { useEffect, useRef, useState } from 'react'
import { flap, whirr } from '../audio/sfx.js'
import { loadImage, squareCrop } from '../scene/paper.js'
import { FromField, Footer, PaperPanel } from './Panel.jsx'

export default function PolaroidPanel({ snap, setSnap, getDev, from, setFrom, onInsert, onBack }) {
  const file = useRef()
  const [, tick] = useState(0)

  // re-render while developing so the note and button keep up
  useEffect(() => {
    if (!snap.photo) return
    const id = setInterval(() => tick((n) => n + 1), 300)
    return () => clearInterval(id)
  }, [snap.photo])

  const dev = getDev()
  const ready = snap.photo && dev >= 1

  let note = 'pick a photo. it takes a minute to develop'
  if (snap.photo && !ready) note = dev < 0.3 ? 'developing… (shaking it helps. probably)' : 'almost… keep shaking'
  else if (ready) note = snap.caption.trim() ? 'cute. put it in' : 'write something on the bottom'

  return (
    <PaperPanel label="Polaroid">
      <div className="panel-row">
        <div className="label-field grow">
          <label htmlFor="polaroid-caption">caption</label>
          <input
            id="polaroid-caption"
            maxLength={22}
            value={snap.caption}
            placeholder="summer '26"
            autoComplete="off"
            onChange={(e) => setSnap({ ...snap, caption: e.target.value })}
          />
        </div>
        <FromField id="polaroid-from" value={from} onChange={setFrom} />
      </div>
      <div className="actions">
        <button className="chip" onClick={() => file.current?.click()}>
          {snap.photo ? 'different photo' : 'pick a photo'}
        </button>
        <button
          className="chip"
          disabled={!snap.photo || ready}
          onClick={() => {
            flap()
            setSnap({ ...snap, bonus: snap.bonus + 0.12, shakeAt: performance.now() })
          }}
        >
          shake it
        </button>
        <button className="chip go" disabled={!ready || !snap.caption.trim() || !from.trim()} onClick={onInsert}>
          put it in
        </button>
      </div>
      <Footer note={note} onBack={onBack} />
      <input
        ref={file}
        id="polaroid-photo"
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            const img = await loadImage(f)
            whirr(0.7)
            setSnap({ ...snap, photo: squareCrop(img), startedAt: performance.now(), bonus: 0 })
          } catch {
            /* unreadable file */
          }
        }}
      />
    </PaperPanel>
  )
}
