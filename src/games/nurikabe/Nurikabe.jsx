import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useHistory } from '../../lib/history.js'
import { createRng, range } from '../../lib/random.js'
import { DotIcon } from '../../icons.jsx'
import { blockCells, generateNurikabe, neighbours, SIZE } from './generate.js'

const N = SIZE
const EMPTY = 0
const SEA = 1
const DOT = 2

function flood(start, pass) {
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    for (const n of neighbours(stack.pop())) {
      if (pass(n) && !seen.has(n)) {
        seen.add(n)
        stack.push(n)
      }
    }
  }
  return seen
}

function check(clues, cells) {
  const bad = new Set()
  const clueState = new Map()
  // 2×2 pools of sea.
  for (let i = 0; i < N * N; i++) {
    if (i % N === N - 1 || i >= N * (N - 1)) continue
    const block = blockCells(i)
    if (block.every((j) => cells[j] === SEA)) block.forEach((j) => bad.add(j))
  }
  for (const [i, size] of clues) {
    // Squares already marked as island that join this number.
    const marked = flood(i, (j) => cells[j] === DOT || clues.has(j))
    const others = [...marked].filter((j) => j !== i && clues.has(j))
    if (others.length || marked.size > size) {
      marked.forEach((j) => bad.add(j))
      clueState.set(i, 'over')
      continue
    }
    // Walled in by sea at exactly the right size.
    const room = flood(i, (j) => cells[j] !== SEA)
    if (room.size === size) clueState.set(i, 'done')
  }
  return { bad, clueState }
}

export default function Nurikabe({ seed, solved, onSolve, onRandomize }) {
  const { clues, sea } = useMemo(() => generateNurikabe(createRng(seed)), [seed])
  const history = useHistory(() => Array(N * N).fill(EMPTY))
  const cells = history.present
  const { bad, clueState } = check(clues, cells)

  function tap(i) {
    if (solved || clues.has(i)) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    history.commit(next)
    if (next.every((v, j) => (v === SEA) === sea[j])) onSolve()
  }

  return (
    <div className="stack">
      <div className="board nurikabe" style={{ '--cols': N, '--rows': N }}>
        {range(N * N).map((i) =>
          clues.has(i) ? (
            <span key={i} className={`cell clue ${clueState.get(i) ?? ''}`}>
              {clues.get(i)}
            </span>
          ) : (
            <button
              key={i}
              className={`cell ${cells[i] === SEA ? 'sea' : ''} ${bad.has(i) ? 'error' : ''}`}
              onClick={() => tap(i)}
            >
              {cells[i] === DOT && <DotIcon />}
            </button>
          ),
        )}
      </div>
      <GameControls history={history} locked={solved} onRandomize={onRandomize} />
    </div>
  )
}
