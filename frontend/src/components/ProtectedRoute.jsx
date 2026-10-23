import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, mfaStatus, loading } = useAuth()

  if (loading || (user && !mfaStatus)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-subtext font-body">Loading session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Password alone isn't enough — every user must pass the authenticator step
  if (mfaStatus !== 'verified') {
    return <Navigate to="/mfa" replace />
  }

  return children
}
