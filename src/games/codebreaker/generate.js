import { range } from '../../lib/random.js'

export const SLOTS = 4
export const COLOURS = 6

// Colours may repeat in the code.
export function generateCode(rng) {
  return range(SLOTS).map(() => rng.int(COLOURS))
}

// Right colour in the right place, and right colour in the wrong place.
export function score(code, guess) {
  let exact = 0
  const left = Array(COLOURS).fill(0)
  const tried = Array(COLOURS).fill(0)
  code.forEach((c, k) => {
    if (guess[k] === c) exact++
    else {
      left[c]++
      tried[guess[k]]++
    }
  })
  const near = range(COLOURS).reduce((n, c) => n + Math.min(left[c], tried[c]), 0)
  return { exact, near }
}

// How many codes still fit every answer so far.
export function possibleCodes(guesses, results) {
  let n = 0
  for (let x = 0; x < COLOURS ** SLOTS; x++) {
    const code = range(SLOTS).map((k) => Math.floor(x / COLOURS ** k) % COLOURS)
    if (guesses.every((g, k) => {
      const s = score(code, g)
      return s.exact === results[k].exact && s.near === results[k].near
    })) n++
  }
  return n
}
