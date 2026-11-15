import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng } from '../../lib/random.js'
import { generateHitori, neighbours, SIZE, whiteConnected } from './generate.js'

const N = SIZE
const EMPTY = 0
const SHADED = 1
const CIRCLED = 2

function check(numbers, cells) {
  const shaded = cells.map((v) => v === SHADED)
  const bad = new Set()
  // Shaded squares that touch, and circled (kept) squares that repeat.
  shaded.forEach((s, i) => s && neighbours(i).some((n) => shaded[n]) && bad.add(i))
  let repeats = false
  for (let i = 0; i < N * N; i++) {
    if (shaded[i]) continue
    const r = Math.floor(i / N)
    const c = i % N
    for (let k = 0; k < N; k++) {
      for (const j of [r * N + k, k * N + c]) {
        if (j === i || shaded[j] || numbers[j] !== numbers[i]) continue
        repeats = true
        if (cells[i] === CIRCLED && cells[j] === CIRCLED) bad.add(i)
      }
    }
  }
  return { bad, won: !repeats && bad.size === 0 && whiteConnected(shaded) }
}

export default function Hitori({ seed, solved, onSolve, onHint, onRandomize }) {
  const { numbers, shaded } = useMemo(() => generateHitori(createRng(seed)), [seed])
  const history = useHistory(() => Array(N * N).fill(EMPTY))
  const cells = history.present
  const { bad } = check(numbers, cells)
  const [flashed, flash] = useFlash()

  function tap(i) {
    if (solved) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    update(next)
  }

  function update(next) {
    history.commit(next)
    if (check(numbers, next).won) onSolve()
  }

  // Fixes a wrong shade or circle, otherwise shades one more square that has to go.
  function hint() {
    if (solved) return
    let i = cells.findIndex((v, k) => v !== EMPTY && (v === SHADED) !== shaded[k])
    if (i < 0) i = shaded.findIndex((s, k) => s && cells[k] !== SHADED)
    if (i < 0) return
    const next = [...cells]
    next[i] = shaded[i] ? SHADED : CIRCLED
    update(next)
    flash(i)
    onHint()
  }

  return (
    <div className="stack">
      <div className="board hitori" style={{ '--cols': N, '--rows': N }}>
        {numbers.map((v, i) => (
          <button
            key={i}
            className={`cell ${cells[i] === SHADED ? 'shaded' : cells[i] === CIRCLED ? 'circled' : ''} ${bad.has(i) ? 'error' : ''} ${flashed === i ? 'hinted' : ''}`}
            onClick={() => tap(i)}
          >
            <span>{v}</span>
          </button>
        ))}
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
