import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatch } from '../context/MatchContext'
import GoalCelebration from '../components/GoalCelebration'
import MatchSummary from '../components/MatchSummary'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function pad(n) {
  return String(Math.floor(n)).padStart(2, '0')
}

function saveMatchLocal(matchData) {
  try {
    const saved = localStorage.getItem('qf_match_history')
    const history = saved ? JSON.parse(saved) : []
    history.unshift({ ...matchData, createdAt: new Date().toISOString() })
    localStorage.setItem('qf_match_history', JSON.stringify(history.slice(0, 50)))
  } catch {}
}

function stripPhotos(m) {
  const st = team => ({ ...team, players: (team?.players || []).map(p => ({ ...p, photo: null })) })
  return {
    ...m,
    team1: st(m.team1),
    team2: st(m.team2),
    goals: (m.goals || []).map(g => ({ ...g, player: { ...g.player, photo: null } })),
  }
}

let audioCtx = null
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}
function playBeeps(n, freq = 780, dur = 0.28) {
  try {
    const ctx = getCtx()
    for (let i = 0; i < n; i++) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      const t = ctx.currentTime + i * (dur + 0.12)
      g.setValueAtTime(0.5, t)
      g.exponentialRampToValueAtTime(0.001, t + dur)
      osc.start(t); osc.stop(t + dur + 0.01)
    }
  } catch {}
}
function playHorn() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.frequency.value = 440; osc.type = 'sawtooth'
    g.setValueAtTime(0.6, ctx.currentTime)
    g.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 2.5)
  } catch {}
}

export default function Match() {
  const navigate = useNavigate()
  const { state, dispatch } = useMatch()
  const { match } = state
  const [elapsed, setElapsed] = useState(0)
  const [celebration, setCelebration] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [finishedMatch, setFinishedMatch] = useState(null)
  const [tvMode, setTvMode] = useState(false)
  const timerRef = useRef(null)
  const warned5 = useRef(false)
  const warnedEnd = useRef(false)
  const audioReady = useRef(false)

  const totalMs = (match?.duration ?? 40) * 60 * 1000
  const remaining = Math.max(0, totalMs - elapsed)
  const isFinished = match?.status === 'finished'
  const isPaused = match?.status === 'paused'
  const isHalfTime = match?.status === 'halftime'
  const halves = match?.halves ?? 1
  const currentHalf = match?.currentHalf ?? 1

  function unlockAudio() {
    if (audioReady.current) return
    try { getCtx().resume() } catch {}
    audioReady.current = true
  }

  const tick = useCallback(() => {
    if (!match || match.status !== 'playing') return
    const e = Date.now() - match.startTime - match.pausedElapsed
    setElapsed(e)
    const rem = totalMs - e
    if (rem <= 5 * 60 * 1000 && rem > 4.85 * 60 * 1000 && !warned5.current) {
      warned5.current = true
      playBeeps(3, 780, 0.28)
    }
    if (e >= totalMs && !warnedEnd.current) {
      warnedEnd.current = true
      playHorn()
      clearInterval(timerRef.current)
      if (halves === 2 && currentHalf === 1) dispatch({ type: 'HALF_TIME' })
    }
  }, [match, totalMs, halves, currentHalf])

  useEffect(() => {
    if (!match) { navigate('/'); return }
    warned5.current = false
    warnedEnd.current = false
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [match?.status, match?.startTime, match?.pausedElapsed, match?.currentHalf])

  if (!match && !showSummary) return null

  const mins = pad(remaining / 60000)
  const secs = pad((remaining % 60000) / 1000)
  const timeStr = `${mins}:${secs}`
  const pct = Math.min(100, (elapsed / totalMs) * 100)

  function handleGoal(player, teamKey) {
    unlockAudio()
    dispatch({ type: 'SCORE_GOAL', payload: { player, teamKey } })
    const newScore1 = match.score1 + (teamKey === 'team1' ? 1 : 0)
    const newScore2 = match.score2 + (teamKey === 'team2' ? 1 : 0)
    setCelebration({ player, team: match[teamKey], newScore1, newScore2 })
  }

  function handleFinish() {
    if (!confirm('¿Terminar el partido?')) return
    clearInterval(timerRef.current)
    const finalMatch = { ...match, status: 'finished', endTime: Date.now() }
    dispatch({ type: 'FINISH_MATCH' })
    saveMatchLocal(finalMatch)
    import('../firebase/db').then(({ saveMatch }) => saveMatch(stripPhotos(finalMatch))).catch(() => {})
    setFinishedMatch(finalMatch)
    setShowSummary(true)
  }

  function handleStartSecondHalf() {
    warned5.current = false
    warnedEnd.current = false
    dispatch({ type: 'START_SECOND_HALF' })
  }

  function handleSummaryClose() {
    dispatch({ type: 'CLEAR_MATCH' })
    navigate('/')
  }

  function togglePause() {
    unlockAudio()
    if (isPaused) dispatch({ type: 'RESUME_MATCH' })
    else dispatch({ type: 'PAUSE_MATCH' })
  }

  if (showSummary && finishedMatch) {
    return <MatchSummary match={finishedMatch} onClose={handleSummaryClose} />
  }

  const t1 = match.team1
  const t2 = match.team2

  if (isHalfTime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-qf-dark safe-top safe-bottom px-6 gap-6">
        <p className="text-qf-blue text-xs uppercase tracking-widest font-bold">⏸ Descanso — Fin del 1er tiempo</p>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t1.color }} />
            <p className="font-bold">{t1.name}</p>
            <p className="text-7xl font-black tabular-nums" style={{ color: t1.color }}>{match.score1}</p>
          </div>
          <p className="text-4xl font-black text-gray-600">—</p>
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t2.color }} />
            <p className="font-bold">{t2.name}</p>
            <p className="text-7xl font-black tabular-nums" style={{ color: t2.color }}>{match.score2}</p>
          </div>
        </div>
        <button
          onClick={handleStartSecondHalf}
          className="w-full max-w-sm py-4 rounded-2xl bg-qf-blue text-black font-bold text-xl active:scale-95 transition-transform"
        >
          ▶ Iniciar 2do tiempo
        </button>
        <button onClick={handleFinish} className="text-gray-500 text-sm active:scale-95">Terminar partido acá</button>
      </div>
    )
  }

  if (tvMode) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8 z-50" onClick={unlockAudio}>
        <button onClick={() => setTvMode(false)} className="absolute top-6 right-6 text-gray-600 text-sm px-3 py-1 rounded-lg border border-gray-700">
          ✕ Salir
        </button>
        {match.stadium && <p className="text-qf-blue text-sm uppercase tracking-widest">{match.stadium}</p>}
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-center gap-3">
            <p className="text-3xl font-bold text-white">{t1.name}</p>
            <p className="text-[120px] leading-none font-black tabular-nums" style={{ color: t1.color }}>{match.score1}</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className={`text-5xl font-black tabular-nums ${remaining === 0 ? 'text-red-400' : isPaused ? 'text-yellow-400' : 'text-white'}`}>{timeStr}</p>
            {halves === 2 && <p className="text-gray-500 text-base">{currentHalf}° tiempo</p>}
            {isPaused && <p className="text-yellow-400 text-sm font-bold">PAUSA</p>}
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className="text-3xl font-bold text-white">{t2.name}</p>
            <p className="text-[120px] leading-none font-black tabular-nums" style={{ color: t2.color }}>{match.score2}</p>
          </div>
        </div>
        {match.goals.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center max-w-2xl px-4">
            {match.goals.map((g, i) => (
              <span key={i} className="text-base" style={{ color: match[g.teamKey].color }}>
                ⚽ {g.player.name} {g.minute}'
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom no-select bg-qf-dark" onClick={unlockAudio}>
      <div className="flex-shrink-0 pt-4 px-4">
        {match.stadium && (
          <p className="text-center text-qf-blue text-xs uppercase tracking-widest mb-2">🏟️ {match.stadium}</p>
        )}
        <div className="flex items-center justify-between gap-2 bg-qf-card rounded-2xl p-4 border border-qf-border">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t1.color }} />
            <span className="font-bold text-sm text-center leading-tight">{t1.name}</span>
            <span className="text-5xl font-black tabular-nums" style={{ color: t1.color }}>{match.score1}</span>
          </div>
          <div className="flex flex-col items-center px-2">
            <div className={`text-3xl font-black tabular-nums ${remaining === 0 ? 'text-red-400' : isPaused ? 'text-yellow-400' : 'text-white'}`}>{timeStr}</div>
            <div className="w-24 h-1.5 bg-qf-dark rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-qf-blue rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {halves === 2 && <span className="text-gray-500 text-xs mt-0.5">{currentHalf}° T</span>}
            <span className="text-gray-500 text-xs">{isPaused ? 'PAUSA' : remaining === 0 ? 'FIN' : ''}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t2.color }} />
            <span className="font-bold text-sm text-center leading-tight">{t2.name}</span>
            <span className="text-5xl font-black tabular-nums" style={{ color: t2.color }}>{match.score2}</span>
          </div>
        </div>
        {match.goals.length > 0 && (
          <div className="mt-2 px-1 text-xs flex flex-wrap gap-x-3 gap-y-0.5">
            {match.goals.map((g, i) => (
              <span key={i}>
                <span style={{ color: match[g.teamKey].color }}>●</span>{' '}
                {g.player.name} {g.minute}'
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 px-4 mt-4 overflow-y-auto pb-2">
        {[['team1', t1], ['team2', t2]].map(([teamKey, team]) => (
          <div key={teamKey} className="rounded-2xl overflow-hidden">
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: team.color + '30', color: team.color }}>
              {team.name}
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 bg-qf-card/60">
              {team.players.map(player => (
                <button
                  key={player.id}
                  onClick={() => !isFinished && handleGoal(player, teamKey)}
                  disabled={isFinished || isPaused}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl active:scale-90 transition-transform disabled:opacity-40"
                  style={{ backgroundColor: team.color + '20' }}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold" style={{ backgroundColor: team.color + '40', color: team.color }}>
                    {player.photo ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" /> : initials(player.name)}
                  </div>
                  <span className="text-xs text-center leading-tight line-clamp-2">{player.name}</span>
                  {player.position && <span className="text-xs font-bold" style={{ color: team.color }}>{player.position}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 px-4 pb-6 pt-2 flex gap-3 bg-qf-dark">
        <button onClick={() => setTvMode(true)} className="px-4 py-3 rounded-2xl bg-qf-card text-gray-400 active:scale-95 transition-transform border border-qf-border text-lg">
          📺
        </button>
        <button onClick={togglePause} disabled={isFinished} className="flex-1 py-3 rounded-2xl bg-yellow-500/20 text-yellow-300 font-semibold active:scale-95 transition-transform disabled:opacity-40">
          {isPaused ? '▶ Reanudar' : '⏸ Pausa'}
        </button>
        <button onClick={handleFinish} disabled={isFinished} className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-300 font-semibold active:scale-95 transition-transform disabled:opacity-40">
          🏁 Terminar
        </button>
      </div>

      {celebration && (
        <GoalCelebration
          player={celebration.player}
          team={celebration.team}
          score1={celebration.newScore1}
          score2={celebration.newScore2}
          teamName1={t1.name}
          teamName2={t2.name}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  )
}
