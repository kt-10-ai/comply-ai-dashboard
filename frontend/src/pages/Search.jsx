import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Filter, RefreshCw, ChevronRight, Download, Building2, Layers, Briefcase } from 'lucide-react'
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
  const [stats, setStats] = useState({ total: 0, layers: {}, classifications: {} })
  
  const [name, setName] = useState('')
  const [classification, setClassification] = useState('')
  const [layer, setLayer] = useState('')
  const [office, setOffice] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/nbfc/stats').then(res => setStats(res.data)).catch(console.error)
  }, [])

  const fetch = useCallback(() => {
    setLoading(true)
    const params = { limit: 100 }
    if (name) params.name = name
    if (classification) params.classification = classification
    if (layer) params.layer = layer
    if (office) params.regional_office = office
    
    api.get('/nbfc/search', { params })
      .then(r => { setNbfcs(r.data); setLoading(false); setPage(1) })
      .catch(() => setLoading(false))
  }, [name, classification, layer, office])

  useEffect(() => { fetch() }, [classification, layer, office])

  const reset = () => {
    setName(''); setClassification(''); setLayer(''); setOffice('')
    api.get('/nbfc/search', { params: { limit: 100 } }).then(r => setNbfcs(r.data))
  }

  const exportCSV = async () => {
    const params = { limit: 10000 }
    if (name) params.name = name
    if (classification) params.classification = classification
    if (layer) params.layer = layer
    if (office) params.regional_office = office

    try {
      const res = await api.get('/nbfc/search', { params })
      const data = res.data

      const headers = "Sl No.,Name,CIN,Classification,Layer,Regional Office\n"
      const rows = data.map(n => `"${n.sl_no || ''}","${n.nbfc_name}","${n.cin}","${n.classification}","${n.layer}","${n.regional_office}"`).join("\n")
      const csv = headers + rows
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comply_ai_nbfc_registry_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
    } catch (e) {
      console.error("Export failed", e)
      alert("Failed to export CSV.")
    }
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(nbfcs.length / itemsPerPage)
  const paginated = nbfcs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Building2 className="text-accent" /> NBFC Registry
          </h1>
          <p className="text-text mt-1 text-sm">Browse and filter the complete database of RBI-registered NBFCs.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 text-sm font-medium transition-colors">
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-accent rounded-xl"><Building2 size={24} /></div>
          <div>
            <p className="text-sm text-text">Total NBFCs</p>
            <h3 className="text-2xl font-bold text-navy">{stats.total.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Layers size={24} /></div>
          <div>
            <p className="text-sm text-text">Base Layer Companies</p>
            <h3 className="text-2xl font-bold text-navy">{stats.layers['Base']?.toLocaleString() || 0}</h3>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Briefcase size={24} /></div>
          <div>
            <p className="text-sm text-text">ICC Classification</p>
            <h3 className="text-2xl font-bold text-navy">{stats.classifications['ICC']?.toLocaleString() || 0}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search NBFC by name..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-border rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetch()}
          />
        </div>
        
        <select value={classification} onChange={e => setClassification(e.target.value)} className="px-3 py-2 bg-slate-50 border border-border rounded-lg text-sm focus:outline-none">
          <option value="">All Classifications</option>
          {CLASSIFICATIONS.map(c => <option key={c} value={c}>{CLASS_LABELS[c] || c}</option>)}
        </select>

        <select value={layer} onChange={e => setLayer(e.target.value)} className="px-3 py-2 bg-slate-50 border border-border rounded-lg text-sm focus:outline-none">
          <option value="">All Layers</option>
          {LAYERS.map(l => <option key={l} value={l}>{l} Layer</option>)}
        </select>

        <select value={office} onChange={e => setOffice(e.target.value)} className="px-3 py-2 bg-slate-50 border border-border rounded-lg text-sm focus:outline-none">
          <option value="">All Regions</option>
          {OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <button onClick={fetch} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          Search
        </button>
        <button onClick={reset} className="px-3 py-2 text-text hover:bg-slate-100 rounded-lg transition-colors" title="Reset Filters">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Data Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-border text-text font-medium">
              <tr>
                <th className="px-6 py-4">NBFC Name</th>
                <th className="px-6 py-4">CIN</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Layer</th>
                <th className="px-6 py-4">Regional Office</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading registry data...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No NBFCs found matching your criteria.</td>
                </tr>
              ) : (
                paginated.map(nbfc => (
                  <tr key={nbfc.cin} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/nbfc/${nbfc.cin}`)}>
                    <td className="px-6 py-3 font-medium text-navy">{nbfc.nbfc_name}</td>
                    <td className="px-6 py-3 text-text font-mono text-xs">{nbfc.cin}</td>
                    <td className="px-6 py-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                        {CLASS_LABELS[nbfc.classification] || nbfc.classification || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <LayerBadge layer={nbfc.layer} />
                    </td>
                    <td className="px-6 py-3 text-text text-xs">{nbfc.regional_office}</td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        className="p-1.5 text-accent hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && nbfcs.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-sm text-text bg-slate-50">
            <div>
              Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, nbfcs.length)} of top {nbfcs.length} results
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white border border-border rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-white border border-border rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
