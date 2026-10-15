import { range } from '../../lib/random.js'

export const W = 9
export const H = 9
export const MINES = 10

export function neighbors(i) {
  const r = Math.floor(i / W)
  const c = i % W
  const out = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < H && nc >= 0 && nc < W) out.push(nr * W + nc)
    }
  }
  return out
}

// Reveals cell i, flooding outwards through zeros. Mutates `revealed`.
export function floodReveal(i, revealed, counts, blocked = () => false) {
  const stack = [i]
  while (stack.length) {
    const j = stack.pop()
    if (revealed[j] || blocked(j)) continue
    revealed[j] = true
    if (counts[j] === 0) stack.push(...neighbors(j))
  }
}

// Plays the board using only deductions (single-cell + subset rules).
// Returns true if the whole board can be cleared without guessing.
function solvableWithoutGuessing(mine, counts, start) {
  const revealed = Array(W * H).fill(false)
  const flagged = Array(W * H).fill(false)
  floodReveal(start, revealed, counts)

  let changed = true
  while (changed) {
    changed = false
    const constraints = []
    for (let i = 0; i < W * H; i++) {
      if (!revealed[i]) continue
      const unknown = neighbors(i).filter((n) => !revealed[n] && !flagged[n])
      if (!unknown.length) continue
      const flags = neighbors(i).filter((n) => flagged[n]).length
      constraints.push({ cells: unknown, need: counts[i] - flags })
    }

    const apply = (cells, isMine) => {
      for (const n of cells) {
        if (revealed[n] || flagged[n]) continue
        if (isMine) flagged[n] = true
        else floodReveal(n, revealed, counts)
        changed = true
      }
    }

    for (const { cells, need } of constraints) {
      if (need === 0) apply(cells, false)
      else if (need === cells.length) apply(cells, true)
    }
    if (changed) continue

    for (const a of constraints) {
      for (const b of constraints) {
        if (a === b || a.cells.length >= b.cells.length) continue
        if (!a.cells.every((x) => b.cells.includes(x))) continue
        const diff = b.cells.filter((x) => !a.cells.includes(x))
        const need = b.need - a.need
        if (need === 0) apply(diff, false)
        else if (need === diff.length) apply(diff, true)
      }
    }
  }

  return revealed.filter(Boolean).length === W * H - MINES
}

export function generateMinesweeper(rng) {
  let board
  for (let attempt = 0; attempt < 5000; attempt++) {
    const start = (2 + rng.int(H - 4)) * W + 2 + rng.int(W - 4)
    const safe = new Set([start, ...neighbors(start)])
    const pool = rng.shuffle(range(W * H).filter((i) => !safe.has(i)))
    const mine = Array(W * H).fill(false)
    pool.slice(0, MINES).forEach((i) => (mine[i] = true))
    const counts = range(W * H).map((i) => neighbors(i).filter((n) => mine[n]).length)
    board = { mine, counts, start }
    if (solvableWithoutGuessing(mine, counts, start)) return board
  }
  return board
}
