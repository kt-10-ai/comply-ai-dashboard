-- Comply.AI — run once in Supabase Dashboard → SQL Editor (before scripts/seed_db.py).

-- 1. NBFC registry (read by the FastAPI backend via DATABASE_URL, which bypasses RLS).
create table if not exists public.nbfc_registry (
  id               serial primary key,
  sl_no            integer,
  nbfc_name        varchar,
  regional_office  varchar,
  accepts_deposits varchar,
  classification   varchar,
  cin              varchar,
  layer            varchar
);
create index if not exists ix_nbfc_registry_nbfc_name       on public.nbfc_registry (nbfc_name);
create index if not exists ix_nbfc_registry_cin             on public.nbfc_registry (cin);
create index if not exists ix_nbfc_registry_classification  on public.nbfc_registry (classification);
create index if not exists ix_nbfc_registry_layer           on public.nbfc_registry (layer);
create index if not exists ix_nbfc_registry_regional_office on public.nbfc_registry (regional_office);

-- RLS on with no policies: the table is NOT readable through Supabase's public REST API
-- with the anon key. Only the backend (postgres role) can read it, after its own MFA check.
alter table public.nbfc_registry enable row level security;

-- 2. Per-user "marked as filed" records (written directly from the browser by useFilings).
create table if not exists public.manual_filings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cin          text not null,
  rule_id      text not null,
  period_label text not null,
  filed_date   date,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (user_id, cin, rule_id, period_label)
);
alter table public.manual_filings enable row level security;

-- Users can only touch their own rows, and only after completing the TOTP second factor.
drop policy if exists "own filings, mfa verified" on public.manual_filings;
create policy "own filings, mfa verified" on public.manual_filings
  for all to authenticated
  using      ((select auth.uid()) = user_id and (select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.uid()) = user_id and (select auth.jwt() ->> 'aal') = 'aal2');
