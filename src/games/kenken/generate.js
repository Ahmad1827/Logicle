import { range } from '../../lib/random.js'

export const SIZE = 6
const N = SIZE

function latinSquare(rng) {
  const rows = rng.shuffle(range(N))
  const cols = rng.shuffle(range(N))
  const symbols = rng.shuffle(range(N).map((v) => v + 1))
  const grid = Array(N * N)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) grid[r * N + c] = symbols[(rows[r] + cols[c]) % N]
  }
  return grid
}

function adjacent(i) {
  const r = Math.floor(i / N)
  const c = i % N
  return [r > 0 && i - N, r < N - 1 && i + N, c > 0 && i - 1, c < N - 1 && i + 1].filter((n) => n !== false)
}

function makeCages(rng) {
  const cageOf = Array(N * N).fill(-1)
  const cages = []
  for (const start of rng.shuffle(range(N * N))) {
    if (cageOf[start] !== -1) continue
    const roll = rng.next()
    const size = roll < 0.06 ? 1 : roll < 0.5 ? 2 : roll < 0.85 ? 3 : 4
    const cells = [start]
    cageOf[start] = cages.length
    while (cells.length < size) {
      const frontier = [...new Set(cells.flatMap(adjacent))].filter((n) => cageOf[n] === -1)
      if (!frontier.length) break
      const next = frontier[rng.int(frontier.length)]
      cageOf[next] = cages.length
      cells.push(next)
    }
    cages.push(cells)
  }
  return { cages, cageOf }
}

function chooseOp(values, rng) {
  if (values.length === 1) return { op: '', target: values[0] }
  if (values.length === 2) {
    const [a, b] = [Math.max(...values), Math.min(...values)]
    if (a % b === 0 && rng.next() < 0.5) return { op: '÷', target: a / b }
    const roll = rng.next()
    if (roll < 0.45) return { op: '−', target: a - b }
    if (roll < 0.75) return { op: '+', target: a + b }
    return { op: '×', target: a * b }
  }
  return rng.next() < 0.55
    ? { op: '+', target: values.reduce((s, v) => s + v, 0) }
    : { op: '×', target: values.reduce((p, v) => p * v, 1) }
}

export function cageSatisfied(cage, values) {
  const { op, target } = cage
  if (op === '') return values[0] === target
  if (op === '+') return values.reduce((s, v) => s + v, 0) === target
  if (op === '×') return values.reduce((p, v) => p * v, 1) === target
  const [a, b] = [Math.max(...values), Math.min(...values)]
  if (op === '−') return a - b === target
  return a === b * target
}

function countSolutions(cages, cageOf, limit = 2) {
  const grid = Array(N * N).fill(0)
  const rowUsed = Array(N).fill(0)
  const colUsed = Array(N).fill(0)
  let count = 0

  function cageOk(cage) {
    const values = cage.cells.map((i) => grid[i])
    const filled = values.filter(Boolean)
    if (filled.length === values.length) return cageSatisfied(cage, values)
    const missing = values.length - filled.length
    if (cage.op === '+') {
      const sum = filled.reduce((s, v) => s + v, 0)
      return sum + missing <= cage.target && sum + missing * N >= cage.target
    }
    if (cage.op === '×') return cage.target % filled.reduce((p, v) => p * v, 1) === 0
    return true
  }

  function place(i) {
    if (i === N * N) {
      count++
      return
    }
    const r = Math.floor(i / N)
    const c = i % N
    for (let v = 1; v <= N && count < limit; v++) {
      const bit = 1 << v
      if (rowUsed[r] & bit || colUsed[c] & bit) continue
      grid[i] = v
      rowUsed[r] |= bit
      colUsed[c] |= bit
      if (cageOk(cages[cageOf[i]])) place(i + 1)
      rowUsed[r] &= ~bit
      colUsed[c] &= ~bit
      grid[i] = 0
    }
  }
  place(0)
  return count
}

export function generateKenKen(rng) {
  let result
  for (let attempt = 0; attempt < 500; attempt++) {
    const solution = latinSquare(rng)
    const { cages: cells, cageOf } = makeCages(rng)
    if (cells.filter((c) => c.length === 1).length > 2) continue
    const cages = cells.map((group) => ({ cells: group, ...chooseOp(group.map((i) => solution[i]), rng) }))
    result = { solution, cages, cageOf }
    if (countSolutions(cages, cageOf) === 1) return result
  }
  return result
}
