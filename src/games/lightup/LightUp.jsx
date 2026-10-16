import { useMemo, useState } from 'react'
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

export default function LightUp({ seed, solved, onSolve }) {
  const { board } = useMemo(() => generateLightUp(createRng(seed)), [seed])
  const [cells, setCells] = useState(() => Array(N * N).fill(EMPTY))
  const { lit, bad, numbers } = check(board, cells)

  function tap(i) {
    if (solved || board[i] !== WHITE) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    setCells(next)
    if (check(board, next).won) onSolve()
  }

  return (
    <div className="stack">
      <div className="board lightup" style={{ '--cols': N, '--rows': N }}>
        {board.map((v, i) =>
          v === WHITE ? (
            <button
              key={i}
              className={`cell ${lit.has(i) ? 'lit' : ''} ${bad.has(i) ? 'error' : ''}`}
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
    </div>
  )
}
