import { range } from '../../lib/random.js'

export const SIZE = 8

// Every helper takes the board size, so Miaudoku can reuse them on smaller boards.

// One queen per row, no two in the same column or touching (incl. diagonally).
function randomQueens(rng, size) {
  const cols = []
  const used = new Set()
  function place(r) {
    if (r === size) return true
    for (const c of rng.shuffle(range(size))) {
      if (used.has(c)) continue
      if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue
      cols.push(c)
      used.add(c)
      if (place(r + 1)) return true
      cols.pop()
      used.delete(c)
    }
    return false
  }
  place(0)
  return cols
}

function adjacent(i, size) {
  const r = Math.floor(i / size)
  const c = i % size
  return [r > 0 && i - size, r < size - 1 && i + size, c > 0 && i - 1, c < size - 1 && i + 1].filter(
    (n) => n !== false,
  )
}

// Grow one region from each queen until the board is covered.
function growRegions(queenCols, rng, size) {
  const regions = Array(size * size).fill(-1)
  queenCols.forEach((c, r) => (regions[r * size + c] = r))
  for (let left = size * size - size; left > 0; left--) {
    const options = []
    for (let i = 0; i < size * size; i++) {
      if (regions[i] !== -1) continue
      for (const n of adjacent(i, size)) if (regions[n] !== -1) options.push([i, regions[n]])
    }
    const [i, region] = options[rng.int(options.length)]
    regions[i] = region
  }
  return regions
}

function isConnected(regions, region, size) {
  const cells = []
  regions.forEach((v, i) => v === region && cells.push(i))
  const seen = new Set([cells[0]])
  const stack = [cells[0]]
  while (stack.length) {
    for (const n of adjacent(stack.pop(), size)) {
      if (regions[n] === region && !seen.has(n)) {
        seen.add(n)
        stack.push(n)
      }
    }
  }
  return seen.size === cells.length
}

function countSolutions(regions, limit, size) {
  const usedCols = new Set()
  const usedRegions = new Set()
  let count = 0
  function place(r, prevCol) {
    if (r === size) {
      count++
      return
    }
    for (let c = 0; c < size && count < limit; c++) {
      const region = regions[r * size + c]
      if (usedCols.has(c) || usedRegions.has(region)) continue
      if (r > 0 && Math.abs(prevCol - c) <= 1) continue
      usedCols.add(c)
      usedRegions.add(region)
      place(r + 1, c)
      usedCols.delete(c)
      usedRegions.delete(region)
    }
  }
  place(0, -10)
  return count
}

// Start from random regions, then keep moving border cells between regions,
// accepting moves that don't increase the number of solutions, until only one is left.
// Regions never shrink below 2 cells, so no queen is given away for free.
export function generateQueens(rng, size = SIZE) {
  let result
  for (let attempt = 0; attempt < 50; attempt++) {
    const queens = randomQueens(rng, size)
    const queenCells = new Set(queens.map((c, r) => r * size + c))
    const regions = growRegions(queens, rng, size)
    let solutions = countSolutions(regions, 1000, size)
    for (let step = 0; step < 3000 && solutions > 1; step++) {
      const i = rng.int(size * size)
      if (queenCells.has(i)) continue
      const options = adjacent(i, size).filter((n) => regions[n] !== regions[i])
      const old = regions[i]
      if (!options.length || regions.filter((v) => v === old).length <= 2) continue
      regions[i] = regions[options[rng.int(options.length)]]
      const count = isConnected(regions, old, size) ? countSolutions(regions, 1000, size) : Infinity
      if (count <= solutions) solutions = count
      else regions[i] = old
    }
    result = { regions, queens }
    if (solutions === 1) return result
  }
  return result
}
