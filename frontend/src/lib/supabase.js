import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Without credentials, export null: AuthContext falls back to local (browser-only)
// auth and useFilings stores filings in localStorage.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Never allow the local-auth fallback in a production build: fail loudly instead.
if (!supabase && import.meta.env.PROD) {
  throw new Error('[Comply.AI] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for production builds.')
}

if (!supabase) {
  console.warn('[Comply.AI] Supabase credentials missing — running in local auth mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env to use Supabase.')
}
