import axios from 'axios'
import { supabase } from '../lib/supabase'

// Production (Vercel): the FastAPI function is served same-origin under /backend.
// Local dev: uvicorn on :8000. VITE_API_URL overrides either.
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/backend')

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach the Supabase access token; the backend rejects requests without an MFA-verified (aal2) token.
api.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
