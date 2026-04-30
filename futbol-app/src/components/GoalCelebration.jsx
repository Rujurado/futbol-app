import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function GoalCelebration({ player, team, score1, score2, teamName1, teamName2, onDismiss }) {
  const timerRef = useRef(null)

  useEffect(() => {
    const color = team.color
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.4 },
      colors: [color, '#ffffff', '#fbbf24'],
      zIndex: 9999,
    })
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors: [color, '#ffffff'],
        zIndex: 9999,
      })
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors: [color, '#ffffff'],
        zIndex: 9999,
      })
    }, 300)

    timerRef.current = setTimeout(onDismiss, 5000)
    return () => {
      clearTimeout(timerRef.current)
      confetti.reset()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
      style={{ backgroundColor: team.color + 'ee' }}
      onClick={onDismiss}
    >
      <div className="goal-text text-7xl font-black text-white drop-shadow-lg tracking-widest mb-6">
        ¡GOL!
      </div>

      <div className="animate-bounce-in mb-5">
        <div
          className="w-36 h-36 rounded-full border-4 border-white overflow-hidden flex items-center justify-center shadow-2xl"
          style={{ backgroundColor: team.color }}
        >
          {player.photo
            ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
            : <span className="text-5xl font-black text-white">{initials(player.name)}</span>
          }
        </div>
      </div>

      <div className="text-white text-2xl font-black text-center px-6 drop-shadow mb-2">
        {player.name}
      </div>
      <div className="text-white/80 text-sm font-semibold mb-8">{team.name}</div>

      <div className="flex items-center gap-4 bg-black/30 px-8 py-4 rounded-2xl">
        <span className="text-white font-bold text-lg">{teamName1}</span>
        <span className="text-white font-black text-4xl tabular-nums">{score1} — {score2}</span>
        <span className="text-white font-bold text-lg">{teamName2}</span>
      </div>

      <p className="text-white/50 text-xs mt-8">Tocá para continuar</p>
    </div>
  )
}