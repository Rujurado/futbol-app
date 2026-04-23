import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatch, DEFAULT_COLORS } from '../context/MatchContext'
import { uploadPlayerPhoto } from '../firebase/db'

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function TeamSection({ teamKey, team, onUpdate, onPlayerPhoto }) {
  const [pasteText, setPasteText] = useState('')
  const fileRefs = useRef({})

  function parsePlayers() {
    const names = pasteText
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(Boolean)
    if (!names.length) return
    const players = names.map(name => ({ id: crypto.randomUUID(), name, photo: null }))
    onUpdate({ players })
    setPasteText('')
  }

  function removePlayer(id) {
    onUpdate({ players: team.players.filter(p => p.id !== id) })
  }

  async function handlePhotoClick(player) {
    fileRefs.current[player.id]?.click()
  }

  async function handleFileChange(e, player) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadPlayerPhoto(file, player.id)
      onPlayerPhoto(teamKey, player.id, url)
    } catch (err) {
      alert(err.message)
    }
    e.target.value = ''
  }

  const label = teamKey === 'team1' ? 'Equipo 1' : 'Equipo 2'

  return (
    <div className="bg-green-900/40 rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="font-bold text-lg">{label}</h2>

      {/* Name */}
      <input
        type="text"
        value={team.name}
        onChange={e => onUpdate({ name: e.target.value })}
        placeholder="Nombre del equipo"
        className="bg-green-950 rounded-xl px-4 py-3 text-white placeholder-green-600 outline-none focus:ring-2 focus:ring-green-400"
      />

      {/* Color picker */}
      <div>
        <p className="text-green-400 text-xs mb-2 uppercase tracking-wider">Color</p>
        <div className="flex gap-2 flex-wrap">
          {DEFAULT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${team.color === c ? 'ring-2 ring-white scale-110' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Paste players */}
      <div>
        <p className="text-green-400 text-xs mb-2 uppercase tracking-wider">Jugadores (pegá la lista)</p>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder={'Juan Pérez\nCarlos Gómez\nLucas Torres\n...'}
          rows={4}
          className="w-full bg-green-950 rounded-xl px-4 py-3 text-white placeholder-green-600 outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm"
        />
        <button
          onClick={parsePlayers}
          disabled={!pasteText.trim()}
          className="mt-2 w-full py-2 rounded-xl bg-green-500 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          Asignar jugadores al equipo
        </button>
      </div>

      {/* Player list */}
      {team.players.length > 0 && (
        <div className="flex flex-col gap-2">
          {team.players.map(player => (
            <div key={player.id} className="flex items-center gap-3 bg-green-950/60 rounded-xl px-3 py-2">
              <button
                onClick={() => handlePhotoClick(player)}
                className="avatar w-10 h-10 text-sm flex-shrink-0 active:scale-90 transition-transform"
                style={{ backgroundColor: team.color + '33', color: team.color }}
                title="Tocar para agregar foto"
              >
                {player.photo
                  ? <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                  : initials(player.name)
                }
              </button>
              <span className="flex-1 text-sm font-medium">{player.name}</span>
              <button onClick={() => removePlayer(player.id)} className="text-red-400 text-lg px-1 active:scale-90">✕</button>
              <input
                ref={el => { if (el) fileRefs.current[player.id] = el }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => handleFileChange(e, player)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const { state, dispatch } = useMatch()
  const { setup } = state

  const DURATIONS = [20, 30, 40, 45, 60, 90]

  function updateTeam(teamKey, payload) {
    dispatch({ type: 'UPDATE_TEAM', teamKey, payload })
  }

  function handlePlayerPhoto(teamKey, playerId, photoUrl) {
    dispatch({ type: 'UPDATE_PLAYER_PHOTO', payload: { teamKey, playerId, photoUrl } })
  }

  function canStart() {
    return setup.team1.players.length >= 1 && setup.team2.players.length >= 1
  }

  function handleStart() {
    dispatch({ type: 'START_MATCH' })
    navigate('/match')
  }

  return (
    <div className="min-h-screen pb-32 safe-top">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-6 pb-4">
        <button onClick={() => navigate('/')} className="text-green-400 text-2xl active:scale-90">←</button>
        <h1 className="text-xl font-bold">Configurar partido</h1>
      </div>

      <div className="px-4 flex flex-col gap-5">
        {/* Stadium */}
        <div className="bg-green-900/40 rounded-2xl p-4">
          <h2 className="font-bold text-lg mb-3">🏟️ Estadio</h2>
          <input
            type="text"
            value={setup.stadium}
            onChange={e => dispatch({ type: 'UPDATE_SETUP', payload: { stadium: e.target.value } })}
            placeholder="Nombre del estadio o cancha"
            className="w-full bg-green-950 rounded-xl px-4 py-3 text-white placeholder-green-600 outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Duration */}
        <div className="bg-green-900/40 rounded-2xl p-4">
          <h2 className="font-bold text-lg mb-3">⏱️ Tiempo de juego</h2>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => dispatch({ type: 'UPDATE_SETUP', payload: { duration: d } })}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  setup.duration === d
                    ? 'bg-green-400 text-green-950'
                    : 'bg-green-950 text-green-300'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Teams */}
        <TeamSection
          teamKey="team1"
          team={setup.team1}
          onUpdate={p => updateTeam('team1', p)}
          onPlayerPhoto={handlePlayerPhoto}
        />
        <TeamSection
          teamKey="team2"
          team={setup.team2}
          onUpdate={p => updateTeam('team2', p)}
          onPlayerPhoto={handlePlayerPhoto}
        />
      </div>

      {/* Start button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-green-950 via-green-950/90 to-transparent safe-bottom">
        <button
          onClick={handleStart}
          disabled={!canStart()}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-xl active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⚽ Arrancar partido
        </button>
        {!canStart() && (
          <p className="text-center text-green-500 text-xs mt-2">Agregá jugadores a ambos equipos para continuar</p>
        )}
      </div>
    </div>
  )
}
