import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES = {
  '/':         { title: 'Compliance Overview',          sub: 'Centralized NBFC Regulatory Dashboard' },
  '/calendar': { title: 'Compliance Calendar',          sub: 'Filing deadlines by date and frequency' },
  '/search':   { title: 'NBFC Registry',                sub: 'All registered NBFCs under RBI SBR framework' },
  '/matrix':   { title: 'Regulatory Obligation Matrix', sub: 'Post November 2025 — RBI Master Directions' },
}

export default function TopBar() {
  const { pathname }           = useLocation()
  const { user, signOut }      = useAuth()
  const navigate               = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef                = useRef(null)

  const matched = Object.entries(PAGE_TITLES).find(
    ([k]) => pathname.startsWith(k) && (k === '/' ? pathname === '/' : true)
  )
  const page = matched ? matched[1] : { title: 'NBFC Profile', sub: 'Compliance obligations detail' }

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  // Derive initials + email label
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

        {/* Bell */}
        <button className="relative p-1.5 text-subtext hover:text-text hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger" />
        </button>

        {/* User menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <span className="text-xs font-medium text-text max-w-[140px] truncate hidden md:block">
                {email}
              </span>
              <ChevronDown size={13} className={`text-subtext transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-border rounded-xl shadow-elevated animate-fade-in z-30 overflow-hidden">
                {/* User info */}
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

                {/* Menu items */}
                <div className="py-1.5">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-subtext hover:bg-slate-50 hover:text-text transition-colors"
                    onClick={() => { setMenuOpen(false) }}
                  >
                    <User size={13} />
                    My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-danger hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={13} />
                    Sign Out
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
