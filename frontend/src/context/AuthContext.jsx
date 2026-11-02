import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const LOCAL_USER_KEY = 'comply_ai_local_user'

// Second factor (TOTP authenticator app) is mandatory for every account.
//   'ok'     — session is aal2, user may enter the app
//   'verify' — user has a TOTP factor; must enter a code for this session
//   'enroll' — user has no TOTP factor yet; must set one up
async function getMfaStatus() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  if (data.currentLevel === 'aal2') return 'ok'
  return data.nextLevel === 'aal2' ? 'verify' : 'enroll'
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [mfa, setMfa]         = useState(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async (session) => {
    const u = session?.user ?? null
    setUser(u)
    try {
      setMfa(u ? await getMfaStatus() : null)
    } catch {
      setMfa(u ? 'verify' : null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) {
      const saved = localStorage.getItem(LOCAL_USER_KEY)
      setUser(saved ? JSON.parse(saved) : null)
      setMfa('ok')
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))

    // Don't await Supabase calls inside this callback (supabase-js can deadlock); defer instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => applySession(session), 0)
    })
    return () => subscription.unsubscribe()
  }, [applySession])

  // Local mode (no Supabase, dev server only): any email/password signs in.
  const localSignIn = (email) => {
    const localUser = { id: `local-${btoa(email).replace(/=/g, '')}`, email }
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser))
    setUser(localUser)
    return { data: { user: localUser, session: { user: localUser } }, error: null }
  }

  const signUp = async (email, password) => {
    if (!supabase) return localSignIn(email)
    return supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
  }

  const signIn = async (email, password) => {
    if (!supabase) return localSignIn(email)
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    if (!supabase) {
      localStorage.removeItem(LOCAL_USER_KEY)
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  // ── TOTP second factor ────────────────────────────────────────────────────

  // Start enrollment: returns { factorId, qrCode (svg data URL), secret }.
  const startTotpEnrollment = async () => {
    // Clear out half-finished enrollments (e.g. user closed the tab before verifying).
    const { data: factors } = await supabase.auth.mfa.listFactors()
    for (const f of factors?.all ?? []) {
      if (f.factor_type === 'totp' && f.status !== 'verified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' })
    if (error) throw error
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
  }

  // Verify a 6-digit code. Without factorId, uses the user's verified TOTP factor.
  const verifyTotp = async (code, factorId) => {
    if (!factorId) {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      factorId = data.totp[0]?.id
      if (!factorId) throw new Error('No authenticator app is set up for this account.')
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) throw error
    setMfa(await getMfaStatus())
  }

  return (
    <AuthContext.Provider value={{ user, mfa, loading, signIn, signUp, signOut, startTotpEnrollment, verifyTotp }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
