import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Smartphone, ArrowRight, Copy, Check } from 'lucide-react'

export default function MfaPage() {
  const { user, mfaStatus, loading: authLoading, refreshMfa, signOut } = useAuth()
  const navigate = useNavigate()

  const [factorId, setFactorId] = useState(null)
  const [qrCode, setQrCode]     = useState(null)   // only set during enrolment
  const [secret, setSecret]     = useState('')
  const [code, setCode]         = useState('')
  const [error, setError]       = useState('')
  const [preparing, setPreparing] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied]     = useState(false)
  const started = useRef(false)  // StrictMode runs effects twice; enrol only once

  const enrolling = mfaStatus === 'needs_enroll'

  useEffect(() => {
    if (!user || !mfaStatus || mfaStatus === 'verified' || started.current) return
    started.current = true

    const prepare = async () => {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors()
      if (listErr) { setError(listErr.message); setPreparing(false); return }

      if (enrolling) {
        // Clear half-finished enrolments (e.g. user closed the tab before verifying)
        const stale = factors.all.filter(f => f.factor_type === 'totp' && f.status === 'unverified')
        for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id })

        const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'Comply.AI',
        })
        if (enrollErr) { setError(enrollErr.message); setPreparing(false); return }
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      } else {
        setFactorId(factors.totp[0]?.id ?? null)
      }
      setPreparing(false)
    }
    prepare()
  }, [user, mfaStatus])

  if (authLoading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (mfaStatus === 'verified') return <Navigate to="/" replace />

  const handleVerify = async (ev) => {
    ev.preventDefault()
    if (!factorId || code.length !== 6) return
    setError('')
    setVerifying(true)
    const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (verifyErr) {
      setVerifying(false)
      setCode('')
      setError(verifyErr.message.toLowerCase().includes('invalid')
        ? 'That code is incorrect or expired. Check your app and try again.'
        : verifyErr.message)
      return
    }
    await refreshMfa()
    navigate('/', { replace: true })
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSignOut = async () => { await signOut(); navigate('/auth', { replace: true }) }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12 font-body">
      <div className="w-full max-w-md animate-fade-in">

        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck size={20} className="text-navy" />
          <span className="text-navy font-display text-lg">Comply.AI</span>
        </div>

        <div className="mb-6">
          <h2 className="font-display text-3xl text-text">
            {enrolling ? 'Set up two-step verification' : 'Enter verification code'}
          </h2>
          <p className="text-sm text-subtext mt-2 leading-relaxed">
            {enrolling
              ? 'Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy), then enter the 6-digit code it shows.'
              : <>Open your authenticator app and enter the 6-digit code for <strong className="text-text">{user.email}</strong>.</>}
          </p>
        </div>

        {preparing ? (
          <div className="flex items-center gap-3 py-10 justify-center">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-subtext">Preparing…</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} noValidate className="space-y-5">

            {enrolling && qrCode && (
              <div className="rounded-xl border border-border bg-white p-5 space-y-4">
                <img src={qrCode} alt="Authenticator QR code" className="w-44 h-44 mx-auto" />
                <div>
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Can't scan? Enter this key manually
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-text bg-bg border border-border rounded-md px-3 py-2 break-all">
                      {secret}
                    </code>
                    <button type="button" onClick={copySecret}
                      className="p-2 rounded-md border border-border text-subtext hover:text-navy transition-colors"
                      title="Copy key">
                      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="otp" className="flex items-center gap-1.5 text-xs font-semibold text-text tracking-wide">
                <Smartphone size={13} /> 6-digit code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className={`w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-[0.5em] font-mono text-text bg-white
                  placeholder:text-muted/50 transition-all duration-150 outline-none
                  focus:ring-2 focus:ring-navy/20 focus:border-navy
                  ${error ? 'border-danger bg-red-50' : 'border-border'}`}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="w-4 h-4 rounded-full bg-danger text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</div>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || code.length !== 6 || !factorId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-navy text-white
                rounded-lg text-sm font-semibold tracking-wide transition-all duration-150
                hover:bg-navylight active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                shadow-md hover:shadow-elevated"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  {enrolling ? 'Verify & Enable' : 'Verify & Continue'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-subtext mt-6">
          Not you?{' '}
          <button onClick={handleSignOut} className="text-accent font-semibold hover:underline">
            Sign out
          </button>
        </p>
      </div>
    </div>
  )
}
