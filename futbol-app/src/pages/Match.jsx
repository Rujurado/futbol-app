import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatch } from '../context/MatchContext'
import { saveMatch } from '../firebase/db'
import GoalCelebration from '../components/GoalCelebration'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function pad(n) {
  return String(Math.floor(n)).padStart(2, '0')
}

export default function Match() {
  const navigate = useNavigate()
  const { state, dispatch } = useMatch()
  const { match } = state
  const [elapsed, setElapsed] = useState(0)
  const [celebration, setCelebration] = useState(null)
  const timerRef = useRef(null)

  const totalMs = (match?.duration ?? 40) * 60 * 1000
  const remaining = Math.max(0, totalMs - elapsed)
  const isFinished = match?.status === 'finished'
  const isPaused = match?.status === 'paused'

  const tick = useCallback(() => {
    if (!match || match.status !== 'playing') return
    const e = Date.now() - match.startTime - match.pausedElapsed
    setElapsed(e)
    if (e >= totalMs) {
      clearInterval(timerRef.current)
    }
  }, [match, totalMs])

  useEffect(() => {
    if (!match) { navigate('/'); return }
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [match?.status, match?.startTime, match?.pausedElapsed])

  if (!match) return null

  const mins = pad(remaining / 60000)
  const secs = pad((remaining % 60000) / 1000)
  const timeStr = `${mins}:${secs}`
  const pct = Math.min(100, (elapsed / totalMs) * 100)

  function handleGoal(player, teamKey) {
    dispatch({ type: 'SCORE_GOAL', payload: { player, teamKey } })
    const team = match[teamKey]
    const newScore1 = match.score1 + (teamKey === 'team1' ? 1 : 0)
    const newScore2 = match.score2 + (teamKey === 'team2' ? 1 : 0)
    setCelebration({ player, team, newScore1, newScore2 })
  }

  async function handleFinish() {
    if (!confirm('¿Terminar el partido?')) return
    dispatch({ type: 'FINISH_MATCH' })
    try {
      await saveMatch({
        ...match,
        score1: match.score1,
        score2: match.score2,
        status: 'finished',
        endTime: Date.now(),
      })
    } catch (e) {
      console.error('Error guardando partido:', e)
    }
    navigate('/history')
  }

  function togglePause() {
    if (isPaused) dispatch({ type: 'RESUME_MATCH' })
    else dispatch({ type: 'PAUSE_MATCH' })
  }

  const t1 = match.team1
  const t2 = match.team2

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom no-select">

      {/* Scoreboard — big and TV-friendly */}
      <div className="flex-shrink-0 pt-4 px-4">
        {match.stadium && (
          <p className="text-center text-green-400 text-xs uppercase tracking-widest mb-2">
            🏟️ {match.stadium}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 bg-green-900/50 rounded-2xl p-4">
          {/* Team 1 */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t1.color }} />
            <span className="font-bold text-sm text-center leading-tight">{t1.name}</span>
            <span className="text-5xl font-black tabular-nums" style={{ color: t1.color }}>
              {match.score1}
            </span>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center px-2">
            <div className={`text-3xl font-black tabular-nums ${remaining === 0 ? 'text-red-400' : isPaused ? 'text-yellow-400' : 'text-white'}`}>
              {timeStr}
            </div>
            <div className="w-24 h-1.5 bg-green-950 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-green-500 text-xs mt-1">{isPaused ? 'PAUSA' : remaining === 0 ? 'FIN' : ''}</span>
          </div>

          {/* Team 2 */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t2.color }} />
            <span className="font-bold text-sm text-center leading-tight">{t2.name}</span>
            <span className="text-5xl font-black tabular-nums" style={{ color: t2.color }}>
              {match.score2}
            </span>
          </div>
        </div>

        {/* Goal list */}
        {match.goals.length > 0 && (
          <div className="mt-2 px-1 text-xs text-green-400 flex flex-wrap gap-x-3 gap-y-0.5">
            {match.goals.map((g, i) => (
              <span key={i}>
                <span style={{ color: match[g.teamKey].color }}>●</span>{' '}
                {g.player.name} {g.minute}'
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Player buttons */}
      <div className="flex-1 flex flex-col gap-3 px-4 mt-4 overflow-y-auto pb-2">
        {[['team1', t1], ['team2', t2]].map(([teamKey, team]) => (
          <div key={teamKey} className="rounded-2xl overflow-hidden">
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: team.color + '30', color: team.color }}>
              {team.name}
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 bg-green-900/30">
              {team.players.map(player => (
                <button
                  key={player.id}
                  onClick={() => !isFinished && handleGoal(player, teamKey)}
                  disabled={isFinished || isPaused}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl active:scale-90 transition-transform disabled:opacity-40"
                  style={{ backgroundColor: team.color + '20' }}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold" style={{ backgroundColor: team.color + '40', color: team.color }}>
                    {player.photo
                      ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                      : initials(player.name)
                    }
                  </div>
                  <span className="text-xs text-center leading-tight line-clamp-2">{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 px-4 pb-6 pt-2 flex gap-3">
        <button
          onClick={togglePause}
          disabled={isFinished}
          className="flex-1 py-3 rounded-2xl bg-yellow-500/20 text-yellow-300 font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
          {isPaused ? '▶ Reanudar' : '⏸ Pausa'}
        </button>
        <button
          onClick={handleFinish}
          disabled={isFinished}
          className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-300 font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
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
