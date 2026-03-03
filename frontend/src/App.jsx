import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import QuickStartPage from './pages/QuickStartPage'
import SessionPage from './pages/SessionPage'
import ReportPage from './pages/ReportPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/start" element={<QuickStartPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/report/:sessionId" element={<ReportPage />} />
    </Routes>
  )
}
