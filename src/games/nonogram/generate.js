export const SIZE = 10

export function lineClue(line) {
  const clue = []
  let run = 0
  for (const v of line) {
    if (v === 1) run++
    else if (run) {
      clue.push(run)
      run = 0
    }
  }
  if (run) clue.push(run)
  return clue.length ? clue : [0]
}

// Given a clue and partially known line (-1 unknown, 0 empty, 1 filled),
// returns the line with every cell that is forced by all valid placements.
// Returns null if no placement fits.
function solveLine(clue, line) {
  const n = line.length
  const blocks = clue[0] === 0 ? [] : clue
  const canFill = Array(n).fill(false)
  const canEmpty = Array(n).fill(false)
  const arr = Array(n).fill(0)
  let any = false

  function place(bi, pos) {
    if (bi === blocks.length) {
      for (let i = pos; i < n; i++) if (line[i] === 1) return
      any = true
      for (let i = 0; i < n; i++) {
        if (i < pos && arr[i]) canFill[i] = true
        else canEmpty[i] = true
      }
      return
    }
    const len = blocks[bi]
    let remaining = 0
    for (let k = bi + 1; k < blocks.length; k++) remaining += blocks[k] + 1
    for (let s = pos; s + len + remaining <= n; s++) {
      if (s > pos && line[s - 1] === 1) break
      let ok = true
      for (let i = s; i < s + len; i++) if (line[i] === 0) ok = false
      const end = s + len
      if (end < n && line[end] === 1) ok = false
      if (!ok) continue
      for (let i = pos; i < s; i++) arr[i] = 0
      for (let i = s; i < end; i++) arr[i] = 1
      if (end < n) arr[end] = 0
      place(bi + 1, Math.min(end + 1, n))
    }
  }

  place(0, 0)
  if (!any) return null
  return line.map((v, i) => (canFill[i] && !canEmpty[i] ? 1 : !canFill[i] && canEmpty[i] ? 0 : v))
}

// True if the clues pin down every cell by line logic alone (=> unique solution).
function lineSolvable(rowClues, colClues) {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(-1))
  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < SIZE; r++) {
      const next = solveLine(rowClues[r], grid[r])
      if (!next) return false
      next.forEach((v, c) => {
        if (v !== grid[r][c]) {
          grid[r][c] = v
          changed = true
        }
      })
    }
    for (let c = 0; c < SIZE; c++) {
      const next = solveLine(colClues[c], grid.map((row) => row[c]))
      if (!next) return false
      next.forEach((v, r) => {
        if (v !== grid[r][c]) {
          grid[r][c] = v
          changed = true
        }
      })
    }
  }
  return grid.every((row) => row.every((v) => v !== -1))
}

export function generateNonogram(rng) {
  let result
  for (let attempt = 0; attempt < 5000; attempt++) {
    const solution = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => (rng.next() < 0.58 ? 1 : 0)),
    )
    const rowClues = solution.map(lineClue)
    const colClues = solution[0].map((_, c) => lineClue(solution.map((row) => row[c])))
    result = { solution, rowClues, colClues }
    if (lineSolvable(rowClues, colClues)) return result
  }
  return result
}
