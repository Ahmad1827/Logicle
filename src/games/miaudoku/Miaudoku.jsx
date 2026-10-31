import { useMemo, useRef, useState } from 'react'
import GameControls from '../../GameControls.jsx'
import { useHistory } from '../../lib/history.js'
import { vibrate } from '../../lib/native.js'
import { createRng } from '../../lib/random.js'
import { BulbOutlineIcon, CatIcon, CrossIcon, HeartIcon } from '../../icons.jsx'
import { generateMiaudoku } from './generate.js'

const COLORS = ['#f2a7c3', '#8fb8ec', '#b9e3a5', '#f3dc84', '#cdb5f2', '#a9dcf5', '#f6c19a']
const EMPTY = 0
const MARK = 1
const CAT = 2
const LIVES = 3
const HOLD_MS = 400
const DOUBLE_TAP_MS = 300

export default function Miaudoku({ seed, solved, onSolve, onMistake, onRandomize }) {
  const { size, regions, cats, starter } = useMemo(() => generateMiaudoku(createRng(seed)), [seed])
  const fresh = () => Array.from({ length: size * size }, (_, i) => (i === starter ? CAT : EMPTY))
  const history = useHistory(fresh)
  const cells = history.present
  const [lives, setLives] = useState(LIVES)
  const [wrong, setWrong] = useState(null)
  const press = useRef(null)
  const solution = new Set(cats)
  const out = lives === 0
  const locked = solved || out

  const row = (i) => Math.floor(i / size)
  const col = (i) => i % size
  // Can a cat at a share a row, column or region with b, or touch it?
  const clash = (a, b) =>
    a !== b &&
    (row(a) === row(b) ||
      col(a) === col(b) ||
      regions[a] === regions[b] ||
      (Math.abs(row(a) - row(b)) <= 1 && Math.abs(col(a) - col(b)) <= 1))

  function update(next, group) {
    history.commit(next, group)
    if (cats.every((i) => next[i] === CAT)) onSolve()
  }

  // Pass the tap that led here as `group` so tap + cat undo as one step.
  function placeCat(i, group) {
    if (locked || cells[i] === CAT) return
    const next = [...cells]
    if (solution.has(i)) {
      next[i] = CAT
      update(next, group)
      return
    }
    // A wrong cat costs a life, and the square gets crossed out.
    next[i] = MARK
    history.commit(next, group)
    setLives((n) => n - 1)
    setWrong(i)
    setTimeout(() => setWrong((w) => (w === i ? null : w)), 600)
    onMistake()
  }

  function setMark(i, value, group) {
    history.commit((prev) => {
      if (prev[i] === CAT || prev[i] === value) return prev
      const next = [...prev]
      next[i] = value
      return next
    }, group)
  }

  function down(e, i) {
    if (locked) return
    e.preventDefault()
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    if (e.button === 2) return placeCat(i)
    const last = press.current
    clearTimeout(last?.timer)
    if (last && last.cell === i && Date.now() - last.at < DOUBLE_TAP_MS) {
      press.current = null
      return placeCat(i, last)
    }
    const paint = cells[i] === MARK ? EMPTY : MARK
    const current = {
      cell: i,
      at: Date.now(),
      paint,
      dragging: true,
      timer: setTimeout(() => {
        if (press.current !== current || !current.dragging) return
        current.dragging = false
        vibrate()
        placeCat(i, current)
      }, HOLD_MS),
    }
    press.current = current
    setMark(i, paint, current)
  }

  function enter(i) {
    const p = press.current
    if (!p?.dragging || locked || p.cell === i) return
    clearTimeout(p.timer)
    p.at = 0 // a drag is never half of a double tap
    setMark(i, p.paint, p)
  }

  function up() {
    if (press.current) {
      clearTimeout(press.current.timer)
      press.current.dragging = false
    }
  }

  // Empty squares where a cat could still go.
  function candidates(state) {
    const placed = state.flatMap((v, i) => (v === CAT ? [i] : []))
    return state.flatMap((v, i) => (v === EMPTY && !placed.some((c) => clash(c, i)) ? [i] : []))
  }

  function autoX() {
    if (locked) return
    const open = new Set(candidates(cells))
    update(cells.map((v, i) => (v === EMPTY && !open.has(i) ? MARK : v)))
  }

  // One step of logic: fix a wrong cross, rule out what the cats forbid, place a forced cat,
  // or cross out a square whose cat would leave some row, column or region with no room.
  function hint() {
    if (locked) return
    const badMark = cats.find((i) => cells[i] === MARK)
    if (badMark !== undefined) return update(cells.map((v, i) => (i === badMark ? EMPTY : v)))
    const open = candidates(cells)
    const forbidden = cells.flatMap((v, i) => (v === EMPTY && !open.includes(i) ? [i] : []))
    if (forbidden.length) return autoX()
    const groups = []
    for (let k = 0; k < size; k++) {
      groups.push((i) => row(i) === k, (i) => col(i) === k, (i) => regions[i] === k)
    }
    const all = Array.from({ length: size * size }, (_, i) => i)
    for (const inGroup of groups) {
      if (all.some((i) => inGroup(i) && cells[i] === CAT)) continue
      const spots = open.filter(inGroup)
      if (spots.length === 1) return placeCat(spots[0])
    }
    for (const i of open) {
      const after = open.filter((j) => j !== i && !clash(i, j))
      const starves = groups.some(
        (inGroup) => !inGroup(i) && !all.some((j) => inGroup(j) && cells[j] === CAT) && !after.some(inGroup),
      )
      if (starves) return update(cells.map((v, j) => (j === i ? MARK : v)))
    }
    const spare = open.find((i) => !solution.has(i))
    if (spare !== undefined) update(cells.map((v, j) => (j === spare ? MARK : v)))
  }

  function retry() {
    history.reset()
    setLives(LIVES)
  }

  const border = (i, n) =>
    n === null || regions[n] !== regions[i] ? '2.5px solid var(--line-strong)' : '2.5px solid transparent'

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="hearts" aria-label={`${lives} lives left`}>
          {Array.from({ length: LIVES }, (_, k) => (
            <span key={k} className={k < lives ? '' : 'lost'}>
              <HeartIcon />
            </span>
          ))}
        </span>
        <div className="tools">
          <button onClick={autoX} disabled={locked}>
            <CrossIcon /> Auto-X
          </button>
          <button onClick={hint} disabled={locked}>
            <BulbOutlineIcon /> Hint
          </button>
        </div>
      </div>
      <div
        className={`board miaudoku ${out ? 'out' : ''}`}
        style={{ '--cols': size, '--rows': size }}
        onPointerUp={up}
        onPointerLeave={up}
        onContextMenu={(e) => e.preventDefault()}
      >
        {cells.map((v, i) => (
          <div
            key={i}
            className={`cell ${i === starter ? 'starter' : ''} ${wrong === i ? 'wrong' : ''}`}
            style={{
              borderTop: border(i, row(i) > 0 ? i - size : null),
              borderBottom: border(i, row(i) < size - 1 ? i + size : null),
              borderLeft: border(i, col(i) > 0 ? i - 1 : null),
              borderRight: border(i, col(i) < size - 1 ? i + 1 : null),
            }}
            onPointerDown={(e) => down(e, i)}
            onPointerEnter={() => enter(i)}
          >
            <span className={`tile ${v === CAT ? 'cat' : ''}`} style={{ background: COLORS[regions[i]] }}>
              {v === CAT ? <CatIcon /> : v === MARK ? <CrossIcon /> : null}
            </span>
          </div>
        ))}
      </div>
      <GameControls history={history} locked={locked} onRandomize={onRandomize} />
      {out && (
        <div className="out-of-lives">
          <p>Out of lives!</p>
          <button className="primary" onClick={retry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
