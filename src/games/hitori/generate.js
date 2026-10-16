import { range } from '../../lib/random.js'

export const SIZE = 6
const N = SIZE

export function neighbours(i) {
  const r = Math.floor(i / N)
  const c = i % N
  return [r > 0 && i - N, r < N - 1 && i + N, c > 0 && i - 1, c < N - 1 && i + 1].filter((n) => n !== false)
}

export function whiteConnected(shaded) {
  const start = range(N * N).find((i) => !shaded[i])
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    for (const n of neighbours(stack.pop())) {
      if (!shaded[n] && !seen.has(n)) {
        seen.add(n)
        stack.push(n)
      }
    }
  }
  return seen.size === shaded.filter((s) => !s).length
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

// Only squares whose number repeats in their row or column are ever shaded.
function countSolutions(numbers, limit) {
  const repeats = numbers.map((v, i) => {
    const r = Math.floor(i / N)
    const c = i % N
    return range(N).some((k) => (k !== c && numbers[r * N + k] === v) || (k !== r && numbers[k * N + c] === v))
  })
  const shaded = Array(N * N).fill(false)
  const rowSeen = range(N).map(() => new Set())
  const colSeen = range(N).map(() => new Set())
  let count = 0
  function step(i) {
    if (count >= limit) return
    if (i === N * N) {
      if (whiteConnected(shaded)) count++
      return
    }
    const r = Math.floor(i / N)
    const c = i % N
    const v = numbers[i]
    if (!rowSeen[r].has(v) && !colSeen[c].has(v)) {
      rowSeen[r].add(v)
      colSeen[c].add(v)
      step(i + 1)
      rowSeen[r].delete(v)
      colSeen[c].delete(v)
    }
    if (repeats[i] && !(r > 0 && shaded[i - N]) && !(c > 0 && shaded[i - 1])) {
      shaded[i] = true
      step(i + 1)
      shaded[i] = false
    }
  }
  step(0)
  return count
}

export function generateHitori(rng) {
  let result
  for (let attempt = 0; attempt < 300; attempt++) {
    const solution = randomLatin(rng)
    const shaded = Array(N * N).fill(false)
    for (const i of rng.shuffle(range(N * N))) {
      if (shaded.filter(Boolean).length >= 11) break
      if (neighbours(i).some((n) => shaded[n])) continue
      shaded[i] = true
      if (!whiteConnected(shaded)) shaded[i] = false
    }
    // Give each shaded square the number of a white square in its row or column.
    const numbers = [...solution]
    for (let i = 0; i < N * N; i++) {
      if (!shaded[i]) continue
      const r = Math.floor(i / N)
      const c = i % N
      const options = range(N)
        .flatMap((k) => [r * N + k, k * N + c])
        .filter((j) => j !== i && !shaded[j])
        .map((j) => solution[j])
      numbers[i] = options[rng.int(options.length)]
    }
    result = { numbers, shaded }
    if (countSolutions(numbers, 2) === 1) return result
  }
  return result
}
