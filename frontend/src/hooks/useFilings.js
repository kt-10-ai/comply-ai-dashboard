import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * useFilings
 * ----------
 * Manages manual filing records for a specific NBFC (by CIN).
 * Reads from and writes to the `manual_filings` table in Supabase.
 *
 * Supabase table schema (run in SQL editor):
 *
 *   create table manual_filings (
 *     id           uuid default gen_random_uuid() primary key,
 *     user_id      uuid references auth.users on delete cascade,
 *     cin          text not null,
 *     rule_id      text not null,
 *     period_label text not null,
 *     filed_date   date,
 *     notes        text,
 *     created_at   timestamptz default now(),
 *     unique (user_id, cin, rule_id, period_label)
 *   );
 *
 *   alter table manual_filings enable row level security;
 *   create policy "Users manage own filings"
 *     on manual_filings for all
 *     using (auth.uid() = user_id)
 *     with check (auth.uid() = user_id);
 */
export function useFilings(cin) {
  const { user } = useAuth()
  const [filings, setFilings] = useState([])   // array of manual_filings rows
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Build a lookup key: "RULE_ID::period_label"
  const key = (ruleId, periodLabel) => `${ruleId}::${periodLabel}`

  const filingMap = Object.fromEntries(filings.map(f => [key(f.rule_id, f.period_label), f]))
  const isFiled   = (ruleId, periodLabel) => !!filingMap[key(ruleId, periodLabel)]
  const getFiling = (ruleId, periodLabel) =>  filingMap[key(ruleId, periodLabel)] ?? null

  const fetchFilings = useCallback(async () => {
    if (!user || !cin) return
    setLoading(true)
    const { data, error } = await supabase
      .from('manual_filings')
      .select('*')
      .eq('cin', cin)
      .eq('user_id', user.id)
    if (error) { setError(error.message); setLoading(false); return }
    setFilings(data ?? [])
    setLoading(false)
  }, [user, cin])

  useEffect(() => { fetchFilings() }, [fetchFilings])

  const markFiled = async ({ ruleId, periodLabel, filedDate, notes }) => {
    if (!user) return { error: 'Not authenticated' }
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
    if (!error) setFilings(prev => {
      const k = key(ruleId, periodLabel)
      const existing = prev.findIndex(f => key(f.rule_id, f.period_label) === k)
      if (existing >= 0) { const n = [...prev]; n[existing] = data; return n }
      return [...prev, data]
    })
    return { data, error }
  }

  const unmarkFiled = async (ruleId, periodLabel) => {
    if (!user) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('manual_filings')
      .delete()
      .eq('user_id', user.id)
      .eq('cin', cin)
      .eq('rule_id', ruleId)
      .eq('period_label', periodLabel)
    if (!error) setFilings(prev =>
      prev.filter(f => !(f.rule_id === ruleId && f.period_label === periodLabel))
    )
    return { error }
  }

  return { filings, loading, error, isFiled, getFiling, markFiled, unmarkFiled, refresh: fetchFilings }
}
