-- Run in the Supabase SQL editor (already applied to the linked project).

-- 1. "Mark Filed" records: require the authenticator step (aal2), not just a password.
--    Without this, a user could skip the OTP screen and hit the table with a password-only session.
drop policy if exists "Users manage own filings" on public.manual_filings;
create policy "Users manage own filings" on public.manual_filings
  as permissive for all to authenticated
  using      (auth.uid() = user_id and (auth.jwt() ->> 'aal') = 'aal2')
  with check (auth.uid() = user_id and (auth.jwt() ->> 'aal') = 'aal2');

-- 2. NBFC registry is served only by the FastAPI backend (which connects as postgres and bypasses RLS).
--    Enabling RLS with no policies blocks direct read/write from the browser's public anon key.
alter table public.nbfc_registry enable row level security;

-- Rollback for (1):
-- drop policy "Users manage own filings" on public.manual_filings;
-- create policy "Users manage own filings" on public.manual_filings for all
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
