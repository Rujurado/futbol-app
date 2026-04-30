import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const POSITIONS = ['DEL', 'MED', 'DEF', 'ARQ']

const POSITION_COLORS = {
  DEL: { bg: 'bg-red-500/20', text: 'text-red-400' },
  MED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  DEF: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  ARQ: { bg: 'bg-green-500/20', text: 'text-green-400' },
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('qf_plantel') || '[]') } catch { return [] }
}
function saveLocal(players) {
  localStorage.setItem('qf_plantel', JSON.stringify(players))
}

function PlayerModal({ player, existingNames, onSave, onClose }) {
  const [name, setName] = useState(player?.name || '')
  const [position, setPosition] = useState(player?.position || '')
  const [number, setNumber] = useState(player?.number || '')
  const [photo, setPhoto] = useState(player?.photo || null)
  const [uploading, setUploading] = useState(false)
  const [dupeError, setDupeError] = useState(false)
  const fileRef = useRef()
  const tempId = useRef(player?.id || crypto.randomUUID())

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { uploadPlayerPhoto } = await import('../firebase/db')
      const url = await uploadPlayerPhoto(file, tempId.current)
      setPhoto(url)
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    const isDupe = existingNames
      .filter(n => !player || n !== player.name.toLowerCase())
      .includes(trimmed.toLowerCase())
    if (isDupe) { setDupeError(true); return }
    onSave({ id: tempId.current, name: trimmed, position, number, photo })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80" onClick={onClose}>
      <div className="w-full max-w-md bg-gray-900 rounded-t-3xl p-6 pb-10 border-t border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg text-white">{player ? 'Editar jugador' : 'Nuevo jugador'}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="flex flex-col items-center mb-5">
          <button onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black bg-sky-400/20 text-sky-400 border-2 border-sky-400/40 active:scale-90 transition-transform">
            {photo
              ? <img src={photo} alt={name} className="w-full h-full object-cover" />
              : <span>{initials(name) || '?'}</span>
            }
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl">📷</span>
            </div>
          </button>
          <p className="text-gray-500 text-xs mt-2">{uploading ? 'Subiendo...' : 'Tocá para agregar foto'}</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Nombre *</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setDupeError(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Ej: Tomi G"
              className={`w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none border ${dupeError ? 'border-red-500' : 'border-gray-700'} focus:border-sky-400`} />
            {dupeError && <p className="text-red-400 text-xs mt-1">Ya existe un jugador con ese nombre</p>}
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Posición</label>
            <div className="flex gap-2">
              {POSITIONS.map(p => (
                <button key={p} onClick={() => setPosition(position === p ? '' : p)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all active:scale-95 ${
                    position === p
                      ? 'bg-sky-400 text-black border-sky-400'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Número de camiseta</label>
            <input type="number" value={number} onChange={e => setNumber(e.target.value)}
              placeholder="Ej: 10" min="1" max="99"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none border border-gray-700 focus:border-sky-400" />
          </div>

          <button onClick={handleSave} disabled={!name.trim() || uploading}
            className="w-full py-3.5 rounded-2xl bg-sky-400 text-black font-bold text-base active:scale-95 disabled:opacity-40 mt-2">
            {player ? 'Guardar cambios' : 'Agregar al plantel'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EstadisticasTab({ players }) {
  const [stats, setStats] = useState([])

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('qf_match_history') || '[]')
      const map = {}
      history.forEach(m => {
        ;(m.goals || []).forEach(g => {
          const key = g.player.name.toLowerCase()
          if (!map[key]) map[key] = { name: g.player.name, goals: 0, matches: new Set() }
          map[key].goals++
          map[key].matches.add(m.id || m.createdAt)
        })
      })
      setStats(Object.values(map).map(s => ({ ...s, matches: s.matches.size })).sort((a, b) => b.goals - a.goals))
    } catch {}
  }, [])

  const enriched = stats.map(s => {
    const p = players.find(p => p.name.toLowerCase() === s.name.toLowerCase())
    return { ...s, photo: p?.photo || null }
  })

  if (enriched.length === 0) {
    return <p className="text-gray-500 text-center mt-12 text-sm">No hay estadísticas todavía.<br/>Jugá un partido para ver los goleadores.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {enriched.map((s, i) => (
        <div key={s.name} className="flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-3 border border-gray-700/60">
          <span className="text-gray-500 font-black text-lg w-7 text-center">{i + 1}</span>
          <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold bg-sky-400/20 text-sky-400 flex-shrink-0">
            {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : initials(s.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{s.name}</p>
            <p className="text-gray-500 text-xs">{s.matches} {s.matches === 1 ? 'partido' : 'partidos'}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-sky-400">{s.goals}</span>
            <span className="text-gray-500 text-xs">⚽</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Players() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [tab, setTab] = useState('plantel')
  const [showModal, setShowModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setPlayers(loadLocal())
    import('../firebase/db').then(({ getPlayers }) =>
      getPlayers().then(cloud => {
        if (cloud.length > 0) { setPlayers(cloud); saveLocal(cloud) }
      }).catch(() => {})
    ).catch(() => {})
  }, [])

  function handleSave(data) {
    let updated
    if (editingPlayer) {
      updated = players.map(p => p.id === editingPlayer.id ? { ...p, ...data } : p)
    } else {
      updated = [...players, data]
    }
    const sorted = updated.sort((a, b) => a.name.localeCompare(b.name))
    setPlayers(sorted)
    saveLocal(sorted)
    import('../firebase/db').then(({ savePlayer }) => savePlayer(data)).catch(() => {})
    setEditingPlayer(null)
  }

  function handleDelete(id) {
    const updated = players.filter(p => p.id !== id)
    setPlayers(updated)
    saveLocal(updated)
    import('../firebase/db').then(({ removePlayerFromDB }) => removePlayerFromDB(id)).catch(() => {})
    setConfirmDelete(null)
  }

  const existingNames = players.map(p => p.name.toLowerCase())

  return (
    <div className="min-h-screen bg-gray-950 safe-top pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="text-sky-400 text-2xl w-10 h-10 flex items-center justify-center active:scale-90">←</button>
        <img src="/logo.jpg" alt="QF" className="w-9 h-9 rounded-full object-cover border-2 border-sky-400/40" />
        <h1 className="text-xl font-bold text-white flex-1">Plantel</h1>
        <button
          onClick={() => { setEditingPlayer(null); setShowModal(true) }}
          className="w-10 h-10 rounded-full bg-sky-400 text-black font-bold text-2xl flex items-center justify-center active:scale-90 shadow-lg shadow-sky-400/20">
          +
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        <button onClick={() => setTab('plantel')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${tab === 'plantel' ? 'bg-sky-400 text-black' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
          👥 Plantel
        </button>
        <button onClick={() => setTab('stats')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${tab === 'stats' ? 'bg-sky-400 text-black' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
          📊 Estadísticas
        </button>
      </div>

      <div className="px-4">
        {tab === 'plantel' && (
          <div className="flex flex-col gap-2">
            {players.length === 0 && (
              <div className="text-center mt-12">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-white font-semibold mb-1">El plantel está vacío</p>
                <p className="text-gray-500 text-sm">Tocá el + para agregar jugadores</p>
              </div>
            )}
            {players.map(player => {
              const posColor = POSITION_COLORS[player.position]
              return (
                <div key={player.id} className="flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-3 border border-gray-700/60">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-base font-bold bg-sky-400/20 text-sky-400 flex-shrink-0 border border-sky-400/20">
                    {player.photo ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" /> : initials(player.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{player.name}</p>
                    <div className="flex gap-1.5 mt-0.5 items-center">
                      {player.position && posColor && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${posColor.bg} ${posColor.text}`}>
                          {player.position}
                        </span>
                      )}
                      {player.number && <span className="text-gray-500 text-xs">#{player.number}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingPlayer(player); setShowModal(true) }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400 active:scale-90 border border-yellow-400/20">
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDelete(player.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 active:scale-90 border border-red-500/20">
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'stats' && <EstadisticasTab players={players} />}
      </div>

      {showModal && (
        <PlayerModal
          player={editingPlayer}
          existingNames={existingNames}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingPlayer(null) }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <p className="font-bold text-lg text-center text-white mb-2">¿Eliminar jugador?</p>
            <p className="text-gray-400 text-sm text-center mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-200 font-semibold active:scale-95 border border-gray-700">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold active:scale-95">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}