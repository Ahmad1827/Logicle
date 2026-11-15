import { range } from '../../lib/random.js'

export const SIZE = 5
const N = SIZE

// A press flips the square and the ones directly above, below, left and right of it.
export function reach(i) {
  const r = Math.floor(i / N)
  const c = i % N
  const out = [i]
  if (r > 0) out.push(i - N)
  if (r < N - 1) out.push(i + N)
  if (c > 0) out.push(i - 1)
  if (c < N - 1) out.push(i + 1)
  return out
}

// Lights left on after pressing every square in `presses` (a 0/1 array) on top of `start`.
export function lightsAfter(start, presses) {
  const lights = [...start]
  presses.forEach((p, i) => p && reach(i).forEach((j) => (lights[j] ^= 1)))
  return lights
}

// On 5×5 these two press patterns change nothing, so any answer can be swapped with
// itself plus either or both of them. That's how the shortest answer is found.
const QUIET = [
  [0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0],
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
]

export function shortest(presses) {
  const [a, b] = QUIET
  const options = [presses, presses.map((v, i) => v ^ a[i]), presses.map((v, i) => v ^ b[i]), presses.map((v, i) => v ^ a[i] ^ b[i])]
  const count = (p) => p.filter(Boolean).length
  return options.reduce((best, p) => (count(p) < count(best) ? p : best))
}

export function generateFlip(rng) {
  // Press a random handful of squares on a dark board; the player has to undo them.
  let answer
  do {
    answer = Array(N * N).fill(0)
    for (const i of rng.shuffle(range(N * N)).slice(0, 7 + rng.int(4))) answer[i] = 1
    answer = shortest(answer)
  } while (answer.filter(Boolean).length < 6)
  return { start: lightsAfter(Array(N * N).fill(0), answer), answer }
}
