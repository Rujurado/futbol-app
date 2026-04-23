function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function MatchSummary({ match, onClose }) {
  const { team1, team2, score1, score2, goals = [], stadium, duration } = match
  const winner = score1 > score2 ? team1 : score2 > score1 ? team2 : null

  // Top scorer
  const scorerCount = {}
  goals.forEach(g => {
    const key = g.player.name
    scorerCount[key] = { count: (scorerCount[key]?.count || 0) + 1, player: g.player, teamKey: g.teamKey }
  })
  const topScorer = Object.values(scorerCount).sort((a, b) => b.count - a.count)[0]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-qf-dark animate-fade-in safe-top safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="QF" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">Quinta-Feira FC</span>
        </div>
        <span className="text-xs text-gray-500">{stadium || ''}</span>
      </div>

      {/* Final */}
      <div className="text-center mt-4 mb-2">
        <p className="text-qf-blue text-xs uppercase tracking-widest font-bold mb-3">Resultado final</p>

        <div className="flex items-center justify-center gap-4 px-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team1.color }} />
            <p className="font-bold text-center leading-tight">{team1.name}</p>
            <p className="text-6xl font-black tabular-nums" style={{ color: team1.color }}>{score1}</p>
          </div>
          <p className="text-gray-600 text-2xl font-bold">—</p>
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team2.color }} />
            <p className="font-bold text-center leading-tight">{team2.name}</p>
            <p className="text-6xl font-black tabular-nums" style={{ color: team2.color }}>{score2}</p>
          </div>
        </div>

        {winner ? (
          <div className="mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-bold text-black" style={{ backgroundColor: winner.color }}>
            🏆 Ganó {winner.name}
          </div>
        ) : (
          <div className="mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-gray-700 text-gray-200">
            🤝 Empate
          </div>
        )}
      </div>

      {/* Top scorer */}
      {topScorer && (
        <div className="mx-4 mt-5 bg-qf-card rounded-2xl p-4 border border-qf-border flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ backgroundColor: match[topScorer.teamKey]?.color + '33', color: match[topScorer.teamKey]?.color }}
          >
            {topScorer.player.photo
              ? <img src={topScorer.player.photo} alt={topScorer.player.name} className="w-full h-full object-cover" />
              : initials(topScorer.player.name)
            }
          </div>
          <div className="flex-1">
            <p className="text-xs text-qf-blue uppercase tracking-wider">⭐ Goleador del partido</p>
            <p className="font-bold">{topScorer.player.name}</p>
            <p className="text-gray-400 text-sm">{topScorer.count} {topScorer.count === 1 ? 'gol' : 'goles'}</p>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length > 0 && (
        <div className="mx-4 mt-4 bg-qf-card rounded-2xl p-4 border border-qf-border">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">⚽ Goles</p>
          <div className="flex flex-col gap-2">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: match[g.teamKey]?.color }} />
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: match[g.teamKey]?.color + '33', color: match[g.teamKey]?.color }}>
                  {g.player.photo
                    ? <img src={g.player.photo} alt={g.player.name} className="w-full h-full object-cover" />
                    : initials(g.player.name)
                  }
                </div>
                <span className="flex-1 text-sm">{g.player.name}</span>
                <span className="text-gray-500 text-xs">{g.minute}'</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="mx-4 mt-4 bg-qf-card rounded-2xl p-4 border border-qf-border text-center text-gray-500 text-sm">
          Sin goles en este partido
        </div>
      )}

      {/* Stats */}
      <div className="mx-4 mt-4 bg-qf-card rounded-2xl p-4 border border-qf-border">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Estadísticas</p>
        <div className="flex justify-between text-sm">
          <span className="font-bold" style={{ color: team1.color }}>{goals.filter(g => g.teamKey === 'team1').length}</span>
          <span className="text-gray-500">Goles</span>
          <span className="font-bold" style={{ color: team2.color }}>{goals.filter(g => g.teamKey === 'team2').length}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="font-bold text-white">{duration}</span>
          <span className="text-gray-500">Minutos jugados</span>
          <span className="font-bold text-white">{duration}</span>
        </div>
      </div>

      <div className="px-4 mt-6 mb-4">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-qf-blue text-black font-bold text-lg active:scale-95 transition-transform"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}