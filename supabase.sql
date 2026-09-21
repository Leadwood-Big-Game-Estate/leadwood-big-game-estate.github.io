-- ===================================================================
--  Leadwood Tracker — step 1: shared sightings table
--  Paste in Supabase: SQL Editor -> New query -> Run
--
--  Works whatever "Automatically expose new tables" setting was chosen
--  when the project was created: the required privileges are granted
--  explicitly below.
-- ===================================================================

create table if not exists sightings (
  id         uuid primary key,
  animal     text not null,
  ts         timestamptz not null,
  lat        double precision not null,
  lng        double precision not null,
  acc        integer,
  author     text,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Each pull only asks for what changed since the previous one.
create index if not exists sightings_updated_at_idx on sightings (updated_at);

-- ------------------------------------------------------------------
--  1. Privileges: make the table visible to the REST API
-- ------------------------------------------------------------------
grant usage on schema public to anon;
grant select, insert, update on table sightings to anon;

-- ------------------------------------------------------------------
--  2. Row-level security
--     Without RLS the table would be open to everyone; with RLS and
--     no policy it would be closed to everyone. These policies open
--     exactly what is needed. (Step 2 replaces them with per-account
--     policies.)
-- ------------------------------------------------------------------
alter table sightings enable row level security;

drop policy if exists "lecture"  on sightings;
drop policy if exists "ecriture" on sightings;
drop policy if exists "maj"      on sightings;
drop policy if exists "read"     on sightings;
drop policy if exists "insert"   on sightings;
drop policy if exists "update"   on sightings;

create policy "read"   on sightings for select to anon using (true);
create policy "insert" on sightings for insert to anon with check (true);
create policy "update" on sightings for update to anon using (true) with check (true);

-- Note: there is deliberately no DELETE policy. The app marks sightings
-- as deleted (column "deleted") instead of erasing them, otherwise they
-- would come back on the other vehicles at the next pull.

-- ------------------------------------------------------------------
--  3. Make PostgREST reload the schema (avoids a transient 404)
-- ------------------------------------------------------------------
notify pgrst, 'reload schema';
