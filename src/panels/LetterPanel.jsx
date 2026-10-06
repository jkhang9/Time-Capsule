import { crinkle } from '../audio/sfx.js'
import { FromField, Footer, PaperPanel } from './Panel.jsx'

export default function LetterPanel({ letter, setLetter, from, setFrom, onInsert, onBack }) {
  const written = letter.text.replace(/dear future us,/i, '').trim().length > 0
  const toggleFold = () => {
    crinkle(0.3)
    setTimeout(() => crinkle(0.3), 450)
    setLetter({ ...letter, folded: !letter.folded })
  }
  let note = 'write it on the page. it folds up when you’re done'
  if (letter.folded) note = from.trim() ? 'all folded. pop it in the slot' : 'sign it first (top right)'
  else if (written) note = 'done? fold it up'

  return (
    <PaperPanel label="Letter">
      <div className="panel-row">
        <div className="label-field grow">
          <label htmlFor="letter-text">letter</label>
          <textarea
            id="letter-text"
            rows={4}
            maxLength={900}
            value={letter.text}
            onChange={(e) => setLetter({ ...letter, text: e.target.value, folded: false })}
          />
        </div>
        <FromField id="letter-from" value={from} onChange={setFrom} />
      </div>
      <div className="actions">
        <button className="chip" disabled={!written} onClick={toggleFold}>
          {letter.folded ? 'unfold' : 'fold it up'}
        </button>
        <button className="chip go" disabled={!letter.folded || !from.trim()} onClick={onInsert}>
          put it in
        </button>
      </div>
      <Footer note={note} onBack={onBack} />
    </PaperPanel>
  )
}
