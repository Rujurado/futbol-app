import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatch, DEFAULT_COLORS } from '../context/MatchContext'

const POSITIONS = ['DEL', 'MED', 'DEF', 'ARQ']

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function PlantelPickerModal({ plantel, teamPlayers, teamColor, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = plantel.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const isInTeam = name => teamPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-qf-card rounded-t-3xl p-4 pb-10 flex flex-col" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">👥 Seleccionar del plantel</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar jugador..." autoFocus
          className="bg-qf-dark rounded-xl px-4 py-2 text-white placeholder-gray-600 outline-none mb-3 flex-shrink-0"
        />
        {plantel.length === 0 ? (
          <p className="text-gray-500 text-center mt-6 text-sm">El plantel está vacío. Agregalo desde la pantalla de inicio.</p>
        ) : (
          <div className="overflow-y-auto flex-1 flex flex-col gap-2">
            {filtered.map(player => {
              const inTeam = isInTeam(player.name)
              return (
                <button key={player.id} onClick={() => !inTeam && onAdd(player)} disabled={inTeam}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left w-full active:scale-95 ${inTeam ? 'opacity-40 bg-qf-dark/30' : 'bg-qf-dark'}`}>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: teamColor + '33', color: teamColor }}>
                    {player.photo ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" /> : initials(player.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{player.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {player.position && <span className="text-xs font-bold" style={{ color: teamColor }}>{player.position}</span>}
                      {player.number && <span className="text-xs text-gray-500">#{player.number}</span>}
                    </div>
                  </div>
                  {inTeam
                    ? <span className="text-xs text-gray-500 flex-shrink-0">Ya en equipo</span>
                    : <span className="text-xl font-bold flex-shrink-0" style={{ color: teamColor }}>+</span>
                  }
                </button>
              )
            })}
            {filtered.length === 0 && search && (
              <p className="text-gray-500 text-center mt-4 text-sm">Sin resultados para "{search}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PlayerProfileModal({ player, teamColor, onSave, onClose }) {
  const [photo, setPhoto] = useState(player.photo || null)
  const [position, setPosition] = useState(player.position || '')
  const [number, setNumber] = useState(player.number || '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { uploadPlayerPhoto } = await import('../firebase/db')
      const url = await uploadPlayerPhoto(file, player.id)
      setPhoto(url)
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-qf-card rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">{player.name}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="flex flex-col items-center mb-6">
          <button onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black active:scale-90 transition-transform"
            style={{ backgroundColor: teamColor + '33', color: teamColor }}>
            {photo ? <img src={photo} alt={player.name} className="w-full h-full object-cover" /> : initials(player.name)}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-sm text-white">📷</span>
            </div>
          </button>
          <p className="text-gray-400 text-xs mt-2">{uploading ? 'Subiendo...' : 'Tocá para agregar foto'}</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>
        <div className="mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Posición</p>
          <div className="flex gap-2">
            {POSITIONS.map(p => (
              <button key={p} onClick={() => setPosition(position === p ? '' : p)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${position === p ? 'text-black' : 'bg-qf-dark text-gray-400'}`}
                style={position === p ? { backgroundColor: teamColor } : {}}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Número de camiseta</p>
          <input type="number" value={number} onChange={e => setNumber(e.target.value)}
            placeholder="Ej: 10" min="1" max="99"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue" />
        </div>
        <button onClick={() => { onSave({ photo, position, number }); onClose() }}
          className="w-full py-3 rounded-2xl font-bold text-black active:scale-95 transition-transform"
          style={{ backgroundColor: teamColor }}>
          Guardar perfil
        </button>
      </div>
    </div>
  )
}

function TeamSection({ teamKey, team, plantel, onUpdate, onPlayerInfo }) {
  const [pasteText, setPasteText] = useState('')
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [dupeWarning, setDupeWarning] = useState([])

  function parsePlayers() {
    const names = pasteText.split(/[\n,]+/).map(n => n.trim()).filter(Boolean)
    if (!names.length) return
    const existingNames = team.players.map(p => p.name.toLowerCase())
    const dupes = names.filter(n => existingNames.includes(n.toLowerCase()))
    const newNames = names.filter(n => !existingNames.includes(n.toLowerCase()))
    if (dupes.length > 0) setDupeWarning(dupes)
    if (newNames.length > 0) {
      const newPlayers = newNames.map(name => ({ id: crypto.randomUUID(), name, photo: null, position: '', number: '' }))
      onUpdate({ players: [...team.players, ...newPlayers] })
    }
    setPasteText('')
  }

  function addFromPlantel(plantelPlayer) {
    const player = {
      id: crypto.randomUUID(),
      name: plantelPlayer.name,
      photo: plantelPlayer.photo || null,
      position: plantelPlayer.position || '',
      number: plantelPlayer.number || '',
    }
    onUpdate({ players: [...team.players, player] })
  }

  return (
    <div className="bg-qf-card rounded-2xl p-4 flex flex-col gap-4 border border-qf-border">
      <h2 className="font-bold text-lg">{teamKey === 'team1' ? 'Equipo 1' : 'Equipo 2'}</h2>

      <input type="text" value={team.name} onChange={e => onUpdate({ name: e.target.value })}
        placeholder="Nombre del equipo"
        className="bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue" />

      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Color</p>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_COLORS.map(c => (
            <button key={c} onClick={() => onUpdate({ color: c })} style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full transition-transform active:scale-90 border-2 ${team.color === c ? 'border-white scale-110' : 'border-transparent'}`} />
          ))}
        </div>
      </div>

      {plantel.length > 0 && (
        <button onClick={() => setShowPicker(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm active:scale-95 border flex items-center justify-center gap-2"
          style={{ borderColor: team.color + '60', color: team.color, backgroundColor: team.color + '15' }}>
          👥 Seleccionar del plantel ({plantel.length} disponibles)
        </button>
      )}

      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">O pegá la lista manualmente</p>
        <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
          placeholder={'Rodo\nTomi G\nDuba\n...'} rows={4}
          className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue resize-none text-sm" />
        <button onClick={parsePlayers} disabled={!pasteText.trim()}
          className="mt-2 w-full py-2 rounded-xl font-semibold text-sm active:scale-95 disabled:opacity-40 text-black"
          style={{ backgroundColor: team.color }}>
          Agregar jugadores
        </button>
      </div>

      {team.players.length > 0 && (
        <div className="flex flex-col gap-2">
          {team.players.map(player => (
            <div key={player.id} className="flex items-center gap-3 bg-qf-dark rounded-xl px-3 py-2">
              <button onClick={() => setEditingPlayer(player)}
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0 active:scale-90"
                style={{ backgroundColor: team.color + '33', color: team.color }}>
                {player.photo ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" /> : initials(player.name)}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.name}</p>
                <div className="flex gap-1 mt-0.5">
                  {player.position && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: team.color + '33', color: team.color }}>{player.position}</span>}
                  {player.number && <span className="text-xs text-gray-500">#{player.number}</span>}
                </div>
              </div>
              <button onClick={() => setEditingPlayer(player)} className="text-gray-500 text-xs px-2 active:scale-90">✏️</button>
              <button onClick={() => onUpdate({ players: team.players.filter(p => p.id !== player.id) })} className="text-red-500 text-lg px-1 active:scale-90">✕</button>
            </div>
          ))}
        </div>
      )}

      {showPicker && (
        <PlantelPickerModal plantel={plantel} teamPlayers={team.players} teamColor={team.color}
          onAdd={p => addFromPlantel(p)} onClose={() => setShowPicker(false)} />
      )}

      {editingPlayer && (
        <PlayerProfileModal player={editingPlayer} teamColor={team.color}
          onSave={info => { onPlayerInfo(teamKey, editingPlayer.id, info); setEditingPlayer(null) }}
          onClose={() => setEditingPlayer(null)} />
      )}

      {dupeWarning.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-qf-card rounded-2xl p-6 w-full max-w-sm border border-qf-border text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-lg mb-2">Jugadores duplicados</p>
            <p className="text-gray-400 text-sm mb-4">Ya están en el equipo y no se agregaron:</p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {dupeWarning.map(n => <span key={n} className="bg-qf-dark px-3 py-1 rounded-full text-sm text-gray-300">{n}</span>)}
            </div>
            <button onClick={() => setDupeWarning([])} className="w-full py-3 rounded-xl bg-qf-blue text-black font-bold active:scale-95">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const { state, dispatch } = useMatch()
  const { setup } = state
  const DURATIONS = [20, 25, 30, 35, 40, 45, 60, 90]
  const [plantel, setPlantel] = useState([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('qf_plantel')
      if (saved) setPlantel(JSON.parse(saved))
    } catch {}
    import('../firebase/db').then(({ getPlayers }) =>
      getPlayers().then(cloud => { if (cloud.length > 0) setPlantel(cloud) }).catch(() => {})
    ).catch(() => {})
  }, [])

  function updateTeam(teamKey, payload) {
    dispatch({ type: 'UPDATE_TEAM', teamKey, payload })
  }

  function handlePlayerInfo(teamKey, playerId, info) {
    dispatch({ type: 'UPDATE_PLAYER_INFO', payload: { teamKey, playerId, info } })
  }

  function handleStart() {
    dispatch({ type: 'START_MATCH' })
    navigate('/match')
  }

  const canStart = setup.team1.players.length >= 1 && setup.team2.players.length >= 1

  return (
    <div className="min-h-screen pb-32 safe-top bg-qf-dark">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="text-qf-blue text-2xl active:scale-90">←</button>
        <img src="/logo.jpg" alt="QF" className="w-8 h-8 rounded-full object-cover" />
        <h1 className="text-xl font-bold">Configurar partido</h1>
      </div>

      <div className="px-4 flex flex-col gap-5">
        <div className="bg-qf-card rounded-2xl p-4 border border-qf-border">
          <h2 className="font-bold text-lg mb-3">🏟️ Estadio</h2>
          <input type="text" value={setup.stadium}
            onChange={e => dispatch({ type: 'UPDATE_SETUP', payload: { stadium: e.target.value } })}
            placeholder="Nombre del estadio o cancha"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue" />
        </div>

        <div className="bg-qf-card rounded-2xl p-4 border border-qf-border">
          <h2 className="font-bold text-lg mb-3">⏱️ Tiempo de juego</h2>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => dispatch({ type: 'UPDATE_SETUP', payload: { duration: d } })}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${setup.duration === d ? 'bg-qf-blue text-black' : 'bg-qf-dark text-gray-400'}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div className="bg-qf-card rounded-2xl p-4 border border-qf-border">
          <h2 className="font-bold text-lg mb-3">🔁 Tiempos</h2>
          <div className="flex gap-3">
            {[1, 2].map(h => (
              <button key={h} onClick={() => dispatch({ type: 'UPDATE_SETUP', payload: { halves: h } })}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${(setup.halves ?? 1) === h ? 'bg-qf-blue text-black' : 'bg-qf-dark text-gray-400'}`}>
                {h === 1 ? '1 tiempo' : '2 tiempos'}
              </button>
            ))}
          </div>
        </div>

        <TeamSection teamKey="team1" team={setup.team1} plantel={plantel}
          onUpdate={p => updateTeam('team1', p)} onPlayerInfo={handlePlayerInfo} />
        <TeamSection teamKey="team2" team={setup.team2} plantel={plantel}
          onUpdate={p => updateTeam('team2', p)} onPlayerInfo={handlePlayerInfo} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-qf-dark via-qf-dark/90 to-transparent safe-bottom">
        <button onClick={handleStart} disabled={!canStart}
          className="w-full py-4 rounded-2xl bg-qf-blue text-black font-bold text-xl active:scale-95 transition-transform disabled:opacity-40">
          ⚽ Arrancar partido
        </button>
        {!canStart && <p className="text-center text-gray-500 text-xs mt-2">Agregá jugadores a ambos equipos para continuar</p>}
      </div>
    </div>
  )
}