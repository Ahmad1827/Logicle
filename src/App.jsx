import { useCallback, useEffect, useRef, useState } from 'react'
import { GAMES, gameForPuzzle } from './games/index.js'
import { dayKey, formatTime, msUntilTomorrow, puzzleNumber } from './lib/daily.js'
import { currentStreak, loadResults, saveResults } from './lib/stats.js'
import { ChevronIcon, MineIcon } from './icons.jsx'

const SEEN_KEY = 'logicle-seen-help'

function hasSeenHelp(id) {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]').includes(id)
  } catch {
    return false
  }
}

function markHelpSeen(id) {
  try {
    const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
    if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]))
  } catch {
    // ignore
  }
}

function useScrollIntoView() {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])
  return ref
}

function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

function HelpSheet({ game, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{game.name}</h2>
        <p>{game.rules}</p>
        <p className="muted">{game.help}</p>
        <button className="primary" onClick={onClose}>
          Play
        </button>
      </div>
    </div>
  )
}

function GameHead({ game, children, onHelp, onStep }) {
  return (
    <div className="game-head">
      {onStep ? (
        <div className="game-switch">
          <button onClick={() => onStep(-1)} aria-label="Previous game">
            <ChevronIcon left />
          </button>
          <h2>{game.name}</h2>
          <button onClick={() => onStep(1)} aria-label="Next game">
            <ChevronIcon />
          </button>
        </div>
      ) : (
        <h2>{game.name}</h2>
      )}
      <div className="game-head-right">
        {children}
        {onHelp && (
          <button className="round" onClick={onHelp} aria-label="How to play">
            ?
          </button>
        )}
      </div>
    </div>
  )
}

function PuzzleRunner({ game, seed, onFinish, onStep }) {
  const [showHelp, setShowHelp] = useState(() => !hasSeenHelp(game.id))
  // The clock starts once the rules sheet is closed.
  const start = useRef(showHelp ? null : Date.now())
  const done = useRef(false)
  const mistakesRef = useRef(0)
  const [mistakes, setMistakes] = useState(0)
  const [result, setResult] = useState(null)
  const now = useNow()

  function closeHelp() {
    markHelpSeen(game.id)
    if (start.current === null) start.current = Date.now()
    setShowHelp(false)
  }

  const onSolve = useCallback(() => {
    if (done.current) return
    done.current = true
    const r = { time: Date.now() - (start.current ?? Date.now()), mistakes: mistakesRef.current }
    setResult(r)
    onFinish(r)
  }, [onFinish])

  const onMistake = useCallback(() => {
    mistakesRef.current++
    setMistakes(mistakesRef.current)
  }, [])

  const elapsed = result ? result.time : start.current === null ? 0 : Math.max(0, now - start.current)

  return (
    <section>
      <GameHead game={game} onHelp={() => setShowHelp(true)} onStep={onStep}>
        {game.tracksMistakes && game.mistakeChip !== false && mistakes > 0 && (
          <span className="chip bad" title="Mines hit">
            <MineIcon /> {mistakes}
          </span>
        )}
        <span className="chip">{formatTime(elapsed)}</span>
      </GameHead>
      <game.Component seed={seed} solved={!!result} onSolve={onSolve} onMistake={onMistake} />
      {showHelp && <HelpSheet game={game} onClose={closeHelp} />}
    </section>
  )
}

function DailyDone({ number, game, result, streak }) {
  const now = useNow()
  const panel = useScrollIntoView()
  const [copied, setCopied] = useState(false)
  const text = [
    `Logicle #${number} · ${game.name}`,
    `Time ${formatTime(result.time)}` + (game.tracksMistakes ? ` · Mistakes ${result.mistakes}` : ''),
    `Streak ${streak}`,
    window.location.origin + window.location.pathname,
  ].join('\n')

  async function share() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your result:', text)
    }
  }

  return (
    <div className="panel" ref={panel}>
      <div className="stats">
        <div>
          <b>{formatTime(result.time)}</b>
          <span>Time</span>
        </div>
        {game.tracksMistakes && (
          <div>
            <b>{result.mistakes}</b>
            <span>Mistakes</span>
          </div>
        )}
        <div>
          <b>{streak}</b>
          <span>Streak</span>
        </div>
      </div>
      <button className="primary" onClick={share}>
        {copied ? 'Copied!' : 'Share'}
      </button>
      <p className="muted">Next in {formatTime(msUntilTomorrow(new Date(now)))}</p>
    </div>
  )
}

function Daily({ today, game }) {
  const number = puzzleNumber(today)
  const key = dayKey(today)
  const [results, setResults] = useState(loadResults)
  const [playing] = useState(() => !loadResults()[key])
  const result = results[key]

  const finish = useCallback(
    (r) => {
      setResults((prev) => {
        const next = { ...prev, [key]: { ...r, game: game.id, number } }
        saveResults(next)
        return next
      })
    },
    [key, game.id, number],
  )

  return (
    <>
      {playing ? (
        <PuzzleRunner game={game} seed={`daily-${key}`} onFinish={finish} />
      ) : (
        <GameHead game={game}>
          <span className="chip">Solved</span>
        </GameHead>
      )}
      {result && <DailyDone number={number} game={game} result={result} streak={currentStreak(results, today)} />}
    </>
  )
}

function PracticeDone({ result, onAgain }) {
  const panel = useScrollIntoView()
  return (
    <div className="panel" ref={panel}>
      <div className="stats">
        <div>
          <b>{formatTime(result.time)}</b>
          <span>Time</span>
        </div>
      </div>
      <button className="primary" onClick={onAgain}>
        New puzzle
      </button>
    </div>
  )
}

function newPractice(game) {
  return { game, seed: `practice-${Date.now()}-${Math.random()}` }
}

// One puzzle at a time; the arrows beside the name switch to another game.
function Practice({ current, onStart }) {
  const [result, setResult] = useState(null)

  function start(game) {
    setResult(null)
    onStart(newPractice(game))
  }

  function step(dir) {
    const n = GAMES.length
    start(GAMES[(GAMES.indexOf(current.game) + dir + n) % n])
  }

  return (
    <>
      <PuzzleRunner key={current.seed} game={current.game} seed={current.seed} onFinish={setResult} onStep={step} />
      {result && <PracticeDone result={result} onAgain={() => start(current.game)} />}
    </>
  )
}

export default function App() {
  const [today] = useState(() => new Date())
  const [tab, setTab] = useState('daily')
  const dailyGame = gameForPuzzle(puzzleNumber(today))
  const [practice, setPractice] = useState(() => newPractice(dailyGame))
  const activeGame = tab === 'daily' ? dailyGame : practice.game

  // Reload when the day rolls over so a new puzzle appears.
  useEffect(() => {
    const id = setInterval(() => {
      if (dayKey(new Date()) !== dayKey(today)) window.location.reload()
    }, 30000)
    return () => clearInterval(id)
  }, [today])

  // Tint the whole page with the active game's colour.
  useEffect(() => {
    const color = activeGame?.color ?? '#6b7280'
    document.documentElement.style.setProperty('--accent', color)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [activeGame])

  return (
    <div className="app">
      <aside className="side">
        <h1 className="logo">
          Logic<span>le</span>
        </h1>
        <nav className="toggle">
          <button className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
            #{puzzleNumber(today)}
          </button>
          <button className={tab === 'practice' ? 'active' : ''} onClick={() => setTab('practice')}>
            Practice
          </button>
        </nav>
      </aside>
      <main>
        {tab === 'daily' ? <Daily today={today} game={dailyGame} /> : <Practice current={practice} onStart={setPractice} />}
      </main>
    </div>
  )
}
