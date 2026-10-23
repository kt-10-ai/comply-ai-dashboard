import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// mfaStatus:
//   'verified'      → session is aal2, full access
//   'needs_enroll'  → no authenticator set up yet, must enrol before access
//   'needs_verify'  → authenticator set up, must enter a code this session
async function resolveMfaStatus() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) return 'needs_verify'
  if (data.currentLevel === 'aal2') return 'verified'
  return data.nextLevel === 'aal2' ? 'needs_verify' : 'needs_enroll'
}

export function AuthProvider({ children }) {
  const bypass = import.meta.env.VITE_BYPASS_AUTH === 'true'
  const [user, setUser]           = useState(bypass ? { id: 'local-dev', email: 'dev@localhost' } : null)
  const [mfaStatus, setMfaStatus] = useState(bypass ? 'verified' : null)
  const [loading, setLoading]     = useState(!bypass)

  const syncSession = async (session) => {
    setUser(session?.user ?? null)
    setMfaStatus(session ? await resolveMfaStatus() : null)
    setLoading(false)
  }

  useEffect(() => {
    if (bypass) return
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => syncSession(session))

    // Listen for auth state changes (incl. MFA_CHALLENGE_VERIFIED).
    // Deferred because awaiting supabase calls inside this callback can deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => syncSession(session), 0)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshMfa = async () => {
    if (bypass) return
    setMfaStatus(await resolveMfaStatus())
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, mfaStatus, loading, signIn, signUp, signOut, refreshMfa }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
