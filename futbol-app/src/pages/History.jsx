import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMatches } from '../firebase/db'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function History() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('matches')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getMatches()
      .then(setMatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Build player stats across all matches
  const playerStats = {}
  matches.forEach(m => {
    ;(m.goals ?? []).forEach(g => {
      const key = g.player.name
      if (!playerStats[key]) playerStats[key] = { name: key, goals: 0, matches: new Set(), photo: g.player.photo, color: m[g.teamKey]?.color }
      playerStats[key].goals++
      playerStats[key].matches.add(m.id)
    })
  })
  const topScorers = Object.values(playerStats)
    .map(s => ({ ...s, matches: s.matches.size }))
    .sort((a, b) => b.goals - a.goals)

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-6 pb-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-green-400 text-2xl active:scale-90">←</button>
        <h1 className="text-xl font-bold">Historial</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 flex-shrink-0">
        {[['matches', '📋 Partidos'], ['scorers', '⚽ Goleadores']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${tab === key ? 'bg-green-500 text-white' : 'bg-green-900/40 text-green-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 mt-4 pb-8 overflow-y-auto">
        {loading && <p className="text-green-400 text-center mt-10">Cargando...</p>}
        {error && <p className="text-red-400 text-center mt-10">Error: {error}</p>}

        {/* Matches tab */}
        {!loading && tab === 'matches' && (
          <div className="flex flex-col gap-3">
            {matches.length === 0 && (
              <p className="text-green-500 text-center mt-10">No hay partidos guardados todavía.</p>
            )}
            {matches.map(m => (
              <div key={m.id} className="bg-green-900/40 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  className="w-full p-4 text-left active:bg-green-900/60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.team1?.color }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.team2?.color }} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{m.team1?.name} {m.score1} — {m.score2} {m.team2?.name}</p>
                        <p className="text-green-400 text-xs">{m.stadium || 'Sin estadio'} · {formatDate(m.createdAt)}</p>
                      </div>
                    </div>
                    <span className="text-green-500 text-xs">{expanded === m.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expanded === m.id && (m.goals ?? []).length > 0 && (
                  <div className="px-4 pb-4 border-t border-green-800">
                    <p className="text-green-400 text-xs uppercase tracking-wider mt-3 mb-2">Goles</p>
                    {m.goals.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m[g.teamKey]?.color }} />
                        <span className="text-sm">{g.player.name}</span>
                        <span className="text-green-500 text-xs ml-auto">{g.minute}'</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Scorers tab */}
        {!loading && tab === 'scorers' && (
          <div className="flex flex-col gap-2">
            {topScorers.length === 0 && (
              <p className="text-green-500 text-center mt-10">No hay goles registrados todavía.</p>
            )}
            {topScorers.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 bg-green-900/40 rounded-2xl p-3">
                <span className="text-green-500 font-black text-lg w-6 text-center">{i + 1}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: (s.color || '#16a34a') + '33', color: s.color || '#16a34a' }}>
                  {s.photo
                    ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                    : initials(s.name)
                  }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-green-400 text-xs">{s.matches} {s.matches === 1 ? 'partido' : 'partidos'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-black" style={{ color: s.color || '#16a34a' }}>{s.goals}</span>
                  <span className="text-green-500 text-xs">⚽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
