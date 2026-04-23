import { useNavigate } from 'react-router-dom'
import { useMatch } from '../context/MatchContext'

export default function Home() {
  const navigate = useNavigate()
  const { state, dispatch } = useMatch()
  const hasActiveMatch = state.match && state.match.status !== 'finished'

  function handleNewMatch() {
    if (hasActiveMatch) {
      if (!confirm('Hay un partido en curso. ¿Querés descartarlo y empezar uno nuevo?')) return
      dispatch({ type: 'CLEAR_MATCH' })
    }
    navigate('/setup')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 safe-top safe-bottom no-select">
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">⚽</div>
        <h1 className="text-4xl font-black tracking-tight">Fútbol App</h1>
        <p className="text-green-400 mt-2 text-sm">Marcador · Goles · Estadísticas</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {hasActiveMatch && (
          <button
            onClick={() => navigate('/match')}
            className="w-full py-4 rounded-2xl bg-yellow-400 text-yellow-900 font-bold text-lg active:scale-95 transition-transform"
          >
            ▶ Continuar partido
          </button>
        )}

        <button
          onClick={handleNewMatch}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-bold text-lg active:scale-95 transition-transform"
        >
          {hasActiveMatch ? '+ Nuevo partido' : '⚽ Nuevo partido'}
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full py-4 rounded-2xl bg-green-900 text-green-300 font-bold text-lg active:scale-95 transition-transform"
        >
          📋 Historial
        </button>
      </div>
    </div>
  )
}
