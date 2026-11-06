import Sudoku from './sudoku/Sudoku.jsx'
import Minesweeper from './minesweeper/Minesweeper.jsx'
import Nonogram from './nonogram/Nonogram.jsx'
import Queens from './queens/Queens.jsx'
import KenKen from './kenken/KenKen.jsx'
import Takuzu from './takuzu/Takuzu.jsx'
import Tents from './tents/Tents.jsx'
import Futoshiki from './futoshiki/Futoshiki.jsx'
import LightUp from './lightup/LightUp.jsx'
import Hitori from './hitori/Hitori.jsx'
import Miaudoku from './miaudoku/Miaudoku.jsx'
import Skyscrapers from './skyscrapers/Skyscrapers.jsx'
import Nurikabe from './nurikabe/Nurikabe.jsx'
import Shikaku from './shikaku/Shikaku.jsx'
import Bridges from './bridges/Bridges.jsx'

// To add a game: build a component that takes { seed, solved, onSolve, onMistake, onRandomize }
// and renders GameControls, then add it here. The daily rotation goes through this list in order.
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
    help: 'Switch to the flag, long-press on a phone, or right-click to mark mines. No guessing is ever needed.',
    Component: Minesweeper,
    tracksMistakes: true,
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    color: '#8b5cf6',
    rules: 'Fill squares so each row and column matches its clue: the lengths of the filled runs, in order.',
    help: 'Drag to fill several squares at once. Switch to the cross (or right-click) to mark empty ones. Finished rows and columns cross out their empty squares by themselves.',
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
  {
    id: 'kenken',
    name: 'KenKen',
    color: '#2f9e44',
    rules: 'Fill the grid with 1–6 so no number repeats in a row or column. Each outlined cage must make its target using its operation.',
    help: 'Tap a square, then a number. For − and ÷ the order of the numbers doesn’t matter. Notes work like in Sudoku.',
    Component: KenKen,
  },
  {
    id: 'takuzu',
    name: 'Takuzu',
    color: '#0e9aa7',
    rules: 'Fill every square with one of two colours. Each row and column has equal amounts of both, no three in a row of the same colour, and no two rows or columns are identical.',
    help: 'Tap a square to cycle: colour one, colour two, empty.',
    Component: Takuzu,
  },
  {
    id: 'tents',
    name: 'Tents',
    color: '#74b816',
    rules: 'Pitch one tent next to every tree (above, below, left or right). Tents never touch each other, not even diagonally. The numbers say how many tents are in each row and column.',
    help: 'Tap once to mark grass, twice for a tent.',
    Component: Tents,
  },
  {
    id: 'futoshiki',
    name: 'Futoshiki',
    color: '#a0522d',
    rules: 'Fill the grid with 1–5 so no number repeats in a row or column. Every < sign between two squares must hold: it points at the smaller number.',
    help: 'Tap a square, then a number. Notes work like in Sudoku.',
    Component: Futoshiki,
  },
  {
    id: 'lightup',
    name: 'Light Up',
    color: '#e0a100',
    rules: 'Place bulbs so every white square is lit. A bulb lights its whole row and column until a black square. No bulb may shine on another, and a number says how many bulbs touch that black square.',
    help: 'Tap once to mark a square as no bulb, twice for a bulb.',
    Component: LightUp,
  },
  {
    id: 'hitori',
    name: 'Hitori',
    color: '#495057',
    rules: 'Shade squares so no number appears twice in a row or column. Shaded squares may not touch side by side, and all white squares must stay connected.',
    help: 'Tap once to shade, twice to circle a number you want to keep.',
    Component: Hitori,
  },
  {
    id: 'miaudoku',
    name: 'Miaudoku',
    color: '#d0648f',
    rules: 'Place exactly one cat in every row, every column and every coloured region. No two cats may touch, not even diagonally. A wrong cat costs one of your 3 lives.',
    help: 'Tap to cross a square out, or drag to cross out several. Double-tap or long-press to place a cat (right-click on a computer). Auto-X crosses out every square your cats rule out, and Hint shows one logical step.',
    Component: Miaudoku,
    tracksMistakes: true,
    mistakeChip: false,
  },
  {
    id: 'skyscrapers',
    name: 'Skyscrapers',
    color: '#ae3ec9',
    rules: 'Fill the grid with buildings 1–5 tall so no height repeats in a row or column. Each number outside says how many buildings you can see from there: taller buildings hide the shorter ones behind them.',
    help: 'Tap a square, then a number. Notes work like in Sudoku. A clue fades once its line is full and correct.',
    Component: Skyscrapers,
  },
  {
    id: 'nurikabe',
    name: 'Nurikabe',
    color: '#1864ab',
    rules: 'Shade squares to make the sea. Every number is an island of exactly that many squares, with one number per island. Islands never touch side by side, the sea is all connected, and it never forms a 2×2 block.',
    help: 'Tap once for sea, twice to dot a square you know is island.',
    Component: Nurikabe,
  },
  {
    id: 'shikaku',
    name: 'Shikaku',
    color: '#e03131',
    rules: 'Divide the grid into rectangles. Each rectangle holds exactly one number, and that number is its area in squares.',
    help: 'Drag from one corner to the opposite corner to draw a rectangle. Tap a rectangle to remove it.',
    Component: Shikaku,
  },
  {
    id: 'bridges',
    name: 'Bridges',
    color: '#8c6d1f',
    rules: 'Join the islands with straight bridges so each one has as many bridges as its number. Two islands share at most two bridges, bridges never cross, and every island must be reachable from every other.',
    help: 'Tap an island, then a neighbour to add a bridge (or drag between them). Tap again for a double bridge, a third time to remove it.',
    Component: Bridges,
  },
]

export function gameForPuzzle(number) {
  const n = GAMES.length
  return GAMES[(((number - 1) % n) + n) % n]
}

export function getGame(id) {
  return GAMES.find((g) => g.id === id)
}
