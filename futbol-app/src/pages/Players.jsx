import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const POSITIONS = ['DEL', 'MED', 'DEF', 'ARQ']

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function loadLocalHistory() {
  try { return JSON.parse(localStorage.getItem('qf_match_history') || '[]') } catch { return [] }
}
function loadRoster() {
  try { return JSON.parse(localStorage.getItem('qf_roster') || '[]') } catch { return [] }
}
function saveRoster(roster) {
  localStorage.setItem('qf_roster', JSON.stringify(roster))
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
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-black"
            style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}>
            {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : initials(p.name)}
          </div>
          <div className="flex gap-2 mt-3">
            {p.position && (
              <span className="text-sm px-3 py-1 rounded-full font-bold" style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}>
                {p.position}
              </span>
            )}
            {p.number && <span className="text-sm px-3 py-1 rounded-full bg-qf-dark text-gray-300 font-bold">#{p.number}</span>}
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

function AddPlayerModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [number, setNumber] = useState('')

  function handleSave() {
    if (!name.trim()) return
    onSave({ id: crypto.randomUUID(), name: name.trim(), position, number, photo: null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-qf-card rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">Agregar jugador</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del jugador"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
            autoFocus
          />
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Posición</p>
            <div className="flex gap-2">
              {POSITIONS.map(p => (
                <button key={p} onClick={() => setPosition(position === p ? '' : p)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${position === p ? 'bg-qf-blue text-black' : 'bg-qf-dark text-gray-400'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="Número de camiseta"
            min="1" max="99"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
          />
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-3 rounded-2xl bg-qf-blue text-black font-bold active:scale-95 transition-transform disabled:opacity-40"
          >
            Agregar al plantel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Players() {
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [roster, setRoster] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    setRoster(loadRoster())
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
          if (!playerMap[key]) playerMap[key] = { id: key, name: p.name, photo: null, position: '', number: '', color: team.color, matches: 0, wins: 0, losses: 0, draws: 0, goals: 0 }
          const e = playerMap[key]
          if (p.photo) e.photo = p.photo
          if (p.position) e.position = p.position
          if (p.number) e.number = p.number
          e.color = team.color
          e.matches++
          if (won) e.wins++; else if (lost) e.losses++; else e.draws++
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
    setStats(Object.values(playerMap).sort((a, b) => b.matches - a.matches || b.goals - a.goals))
  }, [])

  function handleAddPlayer(player) {
    const updated = [...roster, player]
    saveRoster(updated)
    setRoster(updated)
  }

  function handleRemoveRoster(id) {
    const updated = roster.filter(p => p.id !== id)
    saveRoster(updated)
    setRoster(updated)
  }

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom bg-qf-dark">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-qf-blue text-2xl active:scale-90">←</button>
        <img src="/logo.jpg" alt="QF" className="w-8 h-8 rounded-full object-cover" />
        <h1 className="text-xl font-bold flex-1">Plantel</h1>
        <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full bg-qf-blue text-black font-black text-xl flex items-center justify-center active:scale-90">+</button>
      </div>

      <div className="flex px-4 gap-2 flex-shrink-0">
        {[['stats', '📊 Estadísticas'], ['roster', '👥 Plantel']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${tab === key ? 'bg-qf-blue text-black' : 'bg-qf-card text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 mt-4 pb-8 overflow-y-auto">
        {tab === 'stats' && (
          <div className="flex flex-col gap-3">
            {stats.length === 0 && <p className="text-gray-500 text-center mt-10">Jugá partidos para ver las estadísticas acá.</p>}
            {stats.map(p => (
              <button key={p.id} onClick={() => setSelected(p)}
                className="flex items-center gap-4 bg-qf-card border border-qf-border rounded-2xl p-4 active:scale-95 transition-transform text-left w-full">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-black flex-shrink-0"
                  style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}>
                  {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">{p.name}</p>
                    {p.position && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: (p.color || '#38bdf8') + '33', color: p.color || '#38bdf8' }}>{p.position}</span>}
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
        )}

        {tab === 'roster' && (
          <div className="flex flex-col gap-3">
            {roster.length === 0 && (
              <p className="text-gray-500 text-center mt-10">Agregá jugadores con el + para tener una lista base del club.</p>
            )}
            {roster.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-qf-card border border-qf-border rounded-2xl p-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-base font-black flex-shrink-0"
                  style={{ backgroundColor: '#38bdf833', color: '#38bdf8' }}>
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{p.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {p.position && <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-qf-blue/20 text-qf-blue">{p.position}</span>}
                    {p.number && <span className="text-xs text-gray-500">#{p.number}</span>}
                  </div>
                </div>
                <button onClick={() => handleRemoveRoster(p.id)} className="text-red-500 text-lg px-2 active:scale-90">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddPlayerModal onSave={handleAddPlayer} onClose={() => setShowAdd(false)} />}
    </div>
  )
}