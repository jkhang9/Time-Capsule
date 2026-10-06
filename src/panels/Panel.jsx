// Shared shell for the paper-item panels: a sheet taped to the bottom of the screen.
export function PaperPanel({ label, children }) {
  return (
    <div className="panel paper" role="group" aria-label={label}>
      {children}
    </div>
  )
}

export function FromField({ id, value, onChange, label = 'from' }) {
  return (
    <div className="label-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} maxLength={16} placeholder="your name" autoComplete="off" onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function Footer({ note, children, onBack }) {
  return (
    <p className="deck-note">
      <span aria-live="polite">{note}</span>
      <span className="links">
        {children}
        <button className="back" onClick={onBack}>
          never mind
        </button>
      </span>
    </p>
  )
}
