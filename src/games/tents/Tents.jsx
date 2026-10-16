import { useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { DotIcon, TentIcon, TreeIcon } from '../../icons.jsx'
import { around, generateTents, SIZE } from './generate.js'

const N = SIZE
const EMPTY = 0
const GRASS = 1
const TENT = 2

export default function Tents({ seed, solved, onSolve }) {
  const { trees, tents, rows, cols } = useMemo(() => generateTents(createRng(seed)), [seed])
  const [cells, setCells] = useState(() => Array(N * N).fill(EMPTY))
  const isTent = (i) => cells[i] === TENT
  const touching = new Set(cells.flatMap((v, i) => (v === TENT && around(i).some(isTent) ? [i] : [])))
  const rowTents = rows.map((_, r) => cells.slice(r * N, r * N + N).filter((v) => v === TENT).length)
  const colTents = cols.map((_, c) => cells.filter((v, i) => i % N === c && v === TENT).length)
  const clueState = (have, want) => (have > want ? 'over' : have === want ? 'done' : '')

  function tap(i) {
    if (solved || trees.has(i)) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    setCells(next)
    if (next.every((v, k) => (v === TENT) === tents.has(k))) onSolve()
  }

  return (
    <div className="stack">
      <div className="board tents" style={{ '--cols': N + 1, '--rows': N + 1 }}>
        <span />
        {cols.map((n, c) => (
          <span key={c} className={`count ${clueState(colTents[c], n)}`}>
            {n}
          </span>
        ))}
        {rows.map((n, r) => [
          <span key={`r${r}`} className={`count ${clueState(rowTents[r], n)}`}>
            {n}
          </span>,
          ...Array.from({ length: N }, (_, c) => {
            const i = r * N + c
            const v = cells[i]
            return (
              <button
                key={i}
                className={`cell ${trees.has(i) ? 'tree' : v === GRASS ? 'grass' : ''} ${touching.has(i) ? 'error' : ''}`}
                onClick={() => tap(i)}
              >
                {trees.has(i) ? <TreeIcon /> : v === TENT ? <TentIcon /> : v === GRASS ? <DotIcon /> : null}
              </button>
            )
          }),
        ])}
      </div>
    </div>
  )
}
