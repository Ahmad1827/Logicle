import { range } from '../../lib/random.js'

export const SIZE = 5
const N = SIZE

// How many buildings you see looking along a line: each one taller than all before it.
export function visible(line) {
  let seen = 0
  let tallest = 0
  for (const h of line) {
    if (h > tallest) {
      seen++
      tallest = h
    }
  }
  return seen
}

function randomLatin(rng) {
  const grid = Array(N * N).fill(0)
  function fill(i) {
    if (i === N * N) return true
    const r = Math.floor(i / N)
    const c = i % N
    for (const v of rng.shuffle(range(N).map((k) => k + 1))) {
      let ok = true
      for (let k = 0; k < N && ok; k++) {
        if ((k < c && grid[r * N + k] === v) || (k < r && grid[k * N + c] === v)) ok = false
      }
      if (!ok) continue
      grid[i] = v
      if (fill(i + 1)) return true
    }
    grid[i] = 0
    return false
  }
  fill(0)
  return grid
}

function permutations(items) {
  if (items.length <= 1) return [items]
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((p) => [x, ...p]))
}

const PERMS = permutations(range(N).map((k) => k + 1))

// Clues are 0 when hidden. Rows are filled one whole permutation at a time; the
// row clues filter the permutations and the column clues prune as rows are added.
function countSolutions({ top, bottom, left, right }, givens, limit) {
  const rowOptions = range(N).map((r) =>
    PERMS.filter(
      (p) =>
        (!left[r] || visible(p) === left[r]) &&
        (!right[r] || visible([...p].reverse()) === right[r]) &&
        p.every((v, c) => !givens[r * N + c] || givens[r * N + c] === v),
    ),
  )
  // Per column: digits used, tallest so far and how many are visible from the top.
  const used = Array(N).fill(0)
  const tallest = Array(N).fill(0)
  const seen = Array(N).fill(0)
  const rows = []
  let count = 0
  function fits(p) {
    for (let c = 0; c < N; c++) {
      const v = p[c]
      if (used[c] & (1 << v)) return false
      if (top[c] && v > tallest[c] && seen[c] + 1 > top[c]) return false
      // Once the tallest building is placed, nothing further changes the view from the top.
      if (top[c] && v === N && seen[c] + 1 !== top[c]) return false
    }
    return true
  }
  function step(r) {
    if (count >= limit) return
    if (r === N) {
      for (let c = 0; c < N; c++) {
        if (bottom[c] && visible(rows.map((p) => p[c]).reverse()) !== bottom[c]) return
      }
      count++
      return
    }
    for (const p of rowOptions[r]) {
      if (!fits(p)) continue
      const savedTallest = tallest.slice()
      const savedSeen = seen.slice()
      for (let c = 0; c < N; c++) {
        used[c] |= 1 << p[c]
        if (p[c] > tallest[c]) {
          tallest[c] = p[c]
          seen[c]++
        }
      }
      rows.push(p)
      step(r + 1)
      rows.pop()
      for (let c = 0; c < N; c++) {
        used[c] &= ~(1 << p[c])
        tallest[c] = savedTallest[c]
        seen[c] = savedSeen[c]
      }
      if (count >= limit) return
    }
  }
  step(0)
  return count
}

export function generateSkyscrapers(rng) {
  const solution = randomLatin(rng)
  const row = (r) => range(N).map((c) => solution[r * N + c])
  const col = (c) => range(N).map((r) => solution[r * N + c])
  const clues = {
    top: range(N).map((c) => visible(col(c))),
    bottom: range(N).map((c) => visible(col(c).reverse())),
    left: range(N).map((r) => visible(row(r))),
    right: range(N).map((r) => visible(row(r).reverse())),
  }
  const givens = Array(N * N).fill(0)
  // A few grids are not pinned down by their clues alone; give a square until they are.
  for (const i of rng.shuffle(range(N * N))) {
    if (countSolutions(clues, givens, 2) === 1) break
    givens[i] = solution[i]
  }
  // Then hide clues while the answer stays unique.
  const slots = ['top', 'bottom', 'left', 'right'].flatMap((side) => range(N).map((k) => [side, k]))
  for (const [side, k] of rng.shuffle(slots)) {
    const v = clues[side][k]
    clues[side][k] = 0
    if (countSolutions(clues, givens, 2) !== 1) clues[side][k] = v
  }
  return { solution, givens, clues }
}
