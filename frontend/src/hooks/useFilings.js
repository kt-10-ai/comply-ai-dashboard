import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

// ── Local storage helpers ─────────────────────────────────────────────────────
// Used as primary store; Supabase syncs in background when table is available.

const LS_KEY = (cin) => `comply_ai_filings_${cin}`

function loadLocal(cin) {
  try { return JSON.parse(localStorage.getItem(LS_KEY(cin)) || '[]') } catch { return [] }
}

function saveLocal(cin, filings) {
  try { localStorage.setItem(LS_KEY(cin), JSON.stringify(filings)) } catch {}
}

// ── Supabase (optional) ───────────────────────────────────────────────────────
import { supabase } from '../lib/supabase'

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFilings(cin) {
  const { user } = useAuth()

  // Initialise from localStorage immediately (no async wait)
  const [filings, setFilings] = useState(() => loadLocal(cin))

  // Build a lookup key: "RULE_ID::period_label"
  const key       = (ruleId, periodLabel) => `${ruleId}::${periodLabel}`
  const filingMap = Object.fromEntries(filings.map(f => [key(f.rule_id, f.period_label), f]))
  const isFiled   = (ruleId, periodLabel) => !!filingMap[key(ruleId, periodLabel)]
  const getFiling = (ruleId, periodLabel) =>  filingMap[key(ruleId, periodLabel)] ?? null

  // Persist to localStorage whenever filings change
  useEffect(() => { saveLocal(cin, filings) }, [cin, filings])

  // Sync FROM Supabase on mount (if authenticated + table exists)
  const syncFromSupabase = useCallback(async () => {
    if (!user || !cin || !supabase) return
    try {
      const { data, error } = await supabase
        .from('manual_filings')
        .select('*')
        .eq('cin', cin)
        .eq('user_id', user.id)
      if (!error && data?.length) {
        setFilings(data)
        saveLocal(cin, data)
      }
    } catch {}
  }, [user, cin])

  useEffect(() => { syncFromSupabase() }, [syncFromSupabase])

  // ── Mark Filed ────────────────────────────────────────────────────────────

  const markFiled = async ({ ruleId, periodLabel, filedDate, notes }) => {
    // Build the record
    const record = {
      id:           `local_${Date.now()}`,
      user_id:      user?.id ?? 'local',
      cin,
      rule_id:      ruleId,
      period_label: periodLabel,
      filed_date:   filedDate || new Date().toISOString().slice(0, 10),
      notes:        notes || null,
      created_at:   new Date().toISOString(),
    }

    // ✅ OPTIMISTIC: update UI immediately (no waiting for Supabase)
    setFilings(prev => {
      const k = key(ruleId, periodLabel)
      const existing = prev.findIndex(f => key(f.rule_id, f.period_label) === k)
      if (existing >= 0) { const n = [...prev]; n[existing] = record; return n }
      return [...prev, record]
    })

    // Sync to Supabase in background (silent failure is OK)
    if (user && supabase) {
      try {
        const { data, error } = await supabase
          .from('manual_filings')
          .upsert({
            user_id:      user.id,
            cin,
            rule_id:      ruleId,
            period_label: periodLabel,
            filed_date:   filedDate || null,
            notes:        notes || null,
          }, { onConflict: 'user_id,cin,rule_id,period_label' })
          .select()
          .single()

        if (!error && data) {
          // Replace local record with server record (has real UUID)
          setFilings(prev => {
            const k = key(ruleId, periodLabel)
            const existing = prev.findIndex(f => key(f.rule_id, f.period_label) === k)
            if (existing >= 0) { const n = [...prev]; n[existing] = data; return n }
            return [...prev, data]
          })
        }
      } catch (e) {
        console.warn('[Comply.AI] Supabase sync failed (table may not exist yet). Filing saved locally.', e?.message)
      }
    }

    return { data: record, error: null }
  }

  // ── Unmark Filed ─────────────────────────────────────────────────────────

  const unmarkFiled = async (ruleId, periodLabel) => {
    // ✅ OPTIMISTIC: remove from UI immediately
    setFilings(prev => prev.filter(f => !(f.rule_id === ruleId && f.period_label === periodLabel)))

    // Sync deletion to Supabase in background
    if (user && supabase) {
      try {
        await supabase
          .from('manual_filings')
          .delete()
          .eq('user_id', user.id)
          .eq('cin', cin)
          .eq('rule_id', ruleId)
          .eq('period_label', periodLabel)
      } catch (e) {
        console.warn('[Comply.AI] Supabase delete failed.', e?.message)
      }
    }

    return { error: null }
  }

  return { filings, isFiled, getFiling, markFiled, unmarkFiled }
}
