import React, { useState } from 'react'
import { X, CheckCircle, Calendar, FileText, Loader } from 'lucide-react'
import { format } from 'date-fns'

/**
 * MarkFiledModal
 * Shows when user clicks "Mark as Filed" on a compliance row.
 * Collects: filed date (optional) + notes (optional), then calls onConfirm.
 */
export default function MarkFiledModal({ entry, onConfirm, onClose, loading }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [filedDate, setFiledDate] = useState(today)
  const [notes, setNotes]         = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ filedDate, notes })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md animate-slide-up overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle size={18} className="text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">Mark as Filed</h3>
                <p className="text-xs text-subtext mt-0.5">
                  <span className="font-mono font-bold text-accent">{entry.rule_id}</span>
                  {' '}·{' '}{entry.return_name}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1 text-muted hover:text-text hover:bg-slate-100 rounded-md transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Context pill */}
          <div className="px-6 pt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold bg-slate-100 text-subtext px-2.5 py-1 rounded-md">
              {entry.period_label}
            </span>
            <span className="text-[11px] font-semibold bg-slate-100 text-subtext px-2.5 py-1 rounded-md">
              {entry.frequency}
            </span>
            <span className="text-[11px] font-semibold bg-blue-50 text-accent px-2.5 py-1 rounded-md">
              Due {entry.due_date ? format(new Date(entry.due_date), 'd MMM yyyy') : '—'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Filed date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Calendar size={12} className="text-subtext" />
                Filed On
              </label>
              <input
                type="date"
                value={filedDate}
                max={today}
                onChange={e => setFiledDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text
                  font-mono focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy
                  transition-all bg-white"
              />
              <p className="text-[10px] text-subtext">Leave as today if filing right now.</p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                <FileText size={12} className="text-subtext" />
                Notes <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Reference number, auditor name, any remarks…"
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text
                  placeholder:text-muted resize-none focus:outline-none focus:ring-2
                  focus:ring-navy/20 focus:border-navy transition-all bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium
                  text-subtext hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold
                  hover:bg-navylight transition-all flex items-center justify-center gap-2
                  disabled:opacity-60">
                {loading
                  ? <><Loader size={14} className="animate-spin" /> Saving…</>
                  : <><CheckCircle size={14} /> Confirm Filed</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
