import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import {
  ArrowLeft, Building2, Layers, MapPin, ShieldCheck,
  ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
  CheckCheck, RotateCcw
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import LayerBadge from '../components/LayerBadge'
import StatusBadge from '../components/StatusBadge'
import MarkFiledModal from '../components/MarkFiledModal'
import { useFilings } from '../hooks/useFilings'

const CLASS_LABELS = {
  ICC:'Investment and Credit Company', MFI:'Micro Finance Institution',
  HFC:'Housing Finance Company', CIC:'Core Investment Company',
  'Type-I':'Type-I NBFC', P2P:'Peer-to-Peer Lending Platform',
  AA:'Account Aggregator', Factor:'NBFC-Factor',
  IFC:'Infrastructure Finance Company', PD:'Primary Dealer',
  IDF:'Infrastructure Debt Fund', NOFHC:'Non-Operative Financial Holding Company',
  MGC:'Mortgage Guarantee Company'
}

const FREQ_STYLES = {
  Monthly: 'freq-monthly', Quarterly: 'freq-quarterly',
  Annual: 'freq-annual', 'Event-based': 'freq-event',
}

const RECIPIENT_STYLES = {
  'RBI Regional Office': { color: '#0F2744', bg: '#EFF6FF', border: '#BFDBFE' },
  'Central Portal':      { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  'External Regulator':  { color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
}

const MetaChip = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 border border-border rounded-lg px-3.5 py-2.5 bg-white">
    <Icon size={14} className="text-subtext shrink-0" />
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-subtext">{label}</p>
      <p className="text-xs font-semibold text-text leading-tight">{value}</p>
    </div>
  </div>
)

const SummaryBox = ({ label, value, color }) => (
  <div className="rounded-lg p-3 border text-center" style={{
    background: color === 'red' ? '#FEF2F2' : color === 'orange' ? '#FFF7ED' : color === 'blue' ? '#EFF6FF' : '#F1F5F9',
    borderColor: color === 'red' ? '#FECACA' : color === 'orange' ? '#FED7AA' : color === 'blue' ? '#BFDBFE' : '#E2E8F0',
  }}>
    <p className="text-xl font-display leading-none" style={{
      color: color === 'red' ? '#DC2626' : color === 'orange' ? '#EA580C' : color === 'blue' ? '#2563EB' : '#0F172A',
    }}>{value}</p>
    <p className="text-[10px] font-semibold mt-1" style={{
      color: color === 'red' ? '#991B1B' : color === 'orange' ? '#9A3412' : color === 'blue' ? '#1E40AF' : '#64748B',
    }}>{label}</p>
  </div>
)

export default function Detail() {
  const { cin } = useParams()
  const [nbfc, setNbfc]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [modal, setModal]       = useState(null)   // entry being marked
  const [saving, setSaving]     = useState(false)

  const { isFiled, getFiling, markFiled, unmarkFiled } = useFilings(cin)

  useEffect(() => {
    api.get(`/nbfc/${decodeURIComponent(cin)}`)
      .then(r => { setNbfc(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cin])

  const handleMarkFiled = async ({ filedDate, notes }) => {
    setSaving(true)
    await markFiled({ ruleId: modal.rule_id, periodLabel: modal.period_label, filedDate, notes })
    setSaving(false)
    setModal(null)
  }

  const handleUnmark = async (e, entry) => {
    e.stopPropagation()
    await unmarkFiled(entry.rule_id, entry.period_label)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!nbfc || nbfc.error) return (
    <div className="space-y-4">
      <Link to="/search" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
        <ArrowLeft size={14} /> Back to Registry
      </Link>
      <div className="card p-8 text-center text-subtext">NBFC not found.</div>
    </div>
  )

  const calendar = nbfc.compliance_calendar || []
  const total    = calendar.length
  const filed    = calendar.filter(r => isFiled(r.rule_id, r.period_label)).length
  const overdue  = calendar.filter(r => r.status === 'OVERDUE'  && !isFiled(r.rule_id, r.period_label)).length
  const dueSoon  = calendar.filter(r => r.status === 'DUE SOON' && !isFiled(r.rule_id, r.period_label)).length
  const upcoming = calendar.filter(r => r.status === 'UPCOMING' && !isFiled(r.rule_id, r.period_label)).length

  const showNOFWarning = nbfc.layer === 'Base' && ['ICC','MFI','Factor'].includes(nbfc.classification)

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-subtext">
        <Link to="/search" className="hover:text-accent transition-colors">Registry</Link>
        <span>›</span>
        <span className="text-text font-medium truncate max-w-md">{nbfc.nbfc_name}</span>
      </div>

      {/* Profile card */}
      <div className="card overflow-hidden">
        <div className="h-1.5 bg-navy" />
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Link to="/search" className="p-1.5 hover:bg-slate-100 rounded transition-colors text-subtext hover:text-text mt-0.5">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="font-mono text-[11px] text-subtext mb-0.5">{nbfc.cin}</p>
              <h1 className="font-display text-2xl text-text">{nbfc.nbfc_name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 ml-9">
            <MetaChip icon={Building2} label="Classification"   value={CLASS_LABELS[nbfc.classification] || nbfc.classification} />
            <MetaChip icon={Layers}    label="SBR Layer"        value={`${nbfc.layer} Layer`} />
            <MetaChip icon={MapPin}    label="Regional Office"  value={nbfc.regional_office} />
            <MetaChip icon={ShieldCheck} label="Deposits"       value={nbfc.accepts_deposits === 'Yes' ? 'Accepts' : 'Non-deposit'} />
          </div>

          {showNOFWarning && (
            <div className="mt-5 ml-9 rounded-lg p-3.5 flex gap-3"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={16} style={{ color: '#D97706' }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold" style={{ color: '#92400E' }}>NOF Capitalization Requirement</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#B45309' }}>
                  As a Base Layer {nbfc.classification}, NOF must reach ₹10 Crore by <strong>31 March 2027</strong> per RBI SBR framework.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-5">

        {/* Compliance Calendar Table */}
        <div className="flex-1 min-w-0 card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Compliance Calendar</h3>
              <p className="text-xs text-subtext mt-0.5">
                {total} applicable returns · Status computed as of today
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-subtext">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Overdue
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block ml-2" /> Due Soon
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-2" /> Upcoming
            </div>
          </div>

          {/* Mark Filed Modal */}
          {modal && (
            <MarkFiledModal
              entry={modal}
              onConfirm={handleMarkFiled}
              onClose={() => setModal(null)}
              loading={saving}
            />
          )}

          {calendar.length === 0 ? (
            <div className="p-8 text-center text-subtext text-sm">
              No compliance obligations for this classification and layer.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell w-8"></th>
                  <th className="table-header-cell">Return</th>
                  <th className="table-header-cell">Frequency</th>
                  <th className="table-header-cell">Period</th>
                  <th className="table-header-cell">Due Date</th>
                  <th className="table-header-cell">Reports To</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Portal</th>
                  <th className="table-header-cell w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {calendar.map(entry => {
                  const isExp    = expanded === entry.rule_id
                  const rStyle   = RECIPIENT_STYLES[entry.recipient_type] || RECIPIENT_STYLES['Central Portal']
                  const filed    = isFiled(entry.rule_id, entry.period_label)
                  const filingRec= getFiling(entry.rule_id, entry.period_label)
                  const rowStatus = filed ? 'FILED' : entry.status
                  return (
                    <React.Fragment key={entry.rule_id}>
                      <tr
                        onClick={() => setExpanded(isExp ? null : entry.rule_id)}
                        className={`cursor-pointer transition-colors border-b border-border/50
                          ${filed ? 'bg-green-50/30' :
                            entry.status === 'OVERDUE' ? 'bg-red-50/40 hover:bg-red-50/60' :
                            entry.status === 'DUE SOON' ? 'bg-orange-50/40 hover:bg-orange-50/60' :
                            'hover:bg-slate-50'}`}
                      >
                        <td className="table-cell text-center text-muted">
                          {isExp
                            ? <ChevronUp size={13} className="text-accent mx-auto" />
                            : <ChevronDown size={13} className="mx-auto" />}
                        </td>
                        <td className="table-cell">
                          <span className="font-mono text-xs font-bold text-accent">{entry.rule_id}</span>
                          <p className="text-sm font-medium text-text leading-tight mt-0.5">{entry.return_name}</p>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${FREQ_STYLES[entry.frequency] || 'freq-event'}`}>
                            {entry.frequency}
                          </span>
                        </td>
                        <td className="table-cell font-mono text-xs text-subtext">{entry.period_label}</td>
                        <td className="table-cell">
                          <span className={`font-mono text-xs font-semibold ${entry.status === 'OVERDUE' ? 'text-red-700' : 'text-text'}`}>
                            {format(parseISO(entry.due_date), 'd MMM yyyy')}
                          </span>
                          {entry.status === 'OVERDUE' && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {Math.abs(entry.days_delta)}d ago
                            </p>
                          )}
                          {entry.status === 'DUE SOON' && (
                            <p className="text-[10px] text-orange-500 mt-0.5">
                              in {entry.days_delta}d
                            </p>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className="text-xs font-semibold" style={{ color: rStyle.color }}>
                            {entry.reports_to}
                          </span>
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={rowStatus} />
                          {filed && filingRec?.filed_date && (
                            <p className="text-[10px] text-success mt-0.5 font-medium">
                              {format(new Date(filingRec.filed_date), 'd MMM yyyy')}
                            </p>
                          )}
                        </td>
                        <td className="table-cell">
                          <a href={entry.portal_url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-accent text-xs hover:underline flex items-center gap-1">
                            {entry.portal_name.split(' ').slice(0, 2).join(' ')}
                            <ExternalLink size={10} />
                          </a>
                        </td>
                        <td className="table-cell" onClick={e => e.stopPropagation()}>
                          {filed ? (
                            <button
                              onClick={e => handleUnmark(e, entry)}
                              className="flex items-center gap-1 text-[11px] text-subtext hover:text-danger transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                              <RotateCcw size={11} /> Undo
                            </button>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setModal(entry) }}
                              className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-navy transition-colors px-2 py-1 rounded hover:bg-blue-50 whitespace-nowrap"
                            >
                              <CheckCheck size={11} /> Mark Filed
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExp && (
                        <tr className="border-b border-blue-100">
                          <td colSpan={8} className="px-8 py-4 bg-blue-50/40">
                            <div className="grid grid-cols-4 gap-6 text-xs">

                              {/* Due date computation — the audit trail */}
                              <div className="col-span-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-subtext mb-2 flex items-center gap-1">
                                  <span>📐</span> Due Date Calculation
                                </p>
                                {entry.computation ? (
                                  <div className="bg-white border border-blue-200 rounded-md px-3 py-2 font-mono text-[11px] text-text whitespace-pre-line leading-relaxed">
                                    {entry.computation}
                                  </div>
                                ) : (
                                  <p className="text-subtext italic">On occurrence — no fixed schedule</p>
                                )}
                              </div>

                              {/* Legal Source */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-subtext mb-1">Legal Source</p>
                                <p className="text-text leading-relaxed">{entry.legal_source}</p>
                              </div>

                              {/* Clause */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-subtext mb-1">Clause</p>
                                <p className="text-text font-semibold">{entry.clause}</p>
                                <p className="text-subtext mt-1">Regulator: {entry.regulator}</p>
                              </div>

                              {/* Portal */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-subtext mb-1">Portal</p>
                                <a href={entry.portal_url} target="_blank" rel="noreferrer"
                                  className="text-accent hover:underline flex items-center gap-1">
                                  {entry.portal_name} <ExternalLink size={10} />
                                </a>
                                <p className="text-[10px] text-subtext mt-1">
                                  {entry.recipient_type === 'RBI Regional Office'
                                    ? 'Requires RBI Regional Office login'
                                    : entry.recipient_type === 'External Regulator'
                                    ? 'External regulator — separate credentials'
                                    : 'Requires RBI-issued entity credentials'}
                                </p>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="w-52 shrink-0 space-y-4">
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-text mb-3">Filing Summary</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <SummaryBox label="Total Returns" value={total} color="slate" />
              </div>
              <SummaryBox label="Filed"    value={filed}    color="green" />
              <SummaryBox label="Overdue"  value={overdue}  color="red" />
              <SummaryBox label="Due Soon" value={dueSoon}  color="orange" />
              <SummaryBox label="Upcoming" value={upcoming} color="blue" />
            </div>
            <p className="text-[10px] text-subtext mt-3 leading-relaxed">
              Status computed from today vs. filing period deadlines. No manual input required.
            </p>
          </div>

          <div className="card p-4 space-y-2">
            <h4 className="text-xs font-semibold text-subtext uppercase tracking-wider">Entity</h4>
            {[
              ['CIN', nbfc.cin],
              ['Sl No.', `#${nbfc.sl_no}`],
              ['Layer', null],
              ['Office', nbfc.regional_office],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-xs">
                <span className="text-subtext">{k}</span>
                {k === 'Layer'
                  ? <LayerBadge layer={nbfc.layer} size="xs" />
                  : <span className="font-mono text-text text-[10px] truncate max-w-[110px] text-right">{v}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
