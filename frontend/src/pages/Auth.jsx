import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, CheckCircle, Shield, FileText, Calendar } from 'lucide-react'

const FEATURES = [
  { icon: FileText, text: 'Computed compliance calendar from RBI Master Directions' },
  { icon: Calendar, text: 'Deadline tracking for 19 return types across all NBFC categories' },
  { icon: Shield,   text: 'Portal-level resolution — CIMS, COSMOS, FIU-IND, CKYC' },
]

const TESTIMONIAL = {
  quote: "A compliance calendar that computes every deadline from RBI's own rules — this is exactly what the industry needed.",
  name: 'Compliance Officer',
  org: 'Upper Layer NBFC — Mumbai',
}

function Field({ label, id, type = 'text', value, onChange, placeholder, error, suffix }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-text tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={id}
          className={`w-full px-4 py-3 rounded-lg border text-sm font-body text-text bg-white
            placeholder:text-muted transition-all duration-150 outline-none
            focus:ring-2 focus:ring-navy/20 focus:border-navy
            ${error ? 'border-danger bg-red-50' : 'border-border'}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-danger font-medium">{error}</p>}
    </div>
  )
}

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('login')   // 'login' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [serverError, setServerError] = useState('')

  // Already logged in → go to dashboard
  if (user) return <Navigate to="/" replace />

  const validate = () => {
    const e = {}
    if (!email.includes('@')) e.email = 'Enter a valid email address'
    if (password.length < 6) e.password = 'Password must be at least 6 characters'
    if (mode === 'signup' && password !== confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setServerError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    let result

    if (mode === 'login') {
      result = await signIn(email, password)
    } else {
      result = await signUp(email, password)
    }

    setLoading(false)

    if (result.error) {
      setServerError(result.error.message)
      return
    }

    if (mode === 'signup') {
      // Supabase sends confirmation email
      setSuccess(true)
    } else {
      navigate('/')
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setErrors({})
    setServerError('')
    setSuccess(false)
  }

  return (
    <div className="min-h-screen bg-bg flex font-body">

      {/* ── Left panel — branding ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] bg-navy flex-col justify-between p-12 relative overflow-hidden">

        {/* Subtle background grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

        {/* Top — logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-white font-display text-xl tracking-tight">Comply.AI</span>
          </div>
        </div>

        {/* Middle — headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
              NBFC Compliance Intelligence
            </p>
            <h1 className="font-display text-4xl xl:text-5xl text-white leading-tight">
              Every RBI deadline.<br />
              Computed.<br />
              <span className="text-white/40">Not guessed.</span>
            </h1>
            <p className="text-white/60 text-sm mt-5 max-w-sm leading-relaxed">
              A rule-driven compliance calendar built from RBI Master Directions.
              Know exactly what to file, to whom, and when — for every registered NBFC.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-white/70" />
                </div>
                <span className="text-white/70 text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          {/* Testimonial */}
          <div className="border-l-2 border-white/20 pl-4">
            <p className="text-white/60 text-sm italic leading-relaxed">
              "{TESTIMONIAL.quote}"
            </p>
            <p className="text-white/40 text-xs mt-2 font-semibold">
              — {TESTIMONIAL.name}, {TESTIMONIAL.org}
            </p>
          </div>
        </div>

        {/* Bottom — stat row */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['9,000+', 'NBFCs Indexed'], ['19', 'Return Types'], ['6', 'RBI Portals']].map(([val, lbl]) => (
            <div key={lbl} className="text-center">
              <p className="font-display text-2xl text-white">{val}</p>
              <p className="text-white/40 text-[11px] mt-0.5 font-semibold uppercase tracking-wide">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield size={20} className="text-navy" />
            <span className="text-navy font-display text-lg">Comply.AI</span>
          </div>

          {/* Success state (after signup) */}
          {success ? (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle size={32} className="text-success" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-text">Check your inbox</h2>
                <p className="text-sm text-subtext mt-2 leading-relaxed">
                  We've sent a confirmation link to <strong className="text-text">{email}</strong>.
                  Click it to activate your account.
                </p>
              </div>
              <button onClick={switchMode}
                className="text-sm text-accent hover:underline font-medium">
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="mb-8">
                <h2 className="font-display text-3xl text-text">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-sm text-subtext mt-2">
                  {mode === 'login'
                    ? 'Sign in to your Comply.AI workspace'
                    : 'Start monitoring your NBFC compliance obligations'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                <Field
                  label="Work Email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@nbfc.com"
                  error={errors.email}
                />

                <Field
                  label="Password"
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                  error={errors.password}
                  suffix={
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="text-muted hover:text-subtext transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                {mode === 'signup' && (
                  <Field
                    label="Confirm Password"
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    error={errors.confirm}
                  />
                )}

                {/* Server error */}
                {serverError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="w-4 h-4 rounded-full bg-danger text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</div>
                    <p className="text-xs text-red-700 leading-relaxed">{serverError}</p>
                  </div>
                )}

                {/* Forgot password */}
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" className="text-xs text-accent hover:underline">
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-navy text-white
                    rounded-lg text-sm font-semibold tracking-wide transition-all duration-150
                    hover:bg-navylight active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                    shadow-md hover:shadow-elevated mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Mode switch */}
              <p className="text-center text-sm text-subtext">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={switchMode}
                  className="text-accent font-semibold hover:underline transition-colors">
                  {mode === 'login' ? 'Sign Up Free' : 'Sign In'}
                </button>
              </p>

              {/* Legal */}
              {mode === 'signup' && (
                <p className="text-center text-[11px] text-muted mt-4 leading-relaxed">
                  By creating an account you agree to our{' '}
                  <span className="text-accent cursor-pointer hover:underline">Terms of Service</span>{' '}
                  and{' '}
                  <span className="text-accent cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
