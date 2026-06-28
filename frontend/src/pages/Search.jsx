import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Filter, RefreshCw, ChevronRight, Download } from 'lucide-react'
import LayerBadge from '../components/LayerBadge'

const CLASSIFICATIONS = ["ICC","Type-I","MFI","HFC","CIC","P2P","AA","Factor","IFC","PD","IDF","NOFHC","MGC"]
const LAYERS = ["Base","Middle","Upper","Top"]
const OFFICES = [
  "Mumbai","New Delhi","Kolkata","Chennai","Ahmedabad","Bengaluru",
  "Hyderabad","Jaipur","Chandigarh","Kanpur","Guwahati","Bhopal",
  "Bhubaneswar","Patna","Ranchi","Raipur","Jammu","Nagpur",
  "Dehradun","Thiruvananthapuram","Shimla","Andhra Pradesh"
]

const CLASS_LABELS = {
  ICC:'Investment & Credit Co.', MFI:'Micro Finance Inst.',
  HFC:'Housing Finance Co.', CIC:'Core Investment Co.',
  'Type-I':'Type-I NBFC', P2P:'Peer-to-Peer', AA:'Account Aggregator',
  Factor:'NBFC-Factor', IFC:'Infrastructure Finance', PD:'Primary Dealer',
  IDF:'Infra Debt Fund', NOFHC:'Non-Op Holding Co.', MGC:'Mortgage Guarantee'
}

export default function Search() {
  const [nbfcs, setNbfcs] = useState([])
  const [name, setName] = useState('')
  const [classification, setClassification] = useState('')
  const [layer, setLayer] = useState('')
  const [office, setOffice] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetch = useCallback(() => {
    setLoading(true)
    const params = {}
    if (name) params.name = name
    if (classification) params.classification = classification
    if (layer) params.layer = layer
    if (office) params.regional_office = office
    api.get('/nbfc/search', { params })
      .then(r => { setNbfcs(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [name, classification, layer, office])

  useEffect(() => { fetch() }, [classification, layer, office])

  const reset = () => {
    setName(''); setClassification(''); setLayer(''); setOffice('')
    api.get('/nbfc/search').then(r => setNbfcs(r.data))
  }

  const exportCSV = () => {
    const headers = ['sl_no','nbfc_name','cin','classification','layer','accepts_deposits','regional_office']
    const rows = nbfcs.map(n => headers.map(h => `"${n[h] ?? ''}"`).join(','))
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'nbfc_registry.csv'; a.click()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <form onSubmit={e => { e.preventDefault(); fetch() }} className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon size={15} className="absolute left-3 top-2.5 text-muted" />
            <input
              type="text"
              placeholder="Search NBFCs by name…"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            Search
          </button>
          <button type="button" onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download size={14} /> Export
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-subtext">
            <Filter size={13} />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>
          <select value={classification} onChange={e => setClassification(e.target.value)}
            className="input-base !w-auto text-xs py-1.5">
            <option value="">All Classifications</option>
            {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c} — {CLASS_LABELS[c]}</option>)}
          </select>
          <select value={layer} onChange={e => setLayer(e.target.value)}
            className="input-base !w-auto text-xs py-1.5">
            <option value="">All Layers</option>
            {LAYERS.map(l => <option key={l} value={l}>{l} Layer</option>)}
          </select>
          <select value={office} onChange={e => setOffice(e.target.value)}
            className="input-base !w-auto text-xs py-1.5">
            <option value="">All Offices</option>
            {OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={reset} className="text-xs text-subtext hover:text-accent flex items-center gap-1 ml-auto">
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-subtext font-semibold">
          Showing <span className="text-text">{nbfcs.length}</span> of 9,074 registered NBFCs
        </p>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="table-header-cell w-16">No.</th>
                  <th className="table-header-cell">NBFC Name / CIN</th>
                  <th className="table-header-cell">Classification</th>
                  <th className="table-header-cell">Layer</th>
                  <th className="table-header-cell">Deposits</th>
                  <th className="table-header-cell">Regional Office</th>
                  <th className="table-header-cell w-16"></th>
                </tr>
              </thead>
              <tbody>
                {nbfcs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-subtext text-sm">No records found. Adjust filters.</td></tr>
                ) : nbfcs.map(n => (
                  <tr key={n.cin}
                    onClick={() => navigate(`/nbfc/${encodeURIComponent(n.cin)}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="table-cell font-mono text-xs text-subtext">{n.sl_no}</td>
                    <td className="table-cell">
                      <p className="font-semibold text-text text-sm group-hover:text-accent transition-colors">{n.nbfc_name}</p>
                      <p className="font-mono text-[10px] text-subtext">{n.cin}</p>
                    </td>
                    <td className="table-cell">
                      <span className="bg-navy/5 text-navy border border-navy/10 px-2 py-0.5 rounded text-xs font-semibold font-mono">
                        {n.classification}
                      </span>
                    </td>
                    <td className="table-cell">
                      <LayerBadge layer={n.layer} />
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium ${n.accepts_deposits === 'Yes' ? 'text-success' : 'text-subtext'}`}>
                        {n.accepts_deposits === 'Yes' ? '✓ Accepts' : '✗ No'}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-subtext">{n.regional_office}</td>
                    <td className="table-cell text-right">
                      <ChevronRight size={16} className="text-muted group-hover:text-accent transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
