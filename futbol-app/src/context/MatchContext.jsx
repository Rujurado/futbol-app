import { createContext, useContext, useReducer, useEffect } from 'react'

const MatchContext = createContext(null)

const TEAM_COLORS = ['#f97316','#1e293b','#ef4444','#38bdf8','#22c55e','#a855f7','#eab308','#ec4899','#f8fafc','#0ea5e9']

export const DEFAULT_COLORS = TEAM_COLORS

const initialState = {
  setup: {
    stadium: '',
    duration: 40,
    team1: { name: 'Team Wanda', color: '#f97316', players: [] },
    team2: { name: 'Team China', color: '#1e293b', players: [] },
  },
  match: null,
}

function reducer(state, action) {
  switch (action.type) {

    case 'UPDATE_SETUP':
      return { ...state, setup: { ...state.setup, ...action.payload } }

    case 'UPDATE_TEAM':
      return {
        ...state,
        setup: {
          ...state.setup,
          [action.teamKey]: { ...state.setup[action.teamKey], ...action.payload },
        },
      }

    case 'UPDATE_PLAYER_PHOTO': {
      const { teamKey, playerId, photoUrl } = action.payload
      const players = state.setup[teamKey].players.map(p =>
        p.id === playerId ? { ...p, photo: photoUrl } : p
      )
      return {
        ...state,
        setup: { ...state.setup, [teamKey]: { ...state.setup[teamKey], players } },
      }
    }

    case 'UPDATE_PLAYER_INFO': {
      const { teamKey, playerId, info } = action.payload
      const players = state.setup[teamKey].players.map(p =>
        p.id === playerId ? { ...p, ...info } : p
      )
      return {
        ...state,
        setup: { ...state.setup, [teamKey]: { ...state.setup[teamKey], players } },
      }
    }

    case 'START_MATCH':
      return {
        ...state,
        match: {
          id: Date.now().toString(),
          stadium: state.setup.stadium,
          duration: state.setup.duration,
          team1: { ...state.setup.team1 },
          team2: { ...state.setup.team2 },
          startTime: Date.now(),
          pausedElapsed: 0,
          status: 'playing',
          goals: [],
          score1: 0,
          score2: 0,
        },
      }

    case 'PAUSE_MATCH':
      return {
        ...state,
        match: { ...state.match, status: 'paused', pausedAt: Date.now() },
      }

    case 'RESUME_MATCH': {
      const extra = Date.now() - state.match.pausedAt
      return {
        ...state,
        match: {
          ...state.match,
          status: 'playing',
          pausedElapsed: state.match.pausedElapsed + extra,
          pausedAt: null,
        },
      }
    }

    case 'SCORE_GOAL': {
      const { player, teamKey } = action.payload
      const elapsed = state.match.status === 'playing'
        ? Math.floor((Date.now() - state.match.startTime - state.match.pausedElapsed) / 60000)
        : 0
      const scoreKey = teamKey === 'team1' ? 'score1' : 'score2'
      return {
        ...state,
        match: {
          ...state.match,
          [scoreKey]: state.match[scoreKey] + 1,
          goals: [...state.match.goals, { player, teamKey, minute: elapsed, timestamp: Date.now() }],
        },
      }
    }

    case 'FINISH_MATCH':
      return { ...state, match: { ...state.match, status: 'finished' } }

    case 'CLEAR_MATCH':
      return { ...state, match: null }

    default:
      return state
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('futbol_match_state')
    return saved ? JSON.parse(saved) : initialState
  } catch {
    return initialState
  }
}

export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem('futbol_match_state', JSON.stringify(state))
  }, [state])

  return (
    <MatchContext.Provider value={{ state, dispatch }}>
      {children}
    </MatchContext.Provider>
  )
}

export function useMatch() {
  return useContext(MatchContext)
}
