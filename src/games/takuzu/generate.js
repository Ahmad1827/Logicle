import { range } from '../../lib/random.js'

export const SIZE = 8
const N = SIZE
const HALF = N / 2

function hasTriple(line) {
  for (let i = 2; i < line.length; i++) {
    if (line[i] !== -1 && line[i] === line[i - 1] && line[i] === line[i - 2]) return true
  }
  return false
}

// Every full line that is balanced and has no three-in-a-row.
const VALID_LINES = range(1 << N)
  .map((mask) => range(N).map((k) => (mask >> k) & 1))
  .filter((line) => line.filter(Boolean).length === HALF && !hasTriple(line))

const rowOf = (grid, r) => grid.slice(r * N, r * N + N)
const colOf = (grid, c) => range(N).map((r) => grid[r * N + c])

function randomSolution(rng) {
  const grid = Array(N * N).fill(-1)
  function ok(i) {
    const r = Math.floor(i / N)
    const c = i % N
    const row = rowOf(grid, r).slice(0, c + 1)
    const col = colOf(grid, c).slice(0, r + 1)
    if (hasTriple(row) || hasTriple(col)) return false
    for (const line of [row, col]) {
      if (line.filter((v) => v === 1).length > HALF || line.filter((v) => v === 0).length > HALF) return false
    }
    if (c === N - 1) {
      const full = rowOf(grid, r).join()
      for (let rr = 0; rr < r; rr++) if (rowOf(grid, rr).join() === full) return false
    }
    if (r === N - 1) {
      const full = colOf(grid, c).join()
      for (let cc = 0; cc < c; cc++) if (colOf(grid, cc).join() === full) return false
    }
    return true
  }
  function fill(i) {
    if (i === N * N) return true
    for (const v of rng.shuffle([0, 1])) {
      grid[i] = v
      if (ok(i) && fill(i + 1)) return true
    }
    grid[i] = -1
    return false
  }
  fill(0)
  return grid
}

// Line logic: keep only the valid full lines that match what's known (and don't
// duplicate a finished line), then fill every cell they all agree on.
function solvableByLogic(puzzle) {
  const grid = [...puzzle]
  let changed = true
  while (changed) {
    changed = false
    for (const isRow of [true, false]) {
      const lines = range(N).map((k) => (isRow ? rowOf(grid, k) : colOf(grid, k)))
      const finished = lines.filter((l) => !l.includes(-1)).map((l) => l.join())
      for (let k = 0; k < N; k++) {
        const line = lines[k]
        if (!line.includes(-1)) continue
        const options = VALID_LINES.filter(
          (opt) => opt.every((v, j) => line[j] === -1 || line[j] === v) && !finished.includes(opt.join()),
        )
        if (!options.length) return false
        for (let j = 0; j < N; j++) {
          if (line[j] !== -1) continue
          const v = options[0][j]
          if (options.every((opt) => opt[j] === v)) {
            grid[isRow ? k * N + j : j * N + k] = v
            changed = true
          }
        }
      }
    }
  }
  return !grid.includes(-1)
}

export function generateTakuzu(rng) {
  const solution = randomSolution(rng)
  const puzzle = [...solution]
  for (const i of rng.shuffle(range(N * N))) {
    const v = puzzle[i]
    puzzle[i] = -1
    if (!solvableByLogic(puzzle)) puzzle[i] = v
  }
  return { puzzle, solution }
}
