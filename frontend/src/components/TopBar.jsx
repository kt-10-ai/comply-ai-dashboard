import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'

const PAGE_TITLES = {
  '/':         { title: 'Compliance Overview', sub: 'Centralized NBFC Regulatory Dashboard' },
  '/calendar': { title: 'Compliance Calendar', sub: 'Filing deadlines by date and frequency' },
  '/search':   { title: 'NBFC Registry',       sub: 'All registered NBFCs under RBI SBR framework' },
  '/matrix':   { title: 'Regulatory Obligation Matrix', sub: 'Post November 2025 — RBI Master Directions' },
}

const TopBar = () => {
  const { pathname } = useLocation()
  const matched = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k) && (k === '/' ? pathname === '/' : true))
  const page = matched ? matched[1] : { title: 'NBFC Profile', sub: 'Compliance obligations detail' }

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-6 fixed top-0 left-56 right-0 z-20 shadow-card">
      <div className="flex-1">
        <h2 className="text-base font-semibold text-text leading-tight">{page.title}</h2>
        <p className="text-xs text-subtext">{page.sub}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-subtext font-medium">
          {format(new Date(), 'MMMM d, yyyy')}
        </div>
        <button className="relative p-1.5 text-subtext hover:text-text hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger"></span>
        </button>
        <button className="p-1.5 text-subtext hover:text-text hover:bg-slate-100 rounded-md transition-colors">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  )
}

export default TopBar
