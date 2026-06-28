import React from 'react'

const CONFIG = {
  'FILED':    { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', dot: '#16A34A', label: 'FILED' },
  'OVERDUE':  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#DC2626', label: 'OVERDUE' },
  'DUE SOON': { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', dot: '#EA580C', label: 'DUE SOON' },
  'UPCOMING': { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', dot: '#2563EB', label: 'UPCOMING' },
  'PENDING':  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', dot: '#D97706', label: 'PENDING' },
}

const StatusBadge = ({ status }) => {
  const cfg = CONFIG[status?.toUpperCase()] || CONFIG['UPCOMING']
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '2px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em',
      fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

export default StatusBadge
