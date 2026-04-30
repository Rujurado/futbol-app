import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const POSITIONS = ['DEL', 'MED', 'DEF', 'ARQ']

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('qf_plantel') || '[]') } catch { return [] }
}
function saveLocal(players) {
  localStorage.setItem('qf_plantel', JSON.stringify(players))
}

export default function Players() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [number, setNumber] = useState('')
  const [dupeModal, setDupeModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setPlayers(loadLocal())
    import('../firebase/db').then(({ getPlayers }) =>
      getPlayers().then(cloud => {
        if (cloud.length > 0) { setPlayers(cloud); saveLocal(cloud) }
      }).catch(() => {})
    ).catch(() => {})
  }, [])

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setDupeModal(true); return
    }
    const newPlayer = { id: crypto.randomUUID(), name: trimmed, position, number, photo: null }
    const updated = [...players, newPlayer].sort((a, b) => a.name.localeCompare(b.name))
    setPlayers(updated)
    saveLocal(updated)
    import('../firebase/db').then(({ savePlayer }) => savePlayer(newPlayer)).catch(() => {})
    setName(''); setPosition(''); setNumber('')
  }

  function handleDelete(id) {
    const updated = players.filter(p => p.id !== id)
    setPlayers(updated)
    saveLocal(updated)
    import('../firebase/db').then(({ removePlayerFromDB }) => removePlayerFromDB(id)).catch(() => {})
    setConfirmDelete(null)
  }

  return (
    <div className="min-h-screen pb-10 safe-top bg-qf-dark">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="text-qf-blue text-2xl active:scale-90">←</button>
        <img src="/logo.jpg" alt="QF" className="w-8 h-8 rounded-full object-cover" />
        <h1 className="text-xl font-bold">Plantel</h1>
        <span className="ml-auto text-gray-500 text-sm">{players.length} jugadores</span>
      </div>

      <div className="px-4 mb-4">
        <div className="bg-qf-card rounded-2xl p-4 border border-qf-border flex flex-col gap-3">
          <h2 className="font-bold">➕ Nuevo jugador</h2>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nombre del jugador"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
          />
          <div className="flex gap-2">
            {POSITIONS.map(p => (
              <button key={p} onClick={() => setPosition(position === p ? '' : p)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm active:scale-95 ${position === p ? 'bg-qf-blue text-black' : 'bg-qf-dark text-gray-400'}`}>
                {p}
              </button>
            ))}
          </div>
          <input
            type="number" value={number} onChange={e => setNumber(e.target.value)}
            placeholder="Número (opcional)" min="1" max="99"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
          />
          <button onClick={handleAdd} disabled={!name.trim()}
            className="w-full py-3 rounded-2xl bg-qf-blue text-black font-bold active:scale-95 disabled:opacity-40">
            Agregar al plantel
          </button>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {players.length === 0 && (
          <p className="text-gray-500 text-center mt-6 text-sm">Agregá jugadores para empezar a armar equipos.</p>
        )}
        {players.map(player => (
          <div key={player.id} className="flex items-center gap-3 bg-qf-card rounded-2xl px-4 py-3 border border-qf-border">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold bg-qf-blue/20 text-qf-blue flex-shrink-0">
              {player.photo ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" /> : initials(player.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{player.name}</p>
              <div className="flex gap-1 mt-0.5">
                {player.position && <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-qf-blue/20 text-qf-blue">{player.position}</span>}
                {player.number && <span className="text-xs text-gray-500">#{player.number}</span>}
              </div>
            </div>
            <button onClick={() => setConfirmDelete(player.id)} className="text-red-500 text-lg px-2 active:scale-90">🗑️</button>
          </div>
        ))}
      </div>

      {dupeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-qf-card rounded-2xl p-6 w-full max-w-sm border border-qf-border text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-lg mb-2">Jugador duplicado</p>
            <p className="text-gray-400 text-sm mb-6">Ya existe un jugador con ese nombre en el plantel.</p>
            <button onClick={() => setDupeModal(false)} className="w-full py-3 rounded-xl bg-qf-blue text-black font-bold active:scale-95">Entendido</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-qf-card rounded-2xl p-6 w-full max-w-sm border border-qf-border">
            <p className="font-bold text-lg text-center mb-2">¿Eliminar jugador?</p>
            <p className="text-gray-400 text-sm text-center mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl bg-qf-dark text-gray-300 font-semibold active:scale-95">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold active:scale-95">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}