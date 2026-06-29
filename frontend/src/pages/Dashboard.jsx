import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, LabelList
} from 'recharts'
import CountUp from 'react-countup'
import { format, parseISO } from 'date-fns'
import { Building2, CalendarClock, AlertTriangle, MapPin, ArrowRight, ExternalLink } from 'lucide-react'

const CLASS_COLORS = {
  ICC:'#1D4ED8', MFI:'#059669', HFC:'#D97706', CIC:'#7C3AED',
  'Type-I':'#64748B', P2P:'#0891B2', AA:'#0E7490', Factor:'#B45309',
  IFC:'#DC2626', PD:'#9333EA',
}
const LAYER_COLORS = { Base:'#2563EB', Middle:'#059669', Upper:'#D97706', Top:'#DC2626' }

const STATUS_STYLES = {
  'OVERDUE':  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#DC2626' },
  'DUE SOON': { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', dot: '#EA580C' },
  'UPCOMING': { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', dot: '#2563EB' },
}

const KPICard = ({ label, value, sublabel, colorClass, icon: Icon }) => (
  <div className={`card p-5 ${colorClass}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtext mb-1">{label}</p>
        <p className="font-display text-3xl text-text leading-none mb-1">
          <CountUp end={value} duration={1.2} separator="," />
        </p>
        <p className="text-xs text-subtext">{sublabel}</p>
      </div>
      {Icon && <Icon size={22} className="text-muted mt-0.5" />}
    </div>
  </div>
)

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-lg shadow-elevated px-3 py-2 text-xs">
      <p className="font-semibold text-text mb-1">{label}</p>
      <p className="text-subtext">{payload[0].value.toLocaleString()} NBFCs</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/compliance/stats'),
      api.get('/compliance/calendar'),
    ]).then(([s, c]) => {
      setStats(s.data)
      setCalendar(c.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!stats) return (
    <div className="card p-8 text-center text-subtext">
      Backend not reachable. Please run: <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">cd backend && uvicorn main:app --reload</code>
    </div>
  )

  const classData = Object.entries(stats.by_classification || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const layerData = Object.entries(stats.by_layer || {})
    .map(([name, value]) => ({ name, value, fill: LAYER_COLORS[name] || '#94A3B8' }))

  const overdue  = calendar.filter(r => r.status === 'OVERDUE').length
  const dueSoon  = calendar.filter(r => r.status === 'DUE SOON').length
  const offices  = Object.keys(stats.by_regional_office || {}).length

  const upcoming = [...calendar]
    .filter(r => r.due_date !== null)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Monitored Entities" value={stats.total_nbfcs} sublabel="Registered NBFCs"  colorClass="kpi-blue"  icon={Building2} />
        <KPICard label="Returns Overdue"    value={overdue}           sublabel="Past deadline"    colorClass="kpi-red"   icon={AlertTriangle} />
        <KPICard label="Due Within 7 Days"  value={dueSoon}           sublabel="Action required"  colorClass="kpi-amber" icon={CalendarClock} />
        <KPICard label="RBI Offices"        value={offices}           sublabel="Regional coverage" colorClass="kpi-green" icon={MapPin} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-text mb-4">NBFCs by Classification</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={classData} layout="vertical" margin={{ left: 16, right: 40, top: 0, bottom: 0 }}>
              <XAxis type="number" scale="log" domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#0F172A', fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="value" fill="#0F2744" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={true} animationBegin={200} animationDuration={800} animationEasing="ease-out">
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#64748B' }} formatter={(val) => val.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text mb-1">By SBR Layer</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={layerData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} minAngle={8} dataKey="value" isAnimationActive={true} animationBegin={300} animationDuration={1000} animationEasing="ease-out">
                {layerData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [val.toLocaleString(), name]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full space-y-1.5 mt-1">
            {layerData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="text-subtext">{d.name}</span>
                </div>
                <span className="font-semibold text-text">
                  <CountUp end={d.value} duration={1.2} separator="," />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines — from the rule engine */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-text">Global Upcoming Deadlines (All NBFCs)</h3>
            <p className="text-xs text-subtext">Master regulatory calendar computed from RBI Directions — applies across all layers and classifications.</p>
          </div>
          <button onClick={() => navigate('/calendar')} className="btn-secondary flex items-center gap-1.5 text-xs">
            View Calendar <ArrowRight size={12} />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header-cell">Return</th>
              <th className="table-header-cell">Period</th>
              <th className="table-header-cell">Frequency</th>
              <th className="table-header-cell">Due Date</th>
              <th className="table-header-cell">Portal</th>
              <th className="table-header-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map(r => {
              const s = STATUS_STYLES[r.status] || STATUS_STYLES['UPCOMING']
              const freqCls = r.frequency === 'Monthly' ? 'freq-monthly' : r.frequency === 'Quarterly' ? 'freq-quarterly' : r.frequency === 'Annual' ? 'freq-annual' : 'freq-event'
              return (
                <tr key={r.id} className={`border-b border-border/50 ${r.status === 'OVERDUE' ? 'bg-red-50/30' : r.status === 'DUE SOON' ? 'bg-orange-50/30' : ''}`}>
                  <td className="table-cell">
                    <span className="font-mono text-xs font-bold text-accent">{r.id}</span>
                    <p className="text-sm font-medium text-text">{r.return_name}</p>
                  </td>
                  <td className="table-cell font-mono text-xs text-subtext">{r.period_label}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${freqCls}`}>{r.frequency}</span>
                  </td>
                  <td className="table-cell font-mono text-xs font-semibold text-text">
                    {format(parseISO(r.due_date), 'd MMM yyyy')}
                  </td>
                  <td className="table-cell">
                    <a href={r.portal_url} target="_blank" rel="noreferrer"
                      className="text-accent text-xs hover:underline flex items-center gap-1">
                      {r.submission_portal.split(' ').slice(0,2).join(' ')} <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="table-cell">
                    <span style={{
                      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
                      {r.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
