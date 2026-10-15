import { range } from '../../lib/random.js'

export const N = 9
export const BOX = 3
const ALL = 0b1111111110 // bits 1..9

const UNITS = []
for (let r = 0; r < N; r++) UNITS.push(range(N).map((c) => r * N + c))
for (let c = 0; c < N; c++) UNITS.push(range(N).map((r) => r * N + c))
for (let b = 0; b < N; b++) {
  const br = Math.floor(b / BOX) * BOX
  const bc = (b % BOX) * BOX
  UNITS.push(range(N).map((k) => (br + Math.floor(k / BOX)) * N + bc + (k % BOX)))
}

export const PEERS = range(N * N).map((i) => {
  const peers = new Set()
  for (const unit of UNITS) if (unit.includes(i)) unit.forEach((p) => p !== i && peers.add(p))
  return [...peers]
})

function candidates(grid, i) {
  let used = 0
  for (const p of PEERS[i]) used |= 1 << grid[p]
  return ALL & ~used
}

function digits(mask) {
  const out = []
  for (let v = 1; v <= N; v++) if (mask & (1 << v)) out.push(v)
  return out
}

function fill(grid, rng) {
  let best = -1
  let bestMask = 0
  let bestCount = 10
  for (let i = 0; i < N * N; i++) {
    if (grid[i]) continue
    const mask = candidates(grid, i)
    const count = digits(mask).length
    if (count < bestCount) {
      best = i
      bestMask = mask
      bestCount = count
    }
  }
  if (best < 0) return true
  for (const v of rng.shuffle(digits(bestMask))) {
    grid[best] = v
    if (fill(grid, rng)) return true
  }
  grid[best] = 0
  return false
}

// Solves using only naked and hidden singles. If that fills the grid, the puzzle
// is unique and can be finished by plain logic, with no guessing.
function solvableBySingles(puzzle) {
  const grid = [...puzzle]
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < N * N; i++) {
      if (grid[i]) continue
      const mask = candidates(grid, i)
      if (!mask) return false
      if ((mask & (mask - 1)) === 0) {
        grid[i] = Math.log2(mask)
        changed = true
      }
    }
    for (const unit of UNITS) {
      for (let v = 1; v <= N; v++) {
        if (unit.some((i) => grid[i] === v)) continue
        const spots = unit.filter((i) => !grid[i] && candidates(grid, i) & (1 << v))
        if (!spots.length) return false
        if (spots.length === 1) {
          grid[spots[0]] = v
          changed = true
        }
      }
    }
  }
  return grid.every(Boolean)
}

export function generateSudoku(rng) {
  const solution = Array(N * N).fill(0)
  fill(solution, rng)
  const puzzle = [...solution]
  for (const i of rng.shuffle(range(N * N))) {
    const v = puzzle[i]
    puzzle[i] = 0
    if (!solvableBySingles(puzzle)) puzzle[i] = v
  }
  return { puzzle, solution }
}
