import React from 'react'

const layerConfig = {
  Base:   { cls: 'badge-base',   label: 'Base' },
  Middle: { cls: 'badge-middle', label: 'Middle' },
  Upper:  { cls: 'badge-upper',  label: 'Upper' },
  Top:    { cls: 'badge-top',    label: 'Top' },
}

const LayerBadge = ({ layer, size = 'sm' }) => {
  const cfg = layerConfig[layer] || { cls: 'bg-slate-100 text-slate-600 border border-slate-200', label: layer }
  const sizeClass = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`${cfg.cls} ${sizeClass} rounded font-semibold inline-block`}>
      {cfg.label}
    </span>
  )
}

export default LayerBadge
