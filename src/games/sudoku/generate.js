import { range } from '../../lib/random.js'

export const N = 6
export const BOX_ROWS = 2
export const BOX_COLS = 3
const MIN_GIVENS = 12

function canPlace(grid, i, v) {
  const r = Math.floor(i / N)
  const c = i % N
  for (let k = 0; k < N; k++) {
    if (grid[r * N + k] === v || grid[k * N + c] === v) return false
  }
  const br = r - (r % BOX_ROWS)
  const bc = c - (c % BOX_COLS)
  for (let rr = 0; rr < BOX_ROWS; rr++) {
    for (let cc = 0; cc < BOX_COLS; cc++) {
      if (grid[(br + rr) * N + bc + cc] === v) return false
    }
  }
  return true
}

function fill(grid, rng) {
  const i = grid.indexOf(0)
  if (i < 0) return true
  for (const v of rng.shuffle(range(N).map((x) => x + 1))) {
    if (canPlace(grid, i, v)) {
      grid[i] = v
      if (fill(grid, rng)) return true
      grid[i] = 0
    }
  }
  return false
}

function countSolutions(grid, limit) {
  const i = grid.indexOf(0)
  if (i < 0) return 1
  let count = 0
  for (let v = 1; v <= N && count < limit; v++) {
    if (canPlace(grid, i, v)) {
      grid[i] = v
      count += countSolutions(grid, limit - count)
      grid[i] = 0
    }
  }
  return count
}

export function generateSudoku(rng) {
  const solution = Array(N * N).fill(0)
  fill(solution, rng)
  const puzzle = [...solution]
  let givens = N * N
  for (const i of rng.shuffle(range(N * N))) {
    if (givens <= MIN_GIVENS) break
    const v = puzzle[i]
    puzzle[i] = 0
    if (countSolutions([...puzzle], 2) === 1) givens--
    else puzzle[i] = v
  }
  return { puzzle, solution }
}
