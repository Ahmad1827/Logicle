import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng } from '../../lib/random.js'
import { BulbIcon, DotIcon } from '../../icons.jsx'
import { generateLightUp, neighbours, sightLines, SIZE, WHITE } from './generate.js'

const N = SIZE
const EMPTY = 0
const MARK = 1
const BULB = 2

function check(board, cells) {
  const lit = new Set()
  const bad = new Set()
  cells.forEach((v, i) => {
    if (v !== BULB) return
    for (const j of sightLines(board, i)) {
      lit.add(j)
      if (j !== i && cells[j] === BULB) bad.add(i)
    }
  })
  const numbers = new Map()
  board.forEach((v, i) => {
    if (v < 0) return
    const have = neighbours(i).filter((j) => cells[j] === BULB).length
    numbers.set(i, have > v ? 'over' : have === v ? 'done' : '')
  })
  const allLit = board.every((v, i) => v !== WHITE || lit.has(i))
  const won = allLit && bad.size === 0 && [...numbers.values()].every((s) => s === 'done')
  return { lit, bad, numbers, won }
}

export default function LightUp({ seed, solved, onSolve, onHint, onRandomize }) {
  const { board, bulbs } = useMemo(() => generateLightUp(createRng(seed)), [seed])
  const history = useHistory(() => Array(N * N).fill(EMPTY))
  const cells = history.present
  const { lit, bad, numbers } = check(board, cells)
  const [flashed, flash] = useFlash()

  function tap(i) {
    if (solved || board[i] !== WHITE) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    update(next)
  }

  function update(next) {
    history.commit(next)
    if (check(board, next).won) onSolve()
  }

  // Fixes a wrong bulb or mark, otherwise places a bulb, beside a number if one still needs it.
  function hint() {
    if (solved) return
    let i = cells.findIndex((v, k) => v !== EMPTY && (v === BULB) !== bulbs.has(k))
    if (i < 0) {
      const missing = [...bulbs].filter((k) => cells[k] !== BULB)
      if (!missing.length) return
      i = missing.find((k) => neighbours(k).some((j) => board[j] > 0)) ?? missing[0]
    }
    const next = [...cells]
    next[i] = bulbs.has(i) ? BULB : MARK
    update(next)
    flash(i)
    onHint()
  }

  return (
    <div className="stack">
      <div className="board lightup" style={{ '--cols': N, '--rows': N }}>
        {board.map((v, i) =>
          v === WHITE ? (
            <button
              key={i}
              className={`cell ${lit.has(i) ? 'lit' : ''} ${bad.has(i) ? 'error' : ''} ${flashed === i ? 'hinted' : ''}`}
              onClick={() => tap(i)}
            >
              {cells[i] === BULB ? <BulbIcon /> : cells[i] === MARK && !lit.has(i) ? <DotIcon /> : null}
            </button>
          ) : (
            <span key={i} className={`cell wall ${numbers.get(i) ?? ''}`}>
              {v >= 0 ? v : ''}
            </span>
          ),
        )}
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
