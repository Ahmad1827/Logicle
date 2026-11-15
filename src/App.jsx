import { useCallback, useEffect, useRef, useState } from 'react'
import { ActiveContext, useActive } from './lib/active.js'
import { GAMES, gameForPuzzle, getGame } from './games/index.js'
import { dayKey, formatTime, msUntilTomorrow, puzzleNumber } from './lib/daily.js'
import { isNative, nativeShare, shareUrl, useBackButton, useBackCloses, usePlayerHere } from './lib/native.js'
import { currentStreak, loadResults, saveResults } from './lib/stats.js'
import { BulbOutlineIcon, ChevronIcon, MineIcon } from './icons.jsx'

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

// Time spent while `running` is true. Returns a function reading the total so far.
function useStopwatch(running) {
  const banked = useRef(0)
  const since = useRef(null)
  useEffect(() => {
    if (!running) return
    const t0 = Date.now()
    since.current = t0
    return () => {
      banked.current += Date.now() - t0
      since.current = null
    }
  }, [running])
  return useCallback(() => banked.current + (since.current === null ? 0 : Date.now() - since.current), [])
}

const mistakeLabel = (game) => game.mistakeLabel ?? 'Mistakes'

function HelpSheet({ game, onClose }) {
  useBackCloses(onClose)
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

function PuzzleRunner({ game, seed, onFinish, onStep, onRandomize }) {
  const active = useActive()
  const here = usePlayerHere()
  const [showHelp, setShowHelp] = useState(() => !hasSeenHelp(game.id))
  const done = useRef(false)
  const mistakesRef = useRef(0)
  const hintsRef = useRef(0)
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(0)
  const [result, setResult] = useState(null)
  // The clock only runs while you can see the board: not behind the rules sheet,
  // not on the other tab, and not while the app or browser tab is in the background.
  const elapsed = useStopwatch(active && here && !showHelp && !result)
  useNow()

  function closeHelp() {
    markHelpSeen(game.id)
    setShowHelp(false)
  }

  const onSolve = useCallback(() => {
    if (done.current) return
    done.current = true
    const time = elapsed()
    // Games report a hint after making its move, so a hint that solves the puzzle
    // arrives just after this. Wait for it before writing the result down.
    queueMicrotask(() => {
      const r = { time, mistakes: mistakesRef.current, hints: hintsRef.current }
      setResult(r)
      onFinish(r)
    })
  }, [onFinish, elapsed])

  const onMistake = useCallback(() => {
    mistakesRef.current++
    setMistakes(mistakesRef.current)
  }, [])

  const onHint = useCallback(() => {
    hintsRef.current++
    setHints(hintsRef.current)
  }, [])

  return (
    <section>
      <GameHead game={game} onHelp={() => setShowHelp(true)} onStep={onStep}>
        {game.tracksMistakes && game.mistakeChip !== false && mistakes > 0 && (
          <span className="chip bad" title="Mines hit">
            <MineIcon /> {mistakes}
          </span>
        )}
        {hints > 0 && (
          <span className="chip" title="Hints used">
            <BulbOutlineIcon /> {hints}
          </span>
        )}
        <span className="chip">{formatTime(result ? result.time : elapsed())}</span>
      </GameHead>
      <game.Component
        seed={seed}
        solved={!!result}
        onSolve={onSolve}
        onMistake={onMistake}
        onHint={onHint}
        onRandomize={onRandomize}
      />
      {showHelp && active && <HelpSheet game={game} onClose={closeHelp} />}
    </section>
  )
}

function DailyDone({ number, game, result, streak, onPractice }) {
  const now = useNow()
  const panel = useScrollIntoView()
  const [copied, setCopied] = useState(false)
  const text = [
    `Logicle #${number} · ${game.name}`,
    `Time ${formatTime(result.time)}` +
      (game.tracksMistakes ? ` · ${mistakeLabel(game)} ${result.mistakes}` : '') +
      (result.hints ? ` · Hints ${result.hints}` : ''),
    `Streak ${streak}`,
    shareUrl(),
  ].join('\n')

  async function share() {
    if (isNative) return nativeShare(text)
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
            <span>{mistakeLabel(game)}</span>
          </div>
        )}
        {result.hints > 0 && (
          <div>
            <b>{result.hints}</b>
            <span>Hints</span>
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
      <button onClick={() => onPractice(game)}>Play another {game.name}</button>
      <p className="muted">Next in {formatTime(msUntilTomorrow(new Date(now)))}</p>
    </div>
  )
}

function Daily({ today, game: scheduled, onPractice }) {
  const number = puzzleNumber(today)
  const key = dayKey(today)
  const [results, setResults] = useState(loadResults)
  const [playing] = useState(() => !loadResults()[key])
  const result = results[key]
  // A day already solved shows the game that was played, even if the rotation has since changed.
  const game = (result && getGame(result.game)) || scheduled

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
        // "New" leaves today's puzzle paused where it is and opens a fresh one in Practice.
        <PuzzleRunner game={game} seed={`daily-${key}`} onFinish={finish} onRandomize={() => onPractice(game)} />
      ) : (
        <GameHead game={game}>
          <span className="chip">Solved</span>
        </GameHead>
      )}
      {result && (
        <DailyDone
          number={number}
          game={game}
          result={result}
          streak={currentStreak(results, today)}
          onPractice={onPractice}
        />
      )}
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
        {result.hints > 0 && (
          <div>
            <b>{result.hints}</b>
            <span>Hints</span>
          </div>
        )}
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
  // A result belongs to one puzzle, so starting another (from here or the daily) hides it.
  const shown = result?.seed === current.seed ? result : null
  const seed = current.seed
  const finish = useCallback((r) => setResult({ ...r, seed }), [seed])

  const start = (game) => onStart(newPractice(game))

  function step(dir) {
    const n = GAMES.length
    start(GAMES[(GAMES.indexOf(current.game) + dir + n) % n])
  }

  return (
    <>
      <PuzzleRunner
        key={current.seed}
        game={current.game}
        seed={current.seed}
        onFinish={finish}
        onStep={step}
        onRandomize={() => start(current.game)}
      />
      {shown && <PracticeDone result={shown} onAgain={() => start(current.game)} />}
    </>
  )
}

export default function App() {
  const [today] = useState(() => new Date())
  const [tab, setTab] = useState('daily')
  const dailyGame = gameForPuzzle(puzzleNumber(today))
  const [practice, setPractice] = useState(() => newPractice(dailyGame))
  // Practice mounts the first time it's opened, then stays mounted like the daily.
  const [practiceOpened, setPracticeOpened] = useState(false)
  const activeGame = tab === 'daily' ? dailyGame : practice.game

  function showTab(next) {
    if (next === 'practice') setPracticeOpened(true)
    setTab(next)
  }

  function practiseGame(game) {
    setPractice(newPractice(game))
    showTab('practice')
  }

  useBackButton(() => {
    if (tab === 'daily') return false
    setTab('daily')
  })

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
          <button className={tab === 'daily' ? 'active' : ''} onClick={() => showTab('daily')}>
            #{puzzleNumber(today)}
          </button>
          <button className={tab === 'practice' ? 'active' : ''} onClick={() => showTab('practice')}>
            Practice
          </button>
        </nav>
      </aside>
      <main>
        <div hidden={tab !== 'daily'}>
          <ActiveContext.Provider value={tab === 'daily'}>
            <Daily today={today} game={dailyGame} onPractice={practiseGame} />
          </ActiveContext.Provider>
        </div>
        {practiceOpened && (
          <div hidden={tab !== 'practice'}>
            <ActiveContext.Provider value={tab === 'practice'}>
              <Practice current={practice} onStart={setPractice} />
            </ActiveContext.Provider>
          </div>
        )}
      </main>
    </div>
  )
}
