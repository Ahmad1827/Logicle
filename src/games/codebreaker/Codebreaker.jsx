import { useEffect, useMemo, useState } from 'react'
import GameControls from '../../GameControls.jsx'
import { useActive } from '../../lib/active.js'
import { useHistory } from '../../lib/history.js'
import { createRng, range } from '../../lib/random.js'
import { EraseIcon } from '../../icons.jsx'
import { COLOURS, generateCode, possibleCodes, score, SLOTS } from './generate.js'

const PALETTE = ['#e5484d', '#f59f00', '#fcc419', '#40c057', '#228be6', '#9c36b5']
const NAMES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
const ROWS = 8 // empty rows shown ahead, so the board doesn't jump about

export default function Codebreaker({ seed, solved, onSolve, onMistake, onHint, onRandomize }) {
  const code = useMemo(() => generateCode(createRng(seed)), [seed])
  const history = useHistory(() => ({ guesses: [], current: Array(SLOTS).fill(null) }))
  const { guesses, current } = history.present
  // Revealed slots outlive undo and reset: once seen, a hint can't be unseen.
  const [revealed, setRevealed] = useState([])
  const active = useActive()
  const results = guesses.map((g) => score(code, g))
  const left = useMemo(() => possibleCodes(guesses, guesses.map((g) => score(code, g))), [guesses, code])
  const full = current.every((v) => v !== null)

  function pick(colour) {
    if (solved) return
    const k = current.indexOf(null)
    if (k < 0) return
    const next = [...current]
    next[k] = colour
    history.commit({ guesses, current: next })
  }

  function clear(k) {
    if (solved || current[k] === null) return
    const next = [...current]
    next[k] = null
    history.commit({ guesses, current: next })
  }

  function back() {
    const k = current.findLastIndex((v) => v !== null)
    if (k >= 0) clear(k)
  }

  function check() {
    if (solved || !full) return
    history.commit({ guesses: [...guesses, current], current: revealedRow(revealed) })
    onMistake() // counts guesses
    if (score(code, current).exact === SLOTS) onSolve()
  }

  // The next guess starts with every revealed colour already in place.
  const revealedRow = (slots) => range(SLOTS).map((k) => (slots.includes(k) ? code[k] : null))

  function hint() {
    if (solved) return
    const k = range(SLOTS).find((s) => !revealed.includes(s))
    if (k === undefined) return
    const nextRevealed = [...revealed, k]
    setRevealed(nextRevealed)
    const next = [...current]
    next[k] = code[k]
    history.commit({ guesses, current: next })
    onHint()
  }

  useEffect(() => {
    if (!active) return
    function onKey(e) {
      if (e.ctrlKey || e.metaKey) return
      if (e.key >= '1' && e.key <= String(COLOURS)) pick(Number(e.key) - 1)
      else if (e.key === 'Backspace' || e.key === 'Delete') back()
      else if (e.key === 'Enter') check()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const peg = (colour, key, props = {}) => (
    <span
      key={key}
      className={`peg ${colour === null ? 'empty' : ''}`}
      style={colour === null ? undefined : { background: PALETTE[colour] }}
      aria-label={colour === null ? 'empty' : NAMES[colour]}
      {...props}
    />
  )

  const feedback = ({ exact, near }) => (
    <span className="marks" aria-label={`${exact} right place, ${near} wrong place`}>
      {range(SLOTS).map((k) => (
        <span key={k} className={k < exact ? 'exact' : k < exact + near ? 'near' : ''} />
      ))}
    </span>
  )

  const spare = Math.max(0, ROWS - guesses.length - (solved ? 0 : 1))

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="count small">
          {solved ? 'Cracked!' : `${left.toLocaleString()} code${left === 1 ? '' : 's'} possible`}
        </span>
        <span className="secret" aria-label="Secret code">
          {range(SLOTS).map((k) =>
            solved || revealed.includes(k) ? peg(code[k], k) : <span key={k} className="peg hidden">?</span>,
          )}
        </span>
      </div>
      <div className="codebreaker">
        {guesses.map((g, r) => (
          <div key={r} className="guess">
            <span className="num">{r + 1}</span>
            <span className="pegs">{g.map((c, k) => peg(c, k))}</span>
            {feedback(results[r])}
          </div>
        ))}
        {!solved && (
          <div className="guess current">
            <span className="num">{guesses.length + 1}</span>
            <span className="pegs">
              {current.map((c, k) =>
                peg(c, k, { role: 'button', tabIndex: 0, onClick: () => clear(k) }),
              )}
            </span>
            <button className="primary check" onClick={check} disabled={!full}>
              Check
            </button>
          </div>
        )}
        {range(spare).map((r) => (
          <div key={`s${r}`} className="guess spare">
            <span className="num">{guesses.length + (solved ? 1 : 2) + r}</span>
            <span className="pegs">{range(SLOTS).map((k) => peg(null, k))}</span>
            <span className="marks">
              {range(SLOTS).map((k) => (
                <span key={k} />
              ))}
            </span>
          </div>
        ))}
      </div>
      <div className="palette">
        {PALETTE.map((colour, c) => (
          <button key={c} onClick={() => pick(c)} disabled={solved || full} aria-label={NAMES[c]}>
            <span className="peg" style={{ background: colour }} />
          </button>
        ))}
        <button onClick={back} disabled={solved || !current.some((v) => v !== null)} aria-label="Remove last colour">
          <EraseIcon />
        </button>
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
