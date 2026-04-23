import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatch, DEFAULT_COLORS } from '../context/MatchContext'
import { uploadPlayerPhoto } from '../firebase/db'

const POSITIONS = ['DEL', 'MED', 'DEF', 'ARQ']

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function PlayerProfileModal({ player, teamColor, onSave, onClose }) {
  const [photo, setPhoto]       = useState(player.photo || null)
  const [position, setPosition] = useState(player.position || '')
  const [number, setNumber]     = useState(player.number || '')
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

  function handleSave() {
    onSave({ photo, position, number })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-qf-card rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg">{player.name}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        {/* Photo */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black active:scale-90 transition-transform"
            style={{ backgroundColor: teamColor + '33', color: teamColor }}
          >
            {photo
              ? <img src={photo} alt={player.name} className="w-full h-full object-cover" />
              : initials(player.name)
            }
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-sm text-white">📷</span>
            </div>
          </button>
          <p className="text-gray-400 text-xs mt-2">{uploading ? 'Subiendo...' : 'Tocá para agregar foto'}</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>

        {/* Position */}
        <div className="mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Posición</p>
          <div className="flex gap-2">
            {POSITIONS.map(p => (
              <button
                key={p}
                onClick={() => setPosition(position === p ? '' : p)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  position === p ? 'text-black' : 'bg-qf-dark text-gray-400'
                }`}
                style={position === p ? { backgroundColor: teamColor } : {}}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Number */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Número de camiseta</p>
          <input
            type="number"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="Ej: 10"
            min="1" max="99"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl font-bold text-black active:scale-95 transition-transform"
          style={{ backgroundColor: teamColor }}
        >
          Guardar perfil
        </button>
      </div>
    </div>
  )
}

function TeamSection({ teamKey, team, onUpdate, onPlayerInfo }) {
  const [pasteText, setPasteText] = useState('')
  const [editingPlayer, setEditingPlayer] = useState(null)

  function parsePlayers() {
    const names = pasteText.split(/[\n,]+/).map(n => n.trim()).filter(Boolean)
    if (!names.length) return
    const players = names.map(name => ({ id: crypto.randomUUID(), name, photo: null, position: '', number: '' }))
    onUpdate({ players: [...team.players, ...players] })
    setPasteText('')
  }

  function removePlayer(id) {
    onUpdate({ players: team.players.filter(p => p.id !== id) })
  }

  function handleSaveProfile(playerId, info) {
    onPlayerInfo(teamKey, playerId, info)
  }

  const label = teamKey === 'team1' ? 'Equipo 1' : 'Equipo 2'

  return (
    <div className="bg-qf-card rounded-2xl p-4 flex flex-col gap-4 border border-qf-border">
      <h2 className="font-bold text-lg">{label}</h2>

      <input
        type="text"
        value={team.name}
        onChange={e => onUpdate({ name: e.target.value })}
        placeholder="Nombre del equipo"
        className="bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
      />

      {/* Color */}
      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Color</p>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full transition-transform active:scale-90 border-2 ${team.color === c ? 'border-white scale-110' : 'border-transparent'}`}
            />
          ))}
        </div>
      </div>

      {/* Paste players */}
      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Jugadores (pegá la lista)</p>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder={'Rodo\nTomi G\nDuba\n...'}
          rows={4}
          className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue resize-none text-sm"
        />
        <button
          onClick={parsePlayers}
          disabled={!pasteText.trim()}
          className="mt-2 w-full py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40 text-black"
          style={{ backgroundColor: team.color }}
        >
          Agregar jugadores
        </button>
      </div>

      {/* Player list */}
      {team.players.length > 0 && (
        <div className="flex flex-col gap-2">
          {team.players.map(player => (
            <div key={player.id} className="flex items-center gap-3 bg-qf-dark rounded-xl px-3 py-2">
              <button
                onClick={() => setEditingPlayer(player)}
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0 active:scale-90 transition-transform"
                style={{ backgroundColor: team.color + '33', color: team.color }}
              >
                {player.photo
                  ? <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                  : initials(player.name)
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.name}</p>
                <div className="flex gap-1 mt-0.5">
                  {player.position && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: team.color + '33', color: team.color }}>
                      {player.position}
                    </span>
                  )}
                  {player.number && (
                    <span className="text-xs text-gray-500">#{player.number}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditingPlayer(player)} className="text-gray-500 text-xs px-2 active:scale-90">✏️</button>
              <button onClick={() => removePlayer(player.id)} className="text-red-500 text-lg px-1 active:scale-90">✕</button>
            </div>
          ))}
        </div>
      )}

      {editingPlayer && (
        <PlayerProfileModal
          player={editingPlayer}
          teamColor={team.color}
          onSave={info => handleSaveProfile(editingPlayer.id, info)}
          onClose={() => setEditingPlayer(null)}
        />
      )}
    </div>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const { state, dispatch } = useMatch()
  const { setup } = state
  const DURATIONS = [20, 25, 30, 35, 40, 45, 60, 90]

  function updateTeam(teamKey, payload) {
    dispatch({ type: 'UPDATE_TEAM', teamKey, payload })
  }

  function handlePlayerInfo(teamKey, playerId, info) {
    dispatch({ type: 'UPDATE_PLAYER_INFO', payload: { teamKey, playerId, info } })
  }

  function canStart() {
    return setup.team1.players.length >= 1 && setup.team2.players.length >= 1
  }

  function handleStart() {
    dispatch({ type: 'START_MATCH' })
    navigate('/match')
  }

  return (
    <div className="min-h-screen pb-32 safe-top bg-qf-dark">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="text-qf-blue text-2xl active:scale-90">←</button>
        <img src="/logo.jpg" alt="QF" className="w-8 h-8 rounded-full object-cover" />
        <h1 className="text-xl font-bold">Configurar partido</h1>
      </div>

      <div className="px-4 flex flex-col gap-5">
        {/* Stadium */}
        <div className="bg-qf-card rounded-2xl p-4 border border-qf-border">
          <h2 className="font-bold text-lg mb-3">🏟️ Estadio</h2>
          <input
            type="text"
            value={setup.stadium}
            onChange={e => dispatch({ type: 'UPDATE_SETUP', payload: { stadium: e.target.value } })}
            placeholder="Nombre del estadio o cancha"
            className="w-full bg-qf-dark rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-qf-blue"
          />
        </div>

        {/* Duration */}
        <div className="bg-qf-card rounded-2xl p-4 border border-qf-border">
          <h2 className="font-bold text-lg mb-3">⏱️ Tiempo de juego</h2>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => dispatch({ type: 'UPDATE_SETUP', payload: { duration: d } })}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  setup.duration === d ? 'bg-qf-blue text-black' : 'bg-qf-dark text-gray-400'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <TeamSection teamKey="team1" team={setup.team1} onUpdate={p => updateTeam('team1', p)} onPlayerInfo={handlePlayerInfo} />
        <TeamSection teamKey="team2" team={setup.team2} onUpdate={p => updateTeam('team2', p)} onPlayerInfo={handlePlayerInfo} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-qf-dark via-qf-dark/90 to-transparent safe-bottom">
        <button
          onClick={handleStart}
          disabled={!canStart()}
          className="w-full py-4 rounded-2xl bg-qf-blue text-black font-bold text-xl active:scale-95 transition-transform disabled:opacity-40"
        >
          ⚽ Arrancar partido
        </button>
        {!canStart() && (
          <p className="text-center text-gray-500 text-xs mt-2">Agregá jugadores a ambos equipos para continuar</p>
        )}
      </div>
    </div>
  )
}
