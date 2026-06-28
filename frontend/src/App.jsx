import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/Calendar'
import Search from './pages/Search'
import Matrix from './pages/Matrix'
import Detail from './pages/Detail'

function AppLayout() {
  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-6 pt-20 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/calendar"  element={<CalendarPage />} />
            <Route path="/search"    element={<Search />} />
            <Route path="/matrix"    element={<Matrix />} />
            <Route path="/nbfc/:cin" element={<Detail />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/auth" element={<Auth />} />

          {/* All other routes are protected */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
