import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/Calendar'
import Search from './pages/Search'
import Matrix from './pages/Matrix'
import Detail from './pages/Detail'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg flex">
        <Sidebar />
        <div className="flex-1 ml-56 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-6 pt-20 overflow-y-auto">
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/search"   element={<Search />} />
              <Route path="/matrix"   element={<Matrix />} />
              <Route path="/nbfc/:cin" element={<Detail />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}
