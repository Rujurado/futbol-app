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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 safe-top safe-bottom no-select" style={{backgroundColor:'#080c10'}}>
      <div className="flex flex-col items-center mb-10">
        <img src="/logo.jpg" alt="Quinta-Feira FC" className="w-36 h-36 rounded-full object-cover shadow-2xl mb-4" style={{border:'4px solid #38bdf8'}} />
        <h1 className="text-3xl font-black tracking-tight text-white">QUINTA-FEIRA FC</h1>
        <p className="text-xs uppercase tracking-widest mt-1" style={{color:'#38bdf8'}}>EST. 2023 · Football Club</p>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-4">
        {hasActiveMatch && (
          <button onClick={() => navigate('/match')} className="w-full py-4 rounded-2xl bg-yellow-400 text-yellow-900 font-bold text-lg active:scale-95 transition-transform">
            ▶ Continuar partido
          </button>
        )}
        <button onClick={handleNewMatch} className="w-full py-4 rounded-2xl text-black font-bold text-lg active:scale-95 transition-transform" style={{backgroundColor:'#38bdf8'}}>
          ⚽ Nuevo partido
        </button>
        <button onClick={() => navigate('/history')} className="w-full py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform" style={{backgroundColor:'#111827', color:'#38bdf8', border:'1px solid #38bdf833'}}>
          📋 Historial & Goleadores
        </button>
      </div>
      <p className="text-xs mt-12" style={{color:'#4b5563'}}>⚽ Marcador oficial Quinta-Feira</p>
    </div>
  )
}