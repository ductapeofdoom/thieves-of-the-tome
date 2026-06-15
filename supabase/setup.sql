-- ============================================================================
-- Thieves of the Tome — "The Table" multiplayer backend (Supabase / Postgres)
-- ============================================================================
-- Run this in the Supabase dashboard → SQL Editor. It is safe to re-run:
-- every statement is idempotent. Sections 1–4 set up the synced Tome pile,
-- section 5 the shared Tomeality, and section 6 the automatic cleanup.
--
-- The publishable (anon) key in the app is protected by the Row Level Security
-- policies below — room codes are the only access control, and no personal data
-- is stored.
-- ============================================================================

-- 1. Table: one row per Tome on a given room's table -------------------------
create table if not exists public.table_books (
  id           bigint generated always as identity primary key,
  room         text    not null,
  gutenberg_id integer not null,
  title        text,
  author       text,
  cover        text,
  url          text,
  stolen_by    text,
  created_at   timestamptz not null default now(),
  unique (room, gutenberg_id)
);

create index if not exists table_books_room_idx on public.table_books (room);

-- 2. Row Level Security -------------------------------------------------------
alter table public.table_books enable row level security;

drop policy if exists "table_books select" on public.table_books;
drop policy if exists "table_books insert" on public.table_books;
drop policy if exists "table_books update" on public.table_books;
drop policy if exists "table_books delete" on public.table_books;

create policy "table_books select" on public.table_books
  for select to anon, authenticated using (true);
create policy "table_books insert" on public.table_books
  for insert to anon, authenticated with check (true);
create policy "table_books update" on public.table_books
  for update to anon, authenticated using (true) with check (true);
create policy "table_books delete" on public.table_books
  for delete to anon, authenticated using (true);

-- 3. Grants (RLS gates rows; grants allow the operation at all) ---------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.table_books to anon, authenticated;

-- 4. Realtime: stream changes to subscribed clients --------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'table_books'
  ) then
    execute 'alter publication supabase_realtime add table public.table_books';
  end if;
end $$;

-- ============================================================================
-- 5. Shared Tomeality: the public setting the GM introduces to the room -------
-- ============================================================================
-- One row per room. The GM publishes the Tomeality + Escape Condition here so
-- every player can see it. No secret data (spell effects stay in the GM's own
-- copy), so the same permissive, room-code-gated policies apply.
create table if not exists public.room_tomeality (
  room        text primary key,
  genre       text,
  magic       text,
  white_guard text,
  library     text,
  escape      text,
  updated_at  timestamptz not null default now()
);

alter table public.room_tomeality enable row level security;

drop policy if exists "room_tomeality select" on public.room_tomeality;
drop policy if exists "room_tomeality insert" on public.room_tomeality;
drop policy if exists "room_tomeality update" on public.room_tomeality;
drop policy if exists "room_tomeality delete" on public.room_tomeality;

create policy "room_tomeality select" on public.room_tomeality
  for select to anon, authenticated using (true);
create policy "room_tomeality insert" on public.room_tomeality
  for insert to anon, authenticated with check (true);
create policy "room_tomeality update" on public.room_tomeality
  for update to anon, authenticated using (true) with check (true);
create policy "room_tomeality delete" on public.room_tomeality
  for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.room_tomeality to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'room_tomeality'
  ) then
    execute 'alter publication supabase_realtime add table public.room_tomeality';
  end if;
end $$;

-- ============================================================================
-- 6. Automatic cleanup of stale rooms (every hour, drop rooms idle >24h) ------
-- ============================================================================
-- Requires the pg_cron extension. On Supabase you can also enable it via
-- Database → Extensions → "pg_cron". The create extension below is allowlisted.
create extension if not exists pg_cron;

-- Delete whole rooms whose most recent activity is older than 24 hours.
-- (Keyed on the room's newest row so an in-progress room is never split.)
create or replace function public.purge_old_table_books() returns void
language sql
as $$
  delete from public.table_books
  where room in (
    select room
    from public.table_books
    group by room
    having max(created_at) < now() - interval '24 hours'
  );
  delete from public.room_tomeality
  where updated_at < now() - interval '24 hours';
$$;

-- (Re)schedule the hourly job, replacing any existing one with this name.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-tott-rooms') then
    perform cron.unschedule('purge-tott-rooms');
  end if;
end $$;

select cron.schedule(
  'purge-tott-rooms',
  '17 * * * *',                              -- at :17 past every hour
  $$ select public.purge_old_table_books() $$
);
