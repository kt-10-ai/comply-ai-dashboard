import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Database,
  BookOpen,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'

const NAV = [
  { label: 'Overview',           path: '/',        icon: LayoutDashboard },
  { label: 'Compliance Calendar',path: '/calendar', icon: Calendar },
  { label: 'NBFC Registry',      path: '/search',  icon: Database },
  { label: 'Compliance Matrix',  path: '/matrix',  icon: BookOpen },
]

const Sidebar = () => (
  <aside className="w-56 min-h-screen bg-navy flex flex-col fixed left-0 top-0 z-30 shadow-elevated">
    {/* Logo */}
    <div className="px-5 py-5 border-b border-white/10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-white text-base leading-tight">Comply.AI</h1>
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-wide">RBI Portal</p>
        </div>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 px-3 py-5 space-y-1">
      <p className="px-3 mb-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Navigation</p>
      {NAV.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            isActive ? 'nav-link-active' : 'nav-link'
          }
        >
          <Icon size={16} />
          <span className="flex-1">{label}</span>
          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" />
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div className="px-5 py-4 border-t border-white/10 space-y-1.5">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Regulatory Framework</p>
      <p className="text-[11px] text-white/60 leading-relaxed">
        RBI Master Directions<br />
        <span className="text-white/40">Post-November 2025</span>
      </p>
    </div>
  </aside>
)

export default Sidebar
