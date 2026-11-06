import { useEffect, useMemo, useRef, useState } from 'react'
import GameControls from '../../GameControls.jsx'
import { useHistory } from '../../lib/history.js'
import { createRng, range } from '../../lib/random.js'
import { generateShikaku, rectCells, SIZE } from './generate.js'

const N = SIZE

function spanning(a, b) {
  const [ra, ca, rb, cb] = [Math.floor(a / N), a % N, Math.floor(b / N), b % N]
  return { r0: Math.min(ra, rb), c0: Math.min(ca, cb), r1: Math.max(ra, rb), c1: Math.max(ca, cb) }
}

const inside = (rect, i) => {
  const r = Math.floor(i / N)
  const c = i % N
  return r >= rect.r0 && r <= rect.r1 && c >= rect.c0 && c <= rect.c1
}

const overlaps = (a, b) => a.r0 <= b.r1 && b.r0 <= a.r1 && a.c0 <= b.c1 && b.c0 <= a.c1

// A rectangle is right when it holds exactly one number and that number is its area.
function judge(clues, rect) {
  const cells = rectCells(rect)
  const numbers = cells.filter((j) => clues.has(j))
  const ok = numbers.length === 1 && clues.get(numbers[0]) === cells.length
  return { ok, clue: numbers[0] }
}

export default function Shikaku({ seed, solved, onSolve, onRandomize }) {
  const { clues } = useMemo(() => generateShikaku(createRng(seed)), [seed])
  const history = useHistory([])
  const rects = history.present
  const [drag, setDrag] = useState(null) // { from, to }
  const dragRef = useRef(null)
  dragRef.current = drag
  // Colour each rectangle by the number it holds, so it keeps its colour while being redrawn.
  const hue = useMemo(() => new Map([...clues.keys()].map((i, k) => [i, (k * 137.5 + 20) % 360])), [clues])

  function finish() {
    const d = dragRef.current
    if (!d) return
    setDrag(null)
    const rect = spanning(d.from, d.to)
    // A tap on a rectangle takes it away.
    if (d.from === d.to) {
      const hit = rects.find((r) => inside(r, d.from))
      if (hit) {
        history.commit(rects.filter((r) => r !== hit))
        return
      }
    }
    const next = [...rects.filter((r) => !overlaps(r, rect)), rect]
    history.commit(next)
    const covered = next.reduce((n, r) => n + rectCells(r).length, 0)
    if (covered === N * N && next.every((r) => judge(clues, r).ok)) onSolve()
  }

  // The drag can end anywhere, even off the board.
  useEffect(() => {
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    return () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
  })

  function start(e, i) {
    if (solved || e.button > 0) return
    e.preventDefault()
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setDrag({ from: i, to: i })
  }

  const place = (rect) => ({ gridRow: `${rect.r0 + 1} / ${rect.r1 + 2}`, gridColumn: `${rect.c0 + 1} / ${rect.c1 + 2}` })
  const preview = drag && drag.from !== drag.to ? spanning(drag.from, drag.to) : null

  return (
    <div className="stack">
      <div className="board shikaku" style={{ '--cols': N, '--rows': N }}>
        {range(N * N).map((i) => (
          <div
            key={i}
            className="cell"
            style={{ gridRow: Math.floor(i / N) + 1, gridColumn: (i % N) + 1 }}
            onPointerDown={(e) => start(e, i)}
            onPointerEnter={() => drag && setDrag({ ...drag, to: i })}
          />
        ))}
        {rects.map((rect) => {
          const { ok, clue } = judge(clues, rect)
          return (
            <div
              key={`${rect.r0}-${rect.c0}-${rect.r1}-${rect.c1}`}
              className={`rect ${ok ? 'ok' : 'wrong'}`}
              style={{ ...place(rect), '--hue': hue.get(clue) ?? 0 }}
            />
          )
        })}
        {preview && (
          <div className="rect preview" style={place(preview)}>
            <span>{rectCells(preview).length}</span>
          </div>
        )}
        {[...clues].map(([i, area]) => (
          <span key={`n${i}`} className="number" style={{ gridRow: Math.floor(i / N) + 1, gridColumn: (i % N) + 1 }}>
            {area}
          </span>
        ))}
      </div>
      <GameControls history={history} locked={solved} onRandomize={onRandomize} />
    </div>
  )
}
