import { range } from '../../lib/random.js'

export const SIZE = 8
const N = SIZE

function orthogonal(i) {
  const r = Math.floor(i / N)
  const c = i % N
  return [r > 0 && i - N, r < N - 1 && i + N, c > 0 && i - 1, c < N - 1 && i + 1].filter((n) => n !== false)
}

export function around(i) {
  const r = Math.floor(i / N)
  const c = i % N
  const out = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr
      const cc = c + dc
      if ((dr || dc) && rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc)
    }
  }
  return out
}

// Can every tree be paired with its own neighbouring tent?
export function canPair(trees, tents) {
  const owner = new Map()
  function assign(t, seen) {
    for (const n of orthogonal(t)) {
      if (!tents.has(n) || seen.has(n)) continue
      seen.add(n)
      if (!owner.has(n) || assign(owner.get(n), seen)) {
        owner.set(n, t)
        return true
      }
    }
    return false
  }
  return [...trees].every((t) => assign(t, new Set()))
}

function countSolutions(trees, rows, cols, limit) {
  const allowed = range(N * N).map((i) => !trees.has(i) && orthogonal(i).some((n) => trees.has(n)))
  // Allowed cells still to come in each row / column, from index i onwards.
  const rowLeft = Array(N * N + 1).fill(0)
  const colLeft = Array(N * N + N).fill(0)
  for (let i = N * N - 1; i >= 0; i--) {
    rowLeft[i] = (i % N === N - 1 ? 0 : rowLeft[i + 1]) + (allowed[i] ? 1 : 0)
    colLeft[i] = (i + N < N * N ? colLeft[i + N] : 0) + (allowed[i] ? 1 : 0)
  }
  const tents = new Set()
  const rowCount = Array(N).fill(0)
  const colCount = Array(N).fill(0)
  let count = 0
  function step(i) {
    if (count >= limit) return
    if (i === N * N) {
      if (colCount.every((v, c) => v === cols[c]) && canPair(trees, tents)) count++
      return
    }
    const r = Math.floor(i / N)
    const c = i % N
    const next = () => {
      if (c === N - 1 && rowCount[r] !== rows[r]) return
      step(i + 1)
    }
    const needRow = rows[r] - rowCount[r]
    const needCol = cols[c] - colCount[c]
    if (allowed[i] && needRow > 0 && needCol > 0 && !around(i).some((n) => n < i && tents.has(n))) {
      tents.add(i)
      rowCount[r]++
      colCount[c]++
      next()
      tents.delete(i)
      rowCount[r]--
      colCount[c]--
    }
    // Leaving it empty is only possible if the rest of the row and column can still fill up.
    const restRow = rowLeft[i] - (allowed[i] ? 1 : 0)
    const restCol = colLeft[i] - (allowed[i] ? 1 : 0)
    if (restRow >= needRow && restCol >= needCol) next()
  }
  step(0)
  return count
}

export function generateTents(rng) {
  let result
  for (let attempt = 0; attempt < 200; attempt++) {
    const tents = new Set()
    const trees = new Set()
    for (const i of rng.shuffle(range(N * N))) {
      if (tents.size >= 12) break
      if (trees.has(i) || around(i).some((n) => tents.has(n))) continue
      const free = orthogonal(i).filter((n) => !trees.has(n) && !tents.has(n))
      if (!free.length) continue
      tents.add(i)
      trees.add(free[rng.int(free.length)])
    }
    const rows = range(N).map((r) => range(N).filter((c) => tents.has(r * N + c)).length)
    const cols = range(N).map((c) => range(N).filter((r) => tents.has(r * N + c)).length)
    result = { trees, tents, rows, cols }
    if (countSolutions(trees, rows, cols, 2) === 1) return result
  }
  return result
}
