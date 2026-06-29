import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  format, addMonths, subMonths, isSameMonth, isSameDay,
  parseISO, getDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, ExternalLink, CalendarDays, X, Search } from 'lucide-react'

const FREQ_STYLES = {
  Monthly:       { bg: '#DBEAFE', color: '#1E40AF', dot: '#2563EB' },
  Quarterly:     { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
  Annual:        { bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  'Event-based': { bg: '#EDE9FE', color: '#6D28D9', dot: '#7C3AED' },
}

const STATUS_DOT = {
  OVERDUE:  '#DC2626',
  'DUE SOON': '#EA580C',
  UPCOMING: '#2563EB',
}

export default function CalendarPage() {
  const [allRules, setAllRules] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [freqFilter, setFreqFilter] = useState('All')
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedNbfc, setSelectedNbfc] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const delay = setTimeout(() => {
      api.get(`/nbfc/search?name=${encodeURIComponent(searchQuery)}`)
        .then(r => setSearchResults(r.data))
    }, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  useEffect(() => {
    setLoading(true)
    if (selectedNbfc) {
      api.get(`/nbfc/${selectedNbfc.cin}`)
        .then(r => { setAllRules(r.data.compliance_calendar || []); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      api.get('/compliance/calendar')
        .then(r => { setAllRules(r.data || []); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [selectedNbfc])

  // Filter by frequency selection
  const filtered = freqFilter === 'All'
    ? allRules
    : allRules.filter(r => r.frequency === freqFilter)

  // Generate calendar events by projecting rules across all months
  // We compute ALL possible due dates in the viewed month
  function computeEventsForMonth(rules, monthDate) {
    const year  = monthDate.getFullYear()
    const month = monthDate.getMonth() // 0-indexed

    const events = []
    rules.forEach(rule => {
      const { frequency, offset_days: days = 0, status } = rule
      const candidates = []

      if (frequency === 'Monthly') {
        // Due date for the previous month's period, landing in this month
        const prevMonthEnd = new Date(year, month, 0)  // last day of prev month
        candidates.push({ date: new Date(prevMonthEnd.getTime() + days * 86400000), label: format(prevMonthEnd, 'MMM yyyy') })
        // Due date for the current month's period, might also land here
        const currMonthEnd = new Date(year, month + 1, 0)
        candidates.push({ date: new Date(currMonthEnd.getTime() + days * 86400000), label: format(currMonthEnd, 'MMM yyyy') })
      } else if (frequency === 'Quarterly') {
        // Quarter ends: Mar31, Jun30, Sep30, Dec31 (Indian FY)
        const quarterEnds = [
          new Date(year - 1, 11, 31), new Date(year, 2, 31),
          new Date(year, 5, 30),  new Date(year, 8, 30),
          new Date(year, 11, 31),
        ]
        quarterEnds.forEach(qe => {
          const due = new Date(qe.getTime() + days * 86400000)
          const qLabel = (() => {
            const m = qe.getMonth()
            const y = qe.getFullYear()
            if (m === 2)  return `Q4 FY${y-1}-${String(y).slice(2)}`
            if (m === 5)  return `Q1 FY${y}-${String(y+1).slice(2)}`
            if (m === 8)  return `Q2 FY${y}-${String(y+1).slice(2)}`
            if (m === 11) return `Q3 FY${y}-${String(y+1).slice(2)}`
            return ''
          })()
          candidates.push({ date: due, label: qLabel })
        })
      } else if (frequency === 'Annual') {
        // FY ends March 31
        ;[year - 1, year, year + 1].forEach(y => {
          const fyEnd = new Date(y, 2, 31)
          candidates.push({ date: new Date(fyEnd.getTime() + days * 86400000), label: `FY${y-1}-${String(y).slice(2)}` })
        })
      } else if (frequency === 'Event-based') {
        // Show on day 7 of each month as a standing reminder
        candidates.push({ date: new Date(year, month, 7), label: 'On occurrence' })
      }

      candidates.forEach(({ date, label }) => {
        if (isSameMonth(date, monthDate)) {
          events.push({ ...rule, dueDate: date, periodLabel: label })
        }
      })
    })

    return events.sort((a, b) => a.dueDate - b.dueDate)
  }

  const events    = computeEventsForMonth(filtered, currentMonth)
  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad  = getDay(startOfMonth(currentMonth))
  const paddedDays = [...Array(startPad).fill(null), ...monthDays]

  const eventsForDay = (day) => events.filter(e => isSameDay(e.dueDate, day))
  const sidebarEvents = events.slice(0, 12)

  const overdueCnt  = allRules.filter(r => r.status === 'OVERDUE').length
  const dueSoonCnt  = allRules.filter(r => r.status === 'DUE SOON').length
  const upcomingCnt = allRules.filter(r => r.status === 'UPCOMING').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex gap-6 animate-fade-in">

      {/* Calendar main */}
      <div className="flex-1 min-w-0">

        {/* Status summary bar */}
        <div className="card p-3 mb-4 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-subtext">Overdue:</span>
            <span className="font-bold text-red-700">{overdueCnt} returns</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-subtext">Due Soon:</span>
            <span className="font-bold text-orange-700">{dueSoonCnt} returns</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-subtext">Upcoming:</span>
            <span className="font-bold text-blue-700">{upcomingCnt} returns</span>
          </div>
          <div className="ml-auto relative flex items-center gap-3">
            {selectedNbfc ? (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-border">
                <span className="text-xs font-semibold text-text truncate max-w-[150px]">{selectedNbfc.nbfc_name}</span>
                <button onClick={() => setSelectedNbfc(null)} className="text-subtext hover:text-danger"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search NBFC..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  className="w-48 px-3 py-1.5 text-xs bg-white border border-border rounded-lg outline-none focus:ring-1 focus:ring-accent placeholder:text-subtext"
                />
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-border shadow-elevated rounded-lg z-30 max-h-60 overflow-y-auto"
                    onMouseLeave={() => setShowSearch(false)}>
                    {searchResults.map(nbfc => (
                      <div key={nbfc.cin} 
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-border last:border-0"
                        onClick={() => { setSelectedNbfc(nbfc); setShowSearch(false); setSearchQuery(''); }}>
                        <p className="text-xs font-semibold text-text truncate">{nbfc.nbfc_name}</p>
                        <p className="text-[10px] text-subtext truncate">{nbfc.classification} · {nbfc.layer} Layer</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] text-subtext italic hidden md:block">
              Status computed from RBI Master Directions
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, freqFilter === 'Annual' ? 12 : (freqFilter === 'Monthly' || freqFilter === 'Quarterly' || freqFilter === 'Event-based') ? 12 : 1))}
              className="p-1.5 rounded-md hover:bg-slate-100 text-subtext hover:text-text transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-base font-semibold text-text w-48 text-center">
              {freqFilter === 'Annual' ? `${currentMonth.getFullYear() - 1} – ${currentMonth.getFullYear() + 1}` :
               (freqFilter === 'Monthly' || freqFilter === 'Quarterly' || freqFilter === 'Event-based') ? currentMonth.getFullYear() :
               format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, freqFilter === 'Annual' ? 12 : (freqFilter === 'Monthly' || freqFilter === 'Quarterly' || freqFilter === 'Event-based') ? 12 : 1))}
              className="p-1.5 rounded-md hover:bg-slate-100 text-subtext hover:text-text transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); setFreqFilter('All'); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 text-subtext hover:bg-slate-200 transition-all mr-1">
              Today
            </button>
            {['All', 'Monthly', 'Quarterly', 'Annual', 'Event-based'].map(f => (
              <button key={f} onClick={() => setFreqFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  freqFilter === f ? 'bg-navy text-white' : 'bg-slate-100 text-subtext hover:bg-slate-200'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="card overflow-hidden">
          {freqFilter === 'Monthly' ? (
            <div className="grid grid-cols-4 gap-px bg-border/40 border-b border-border">
              {Array.from({length: 12}).map((_, i) => {
                const mDate = new Date(currentMonth.getFullYear(), i, 1)
                const mEvents = computeEventsForMonth(filtered, mDate)
                const isCurrent = isSameMonth(mDate, new Date())
                return (
                  <div key={i} className={`min-h-[140px] bg-white p-3 hover:bg-slate-50 cursor-pointer transition-colors ${isCurrent ? 'ring-1 ring-inset ring-accent bg-blue-50/20' : ''}`}
                    onClick={() => { setFreqFilter('All'); setCurrentMonth(mDate) }}>
                    <div className={`text-sm font-bold mb-3 ${isCurrent ? 'text-accent' : 'text-text'}`}>
                      {format(mDate, 'MMMM')}
                    </div>
                    <div className="space-y-1.5">
                      {mEvents.slice(0, 4).map((e, j) => (
                        <div key={j} className="text-[10px] truncate px-1.5 py-0.5 rounded font-medium border border-black/5" style={{ background: FREQ_STYLES[e.frequency]?.bg, color: FREQ_STYLES[e.frequency]?.color }}>
                          {e.return_name}
                        </div>
                      ))}
                      {mEvents.length > 4 && <div className="text-[10px] font-semibold text-subtext pl-1">+{mEvents.length - 4} more</div>}
                      {mEvents.length === 0 && <div className="text-[10px] text-muted italic pl-1">No returns</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : freqFilter === 'Quarterly' ? (
            <div className="grid grid-cols-6 gap-px bg-border/40 border-b border-border">
              {Array.from({length: 12}).map((_, i) => {
                const mDate = new Date(currentMonth.getFullYear(), i, 1)
                const mEvents = computeEventsForMonth(filtered, mDate)
                const isCurrent = isSameMonth(mDate, new Date())
                const isQuarterEnd = [2, 5, 8, 11].includes(i)
                return (
                  <div key={i} className={`min-h-[160px] bg-white p-2 hover:bg-slate-50 cursor-pointer transition-colors ${isCurrent ? 'ring-1 ring-inset ring-accent bg-blue-50/20' : ''} ${isQuarterEnd ? 'bg-orange-50/10' : ''}`}
                    onClick={() => { setFreqFilter('All'); setCurrentMonth(mDate) }}>
                    <div className={`text-xs font-bold mb-3 flex items-center justify-between ${isCurrent ? 'text-accent' : 'text-text'}`}>
                      <span>{format(mDate, 'MMM')}</span>
                      {isQuarterEnd && <span className="text-[9px] px-1 py-0.5 bg-amber text-white rounded font-bold uppercase tracking-wider">QE</span>}
                    </div>
                    <div className="space-y-1">
                      {mEvents.slice(0, 5).map((e, j) => (
                        <div key={j} title={e.return_name} className="text-[9px] truncate px-1.5 py-0.5 rounded font-bold border border-black/5" style={{ background: FREQ_STYLES[e.frequency]?.bg, color: FREQ_STYLES[e.frequency]?.color }}>
                          {e.id}
                        </div>
                      ))}
                      {mEvents.length > 5 && <div className="text-[9px] font-semibold text-subtext pl-1 pt-0.5">+{mEvents.length - 5} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : freqFilter === 'Annual' ? (
            <div className="grid grid-cols-3 gap-px bg-border/40 border-b border-border">
              {[-1, 0, 1].map(offset => {
                const year = currentMonth.getFullYear() + offset
                const yearEvents = Array.from({length: 12}).flatMap((_, i) => computeEventsForMonth(filtered, new Date(year, i, 1)))
                return (
                  <div key={year} className="min-h-[400px] bg-white p-5">
                    <h3 className={`text-lg font-bold mb-4 ${offset === 0 ? 'text-accent' : 'text-text'}`}>{year}</h3>
                    <div className="space-y-3">
                      {yearEvents.length === 0 && <p className="text-xs text-subtext italic">No annual returns found.</p>}
                      {yearEvents.map((e, j) => (
                        <div key={j} className="text-xs p-3 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col gap-1.5 cursor-pointer" onClick={() => { setFreqFilter('All'); setCurrentMonth(e.dueDate); setSelectedDay(e.dueDate) }}>
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-bold text-accent">{e.id}</span>
                            <span className="text-[10px] font-bold text-subtext bg-white px-1.5 py-0.5 rounded border border-border">{format(e.dueDate, 'MMM d')}</span>
                          </div>
                          <span className="font-medium text-text leading-snug">{e.return_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : freqFilter === 'Event-based' ? (
            <div className="p-5 bg-white space-y-3 border-b border-border">
              {filtered.map(r => (
                 <div key={r.id} className="p-4 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                   <div className="flex-1">
                     <span className="font-mono text-xs font-bold text-accent mb-1 inline-block bg-blue-50 px-2 py-0.5 rounded">{r.id}</span>
                     <h4 className="text-sm font-bold text-text">{r.return_name}</h4>
                     <p className="text-xs text-subtext mt-1">Reports to: {r.reports_to}</p>
                   </div>
                   <div className="text-sm font-semibold text-navy bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                     Within {r.due_days_after_period_end} days of event
                   </div>
                 </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-subtext text-center py-8">No event-based rules found.</p>}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border bg-navy/5">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-navy">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="grid grid-cols-7">
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="min-h-[96px] border-r border-b border-border/40 bg-slate-50/60" />

                  const dayEvents   = eventsForDay(day)
                  const isToday     = isSameDay(day, new Date())
                  const isSelected  = selectedDay && isSameDay(day, selectedDay)
                  const hasOverdue  = dayEvents.some(e => e.status === 'OVERDUE')
                  const hasDueSoon  = dayEvents.some(e => e.status === 'DUE SOON')

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`min-h-[96px] border-r border-b border-border/40 p-2 cursor-pointer transition-all
                        ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-accent' :
                          hasOverdue ? 'bg-red-50/40 hover:bg-red-50/60' :
                          hasDueSoon ? 'bg-orange-50/30 hover:bg-orange-50/50' :
                          'hover:bg-slate-50'}
                        ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}`}
                    >
                      <div className={`text-xs font-bold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-accent text-white' : hasOverdue ? 'text-red-700' : 'text-text'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((e, j) => {
                          const s  = FREQ_STYLES[e.frequency] || FREQ_STYLES.Monthly
                          const sd = STATUS_DOT[e.status] || s.dot
                          return (
                            <div key={j} className="flex items-center gap-1 rounded px-1.5 py-0.5"
                              style={{ background: s.bg }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sd }} />
                              <span className="font-mono text-[10px] font-bold truncate" style={{ color: s.color }}>
                                {e.id}
                              </span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-subtext font-medium pl-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Selected day panel */}
        {selectedDay && eventsForDay(selectedDay).length > 0 && (
          <div className="card p-5 mt-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={16} className="text-accent" />
              <h4 className="text-sm font-semibold text-text">
                {eventsForDay(selectedDay).length} return{eventsForDay(selectedDay).length > 1 ? 's' : ''} due {format(selectedDay, 'MMMM d, yyyy')}
              </h4>
            </div>
            <div className="space-y-3">
              {eventsForDay(selectedDay).map((e, i) => {
                const s  = FREQ_STYLES[e.frequency] || FREQ_STYLES.Monthly
                const sd = STATUS_DOT[e.status] || s.dot
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white">
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: sd }} />
                    <div className="flex-1 min-w-0 grid grid-cols-4 gap-3 items-center">
                      <div className="col-span-1">
                        <span className="font-mono text-xs font-bold text-accent block">{e.id}</span>
                        <span className="text-xs text-text font-medium leading-snug">{e.return_name}</span>
                      </div>
                      <div className="col-span-1 text-xs">
                        <p className="text-[10px] text-subtext uppercase tracking-wide mb-0.5">Reports To</p>
                        <p className="font-semibold text-navy text-[11px]">{e.reports_to}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: s.bg, color: s.color }}>
                          {e.frequency}
                        </span>
                        <p className="text-[10px] text-subtext mt-1">{e.period_label || e.periodLabel}</p>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <a href={e.portal_url} target="_blank" rel="noreferrer"
                          className="text-accent text-xs hover:underline flex items-center gap-1">
                          {e.submission_portal?.split(' ').slice(0,2).join(' ')} <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-60 shrink-0 space-y-4">
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-text mb-1">
            {freqFilter === 'Annual' || freqFilter === 'Monthly' || freqFilter === 'Quarterly' || freqFilter === 'Event-based' 
              ? `${currentMonth.getFullYear()} Deadlines` 
              : `${format(currentMonth, 'MMMM')} Deadlines`}
          </h4>
          <p className="text-[10px] text-subtext mb-3 uppercase tracking-wider font-semibold">
            {selectedNbfc ? `For: ${selectedNbfc.nbfc_name}` : 'Global Master Calendar (All NBFCs)'}
          </p>
          {sidebarEvents.length === 0 ? (
            <p className="text-xs text-subtext">No deadlines this month for selected filter.</p>
          ) : (
            <div className="space-y-3">
              {sidebarEvents.map((e, i) => {
                const s = FREQ_STYLES[e.frequency] || FREQ_STYLES.Monthly
                return (
                  <div key={i} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: STATUS_DOT[e.status] || s.dot }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-accent">{e.id}</span>
                          <span className="font-mono text-[10px] text-subtext">{format(e.dueDate, 'd MMM')}</span>
                        </div>
                        <p className="text-[11px] font-medium text-text leading-snug truncate">{e.return_name}</p>
                        <p className="text-[10px] text-subtext mt-0.5 truncate">{e.reports_to || e.submission_portal}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="card p-4">
          <h4 className="text-xs font-semibold text-subtext uppercase tracking-wider mb-3">Legend</h4>
          {Object.entries(FREQ_STYLES).map(([freq, s]) => (
            <div key={freq} className="flex items-center gap-2 py-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
              <span className="text-xs text-text">{freq}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            {[['OVERDUE','#DC2626'],['DUE SOON','#EA580C'],['UPCOMING','#2563EB']].map(([s, c]) => (
              <div key={s} className="flex items-center gap-2 py-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[11px] text-subtext">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
