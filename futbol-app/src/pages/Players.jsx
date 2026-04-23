import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function loadLocalHistory() {
  try {
    const saved = localStorage.getItem('qf_match_history')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-qf-dark rounded-2xl p-4 flex flex-col items-center gap-1">
      <span className="text-3xl font-black tabular-nums" style={{ color }}>{value}</span>
      <span className="text-gray-500 text-xs uppercase tracking-wider text-center">{label}</span>
    </div>
  )
}

function PlayerModal({ player: p, onClose }) {
  const winRate = p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 0
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-qf-card rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">{p.name}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-black"
            style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}
          >
            {p.photo
              ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
              : initials(p.name)
            }
          </div>
          <div className="flex gap-2 mt-3">
            {p.position && (
              <span className="text-sm px-3 py-1 rounded-full font-bold" style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}>
                {p.position}
              </span>
            )}
            {p.number && (
              <span className="text-sm px-3 py-1 rounded-full bg-qf-dark text-gray-300 font-bold">
                #{p.number}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Partidos" value={p.matches} color="#38bdf8" />
          <StatCard label="Goles ⚽" value={p.goals} color={p.color || '#38bdf8'} />
          <StatCard label="Ganados" value={p.wins} color="#4ade80" />
          <StatCard label="Perdidos" value={p.losses} color="#f87171" />
          {p.draws > 0 && <StatCard label="Empates" value={p.draws} color="#a3a3a3" />}
          <StatCard label="% Victoria" value={`${winRate}%`} color="#facc15" />
        </div>
      </div>
    </div>
  )
}

export default function Players() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const matches = loadLocalHistory()
    const playerMap = {}

    matches.forEach(m => {
      ;[['team1', m.team1], ['team2', m.team2]].forEach(([teamKey, team]) => {
        if (!team?.players) return
        const myScore = teamKey === 'team1' ? m.score1 : m.score2
        const theirScore = teamKey === 'team1' ? m.score2 : m.score1
        const won = myScore > theirScore
        const lost = myScore < theirScore

        team.players.forEach(p => {
          const key = p.id || p.name
          if (!playerMap[key]) {
            playerMap[key] = {
              id: key,
              name: p.name,
              photo: null,
              position: '',
              number: '',
              color: team.color,
              matches: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              goals: 0,
            }
          }
          const entry = playerMap[key]
          if (p.photo) entry.photo = p.photo
          if (p.position) entry.position = p.position
          if (p.number) entry.number = p.number
          entry.color = team.color
          entry.matches++
          if (won) entry.wins++
          else if (lost) entry.losses++
          else entry.draws++
        })
      })

      ;(m.goals ?? []).forEach(g => {
        const key = g.player.id || g.player.name
        if (playerMap[key]) {
          playerMap[key].goals++
          if (g.player.photo) playerMap[key].photo = g.player.photo
        }
      })
    })

    setPlayers(Object.values(playerMap).sort((a, b) => b.matches - a.matches || b.goals - a.goals))
  }, [])

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-qf-dark">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-qf-blue text-2xl active:scale-90">←</button>
        <img src="/logo.jpg" alt="QF" className="w-8 h-8 rounded-full object-cover" />
        <h1 className="text-xl font-bold">Plantel</h1>
      </div>

      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        {players.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            No hay jugadores todavía.<br />Jugá partidos para ver las estadísticas acá.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="flex items-center gap-4 bg-qf-card border border-qf-border rounded-2xl p-4 active:scale-95 transition-transform text-left w-full"
            >
              <div
                className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-black flex-shrink-0"
                style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}
              >
                {p.photo
                  ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                  : initials(p.name)
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{p.name}</p>
                  {p.position && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}>
                      {p.position}
                    </span>
                  )}
                  {p.number && <span className="text-gray-500 text-xs">#{p.number}</span>}
                </div>
                <div className="flex gap-3 mt-1 text-xs">
                  <span className="text-gray-400">{p.matches}P</span>
                  <span style={{ color: '#4ade80' }}>{p.wins}G</span>
                  <span style={{ color: '#f87171' }}>{p.losses}Pe</span>
                  {p.draws > 0 && <span className="text-gray-500">{p.draws}E</span>}
                  <span className="text-gray-400">⚽ {p.goals}</span>
                </div>
              </div>
              <span className="text-gray-600">›</span>
            </button>
          ))}
        </div>
      </div>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}