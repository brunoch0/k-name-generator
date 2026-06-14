-- K-Name — human-touch (hand-brushed) request capture

create table if not exists public.handcraft_requests (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  email          text not null,
  generation_id  uuid references public.generations (id) on delete set null,
  shared         boolean not null default false,
  status         text not null default 'pending'
);

create index if not exists handcraft_created_at_idx on public.handcraft_requests (created_at desc);
create index if not exists handcraft_status_idx on public.handcraft_requests (status);

alter table public.handcraft_requests enable row level security;

-- The browser (anon key) may only create a request and flag it shared.
drop policy if exists "anon insert handcraft" on public.handcraft_requests;
create policy "anon insert handcraft"
  on public.handcraft_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon mark handcraft shared" on public.handcraft_requests;
create policy "anon mark handcraft shared"
  on public.handcraft_requests for update
  to anon, authenticated
  using (true)
  with check (true);
