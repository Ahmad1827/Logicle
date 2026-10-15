import Sudoku from './sudoku/Sudoku.jsx'
import Minesweeper from './minesweeper/Minesweeper.jsx'
import Nonogram from './nonogram/Nonogram.jsx'
import Queens from './queens/Queens.jsx'

// To add a game: build a component that takes { seed, solved, onSolve, onMistake }
// and add it here. The daily rotation goes through this list in order.
export const GAMES = [
  {
    id: 'sudoku',
    name: 'Sudoku',
    color: '#4a7bf7',
    rules: 'Fill the grid so every row, column and 3×3 box contains the digits 1–9 exactly once.',
    help: 'Tap a square, then a number. Turn on Notes to pencil in candidates. Keyboard works too (N toggles notes).',
    Component: Sudoku,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    color: '#f0812f',
    rules: 'Reveal every safe square. Each number shows how many of its 8 neighbours are mines.',
    help: 'Switch to the flag (or right-click) to mark mines. No guessing is ever needed.',
    Component: Minesweeper,
    tracksMistakes: true,
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    color: '#8b5cf6',
    rules: 'Fill squares so each row and column matches its clue: the lengths of the filled runs, in order.',
    help: 'Drag to fill several squares at once. Switch to the cross (or right-click) to mark empty ones.',
    Component: Nonogram,
  },
  {
    id: 'queens',
    name: 'Queens',
    color: '#e5487a',
    rules: 'Place one queen in every row, column and colour region. Queens may not touch, not even diagonally.',
    help: 'Tap once for a cross, twice for a queen.',
    Component: Queens,
  },
]

export function gameForPuzzle(number) {
  const n = GAMES.length
  return GAMES[(((number - 1) % n) + n) % n]
}

export function getGame(id) {
  return GAMES.find((g) => g.id === id)
}
