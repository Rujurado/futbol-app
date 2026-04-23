import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Setup from './pages/Setup'
import Match from './pages/Match'
import History from './pages/History'

export default function App() {
  return (
    <div className="min-h-screen bg-qf-dark text-white font-sans">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/match" element={<Match />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
