import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, Smartphone, ArrowRight, LogOut, Copy, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Second step after password login: enroll (first time) or verify a TOTP authenticator code.
export default function MfaPage() {
  const { user, mfa, loading, signOut, startTotpEnrollment, verifyTotp } = useAuth()
  const navigate = useNavigate()

  const [enrollment, setEnrollment] = useState(null) // { factorId, qrCode, secret }
  const [code, setCode]             = useState('')
  const [error, setError]           = useState('')
  const [busy, setBusy]             = useState(false)
  const [copied, setCopied]         = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (mfa !== 'enroll' || started.current) return
    started.current = true
    startTotpEnrollment()
      .then(setEnrollment)
      .catch(e => setError(e.message || 'Could not start authenticator setup.'))
  }, [mfa, startTotpEnrollment])

  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (mfa === 'ok') return <Navigate to="/" replace />

  const isEnroll = mfa === 'enroll'

  const submit = async (ev) => {
    ev.preventDefault()
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code from your authenticator app.'); return }
    setBusy(true); setError('')
    try {
      await verifyTotp(code, enrollment?.factorId)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message?.includes('Invalid') ? 'That code is incorrect or expired. Try the latest one.' : (e.message || 'Verification failed.'))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText(enrollment.secret)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12 font-body">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl shadow-card p-8 animate-fade-in">

        <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center mb-5">
          {isEnroll ? <Smartphone size={22} className="text-navy" /> : <ShieldCheck size={22} className="text-navy" />}
        </div>

        <h2 className="font-display text-2xl text-text">
          {isEnroll ? 'Set up two-factor authentication' : 'Two-factor verification'}
        </h2>
        <p className="text-sm text-subtext mt-2 leading-relaxed">
          {isEnroll
            ? 'Comply.AI requires an authenticator app for every account. Scan this QR code with Google Authenticator, Microsoft Authenticator, Authy or 1Password, then enter the 6-digit code it shows.'
            : <>Enter the 6-digit code from your authenticator app for <strong className="text-text">{user.email}</strong>.</>}
        </p>

        {isEnroll && (
          <div className="mt-6 flex flex-col items-center gap-3">
            {enrollment ? (
              <>
                <img src={enrollment.qrCode} alt="Authenticator QR code" className="w-44 h-44 border border-border rounded-lg p-2 bg-white" />
                <div className="w-full">
                  <p className="text-[11px] text-muted mb-1">Can't scan? Enter this key manually:</p>
                  <button type="button" onClick={copySecret}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-bg font-mono text-xs text-text break-all text-left hover:border-navy/30">
                    <span>{enrollment.secret}</span>
                    {copied ? <Check size={14} className="text-success shrink-0" /> : <Copy size={14} className="text-muted shrink-0" />}
                  </button>
                </div>
              </>
            ) : !error && (
              <div className="w-44 h-44 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            aria-label="6-digit code"
            className="w-full px-4 py-3 rounded-lg border border-border text-center text-xl tracking-[0.5em] font-mono text-text
              outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy placeholder:text-muted placeholder:tracking-[0.5em]"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">{error}</div>
          )}

          <button type="submit" disabled={busy || (isEnroll && !enrollment)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-navy text-white rounded-lg text-sm font-semibold
              hover:bg-navylight disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition-all">
            {busy
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>{isEnroll ? 'Verify & enable' : 'Verify'} <ArrowRight size={15} /></>}
          </button>
        </form>

        <button type="button" onClick={async () => { await signOut(); navigate('/auth', { replace: true }) }}
          className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs text-subtext hover:text-text">
          <LogOut size={13} /> Sign out and use a different account
        </button>
      </div>
    </div>
  )
}
