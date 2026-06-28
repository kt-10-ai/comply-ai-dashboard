import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { ChevronDown, ChevronUp, ExternalLink, Download, Search } from 'lucide-react'

const FREQ_STYLES = {
  Monthly:     'freq-monthly',
  Quarterly:   'freq-quarterly',
  Annual:      'freq-annual',
  'Event-based': 'freq-event',
}

function exportCSV(rules) {
  const today = new Date().toISOString().slice(0, 10)

  const columns = [
    { key: 'id',                    label: 'Rule ID' },
    { key: 'return_name',           label: 'Return Name' },
    { key: 'frequency',             label: 'Frequency' },
    { key: 'rule_type',             label: 'Rule Type' },
    { key: 'offset_days',           label: 'Offset Days' },
    { key: 'due_basis',             label: 'Due Date Basis' },
    { key: 'applicable_classification', label: 'Applicable Classifications' },
    { key: 'applicable_layer',      label: 'Applicable Layers' },
    { key: 'recipient_type',        label: 'Recipient Type' },
    { key: 'submission_portal',     label: 'Submission Portal' },
    { key: 'portal_url',            label: 'Portal URL' },
    { key: 'legal_source',          label: 'Legal Source (RBI Direction)' },
    { key: 'clause',                label: 'Clause / Para' },
    { key: 'regulator',             label: 'Regulator' },
  ]

  const escape = (v) => {
    if (v === null || v === undefined) return '""'
    const str = Array.isArray(v) ? v.join('; ') : String(v)
    return `"${str.replace(/"/g, '""')}"`
  }

  const header  = columns.map(c => escape(c.label)).join(',')
  const rows    = rules.map(r => columns.map(c => escape(r[c.key])).join(','))
  const content = [
    `"Comply.AI — Regulatory Obligation Matrix"`,
    `"Exported: ${today} | Source: RBI Master Directions (Post Nov 2025) | Total Rules: ${rules.length}"`,
    '',
    header,
    ...rows
  ].join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `comply_ai_matrix_${today}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Matrix() {
  const [rules, setRules] = useState([])
  const [filtered, setFiltered] = useState([])
  const [freqFilter, setFreqFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/compliance/rules').then(r => {
      setRules(r.data); setFiltered(r.data); setLoading(false)
    })
  }, [])

  useEffect(() => {
    let out = rules
    if (freqFilter !== 'All') out = out.filter(r => r.frequency === freqFilter)
    if (query) {
      const q = query.toLowerCase()
      out = out.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.return_name.toLowerCase().includes(q) ||
        r.legal_source.toLowerCase().includes(q) ||
        r.applicable_classification.some(c => c.toLowerCase().includes(q))
      )
    }
    setFiltered(out)
  }, [freqFilter, query, rules])

  const toggle = (id) => setExpanded(e => e === id ? null : id)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header bar */}
      <div className="card p-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-text">Regulatory Obligation Matrix</h2>
          <p className="text-xs text-subtext mt-0.5">Post November 2025 — RBI Master Directions</p>
        </div>
        <button onClick={() => exportCSV(filtered)} className="btn-secondary flex items-center gap-2 text-xs">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {['All','Monthly','Quarterly','Annual'].map(f => (
          <button key={f} onClick={() => setFreqFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              freqFilter === f ? 'bg-navy text-white' : 'bg-white border border-border text-subtext hover:bg-slate-50'
            }`}>
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-2.5 text-muted" />
          <input type="text" placeholder="Search ID, return name…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-base !w-64 pl-8 py-2 text-xs" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-navy">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 w-28">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Return Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Applies To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Layer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 w-28">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 w-24">Due Days</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 w-32">Filed To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 w-24">Portal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Legal Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rule => (
                <React.Fragment key={rule.id}>
                  <tr onClick={() => toggle(rule.id)}
                    className={`cursor-pointer border-b border-border/60 transition-colors
                      ${expanded === rule.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3.5 text-center">
                      {expanded === rule.id
                        ? <ChevronUp size={14} className="text-accent mx-auto" />
                        : <ChevronDown size={14} className="text-muted mx-auto" />}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-accent">{rule.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-text">{rule.return_name}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {rule.applicable_classification.slice(0, 4).map(c => (
                          <span key={c} className="bg-navy/5 text-navy border border-navy/10 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                            {c}
                          </span>
                        ))}
                        {rule.applicable_classification.length > 4 && (
                          <span className="text-[10px] text-subtext font-medium">+{rule.applicable_classification.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {rule.applicable_layer.map(l => (
                          <span key={l} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold
                            ${l==='Base'?'badge-base':l==='Middle'?'badge-middle':l==='Upper'?'badge-upper':'badge-top'}`}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${FREQ_STYLES[rule.frequency] || 'freq-event'}`}>
                        {rule.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-text">{rule.due_days_after_period_end} days</td>
                    <td className="px-4 py-3.5">
                      {rule.recipient_type === 'RBI Regional Office' ? (
                        <span className="text-xs font-semibold text-navy">NBFC's Reg. Office</span>
                      ) : rule.recipient_type === 'External Regulator' ? (
                        <span className="text-xs font-semibold text-purple-700">{rule.regulator}</span>
                      ) : (
                        <span className="text-xs font-semibold text-accent">{rule.submission_portal}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <a href={rule.portal_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="text-accent text-xs hover:underline flex items-center gap-0.5">
                        {rule.submission_portal.split('/')[0].split(' ')[0]} <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-subtext max-w-[200px] truncate" title={rule.legal_source}>
                      {rule.legal_source}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanded === rule.id && (
                    <tr className="bg-blue-50 border-b border-blue-200">
                      <td colSpan={9} className="px-8 py-4">
                        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-card">
                          <p className="text-xs font-semibold uppercase tracking-wider text-subtext mb-2">Clause Detail</p>
                          <p className="text-sm text-text leading-relaxed">
                            <strong>{rule.clause}</strong> — <em>{rule.legal_source}</em>
                          </p>
                          <div className="mt-3 flex items-center gap-6 text-xs text-subtext">
                            <span><strong>Regulator:</strong> {rule.regulator}</span>
                            <span><strong>All Classifications:</strong> {rule.applicable_classification.join(', ')}</span>
                            <span><strong>All Layers:</strong> {rule.applicable_layer.join(', ')}</span>
                            <a href={rule.portal_url} target="_blank" rel="noreferrer"
                              className="text-accent hover:underline flex items-center gap-1 ml-auto">
                              Open Portal <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-subtext text-right">{filtered.length} of {rules.length} obligations shown</p>
    </div>
  )
}
