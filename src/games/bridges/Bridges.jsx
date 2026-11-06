import { useEffect, useMemo, useRef, useState } from 'react'
import GameControls from '../../GameControls.jsx'
import { useHistory } from '../../lib/history.js'
import { createRng, range } from '../../lib/random.js'
import { connected, crosses, edgeKey, findEdges, generateBridges, SIZE } from './generate.js'

const N = SIZE
const pos = (i) => ({ r: Math.floor(i / N), c: i % N })

export default function Bridges({ seed, solved, onSolve, onRandomize }) {
  const { islands, edges } = useMemo(() => {
    const { islands } = generateBridges(createRng(seed))
    return { islands, edges: findEdges(islands) }
  }, [seed])
  // Bridge counts keyed "a-b", kept as a plain object so the history can compare boards.
  const history = useHistory({})
  const count = history.present
  const [selected, setSelected] = useState(null)
  const dragFrom = useRef(null)

  const edgeBetween = (a, b) => edges.find((e) => edgeKey(e.a, e.b) === edgeKey(a, b))
  const degree = (a) => edges.reduce((n, e) => n + (e.a === a || e.b === a ? count[edgeKey(e.a, e.b)] ?? 0 : 0), 0)

  // 0 → 1 → 2 → 0. A new bridge may not cross one already built.
  function cycle(edge) {
    if (solved) return
    const key = edgeKey(edge.a, edge.b)
    const now = count[key] ?? 0
    if (!now && edges.some((f) => count[edgeKey(f.a, f.b)] && crosses(edge, f))) return
    const next = { ...count, [key]: (now + 1) % 3 }
    if (!next[key]) delete next[key]
    history.commit(next)
    const done = [...islands].every(([a, need]) =>
      edges.reduce((n, e) => n + (e.a === a || e.b === a ? next[edgeKey(e.a, e.b)] ?? 0 : 0), 0) === need,
    )
    if (done && connected(islands, Object.entries(next))) onSolve()
  }

  function pressIsland(e, i) {
    if (solved) return
    e.preventDefault()
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const edge = selected !== null && selected !== i && edgeBetween(selected, i)
    if (edge) {
      cycle(edge)
      setSelected(null)
      return
    }
    setSelected(selected === i ? null : i)
    dragFrom.current = i
  }

  // Dragging from one island onto its neighbour builds a bridge too.
  function enterIsland(i) {
    const from = dragFrom.current
    if (from === null || from === i) return
    dragFrom.current = null
    const edge = edgeBetween(from, i)
    if (edge) {
      cycle(edge)
      setSelected(null)
    }
  }

  useEffect(() => {
    const end = () => (dragFrom.current = null)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [])

  const targets = new Set(
    selected === null ? [] : edges.filter((e) => e.a === selected || e.b === selected).map((e) => (e.a === selected ? e.b : e.a)),
  )

  return (
    <div className="stack">
      <div className="board bridges" style={{ '--cols': N, '--rows': N }}>
        {range(N * N).map((i) => (
          <div
            key={i}
            className="cell"
            style={{ gridRow: pos(i).r + 1, gridColumn: pos(i).c + 1 }}
            onClick={() => setSelected(null)}
          />
        ))}
        {edges.map((edge) => {
          const n = count[edgeKey(edge.a, edge.b)]
          if (!n) return null
          const a = pos(edge.a)
          const b = pos(edge.b)
          const span = edge.horizontal ? b.c - a.c + 1 : b.r - a.r + 1
          return (
            <button
              key={edgeKey(edge.a, edge.b)}
              className={`bridge ${edge.horizontal ? 'across' : 'down'} ${n === 2 ? 'double' : ''}`}
              style={{ gridRow: `${a.r + 1} / ${b.r + 2}`, gridColumn: `${a.c + 1} / ${b.c + 2}`, '--span': span }}
              onClick={() => cycle(edge)}
              aria-label={`${n} bridge${n > 1 ? 's' : ''}`}
            />
          )
        })}
        {[...islands].map(([i, need]) => {
          const have = degree(i)
          const state = have > need ? 'over' : have === need ? 'done' : ''
          return (
            <button
              key={`i${i}`}
              className={`island ${state} ${selected === i ? 'selected' : ''} ${targets.has(i) ? 'target' : ''}`}
              style={{ gridRow: pos(i).r + 1, gridColumn: pos(i).c + 1 }}
              onPointerDown={(e) => pressIsland(e, i)}
              onPointerEnter={() => enterIsland(i)}
            >
              {need}
            </button>
          )
        })}
      </div>
      <GameControls history={history} locked={solved} onRandomize={onRandomize} />
    </div>
  )
}
