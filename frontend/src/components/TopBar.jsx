import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Bell, LogOut, User, ChevronDown, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const PAGE_TITLES = {
  '/':         { title: 'Compliance Overview',          sub: 'Centralized NBFC Regulatory Dashboard' },
  '/calendar': { title: 'Compliance Calendar',          sub: 'Filing deadlines by date and frequency' },
  '/search':   { title: 'NBFC Registry',                sub: 'All registered NBFCs under RBI SBR framework' },
  '/matrix':   { title: 'Regulatory Obligation Matrix', sub: 'Post November 2025 — RBI Master Directions' },
}

// ── Notification Panel ────────────────────────────────────────────────────────

function NotificationPanel({ onClose }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/compliance/calendar')
      .then(r => {
        // Show OVERDUE first, then DUE SOON — max 12
        const urgent = r.data
          .filter(x => x.status === 'OVERDUE' || x.status === 'DUE SOON')
          .sort((a, b) => {
            if (a.status !== b.status) return a.status === 'OVERDUE' ? -1 : 1
            return (a.due_date || '').localeCompare(b.due_date || '')
          })
          .slice(0, 12)
        setItems(urgent)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const overdue = items.filter(x => x.status === 'OVERDUE').length
  const dueSoon = items.filter(x => x.status === 'DUE SOON').length

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-border rounded-xl shadow-elevated z-30 overflow-hidden animate-fade-in">

      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-slate-50">
        <div>
          <p className="text-sm font-semibold text-text">Compliance Alerts</p>
          <p className="text-[11px] text-subtext mt-0.5">
            {loading ? 'Loading…' : `${overdue} overdue · ${dueSoon} due soon`}
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-muted hover:text-text rounded transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <CheckCircle size={20} className="text-success" />
            <p className="text-xs text-subtext">All returns on track</p>
          </div>
        ) : (
          items.map((item, i) => {
            const isOverdue = item.status === 'OVERDUE'
            return (
              <div key={`${item.id}-${i}`}
                className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer`}
                onClick={() => { onClose(); navigate('/matrix') }}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded-md shrink-0 ${isOverdue ? 'bg-red-100' : 'bg-orange-100'}`}>
                    {isOverdue
                      ? <AlertTriangle size={12} className="text-danger" />
                      : <Clock size={12} className="text-amber" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-text truncate">{item.return_name}</p>
                      <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-full
                        ${isOverdue ? 'bg-red-100 text-danger' : 'bg-orange-100 text-amber'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-subtext mt-0.5">
                      <span className="font-mono font-bold text-accent">{item.id}</span>
                      {' · '}{item.period_label}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[11px] text-subtext">
                        Due: <span className={`font-semibold ${isOverdue ? 'text-danger' : 'text-amber'}`}>
                          {item.due_date ? format(parseISO(item.due_date), 'd MMM yyyy') : '—'}
                        </span>
                      </p>
                      {isOverdue && item.days_delta !== null && (
                        <p className="text-[11px] text-danger font-medium">
                          {Math.abs(item.days_delta)}d overdue
                        </p>
                      )}
                      {!isOverdue && item.days_delta !== null && (
                        <p className="text-[11px] text-amber font-medium">
                          {item.days_delta}d left
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {!loading && items.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-slate-50">
          <Link to="/calendar" onClick={onClose}
            className="text-xs text-accent font-semibold hover:underline">
            View full compliance calendar →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── TopBar ─────────────────────────────────────────────────────────────────────

export default function TopBar() {
  const { pathname }              = useLocation()
  const { user, signOut }         = useAuth()
  const navigate                  = useNavigate()
  const [userMenu, setUserMenu]   = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const userRef  = useRef(null)
  const notifRef = useRef(null)

  const matched = Object.entries(PAGE_TITLES).find(
    ([k]) => pathname.startsWith(k) && (k === '/' ? pathname === '/' : true)
  )
  const page = matched ? matched[1] : { title: 'NBFC Profile', sub: 'Compliance obligations detail' }

  // Fetch alert count on mount
  useEffect(() => {
    api.get('/compliance/calendar').then(r => {
      const urgent = r.data.filter(x => x.status === 'OVERDUE' || x.status === 'DUE SOON').length
      setAlertCount(urgent)
    }).catch(() => {})
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userRef.current  && !userRef.current.contains(e.target))  setUserMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => { await signOut(); navigate('/auth') }
  const email    = user?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-6 fixed top-0 left-56 right-0 z-20 shadow-card">
      {/* Page title */}
      <div className="flex-1">
        <h2 className="text-base font-semibold text-text leading-tight">{page.title}</h2>
        <p className="text-xs text-subtext">{page.sub}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date */}
        <div className="text-xs text-subtext font-medium hidden md:block">
          {format(new Date(), 'MMMM d, yyyy')}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className={`relative p-1.5 rounded-md transition-colors
              ${notifOpen ? 'text-navy bg-blue-50' : 'text-subtext hover:text-text hover:bg-slate-100'}`}
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center
                text-[9px] font-bold bg-danger text-white rounded-full px-0.5 leading-none">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenu(o => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <span className="text-xs font-medium text-text max-w-[140px] truncate hidden md:block">
                {email}
              </span>
              <ChevronDown size={13} className={`text-subtext transition-transform duration-150 ${userMenu ? 'rotate-180' : ''}`} />
            </button>

            {userMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-border rounded-xl shadow-elevated animate-fade-in z-30 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{email}</p>
                      <p className="text-[10px] text-subtext mt-0.5">Compliance Officer</p>
                    </div>
                  </div>
                </div>
                <div className="py-1.5">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-subtext hover:bg-slate-50 hover:text-text transition-colors"
                    onClick={() => setUserMenu(false)}
                  >
                    <User size={13} /> My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-danger hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
