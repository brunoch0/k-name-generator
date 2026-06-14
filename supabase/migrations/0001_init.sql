-- K-Name — initial schema
-- Tables: generations (every name composed) + emails (captured leads)

create extension if not exists "pgcrypto";

-- ── generations ────────────────────────────────────────────────────────────
create table if not exists public.generations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  inputs      jsonb not null default '{}'::jsonb,
  result      jsonb not null default '{}'::jsonb,
  locale      text  not null default 'en'
);

-- ── emails ─────────────────────────────────────────────────────────────────
create table if not exists public.emails (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  email          text not null unique,
  generation_id  uuid references public.generations (id) on delete set null
);

create index if not exists emails_created_at_idx on public.emails (created_at desc);
create index if not exists generations_created_at_idx on public.generations (created_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- The edge function uses the service-role key and bypasses RLS. The browser
-- (anon key) may only INSERT — never read others' rows.
alter table public.generations enable row level security;
alter table public.emails enable row level security;

drop policy if exists "anon insert generations" on public.generations;
create policy "anon insert generations"
  on public.generations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon insert emails" on public.emails;
create policy "anon insert emails"
  on public.emails for insert
  to anon, authenticated
  with check (true);
