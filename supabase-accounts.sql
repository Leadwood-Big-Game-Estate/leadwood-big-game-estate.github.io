-- ===================================================================
--  Leadwood Tracker — step 2: individual accounts
--
--  Run AFTER supabase.sql, in SQL Editor -> New query -> Run.
--  After this script the "anon" / publishable key alone gives access
--  to nothing: an account is required. Create them in
--  Authentication -> Users -> Add user.
--
--  Also turn OFF public sign-ups:
--  Authentication -> Sign In / Providers -> "Allow new users to sign up".
-- ===================================================================

-- ------------------------------------------------------------------
--  1. Who posted what — filled in by the server, not by the phone
-- ------------------------------------------------------------------
alter table sightings add column if not exists author_id uuid default auth.uid();

-- ------------------------------------------------------------------
--  2. Close anonymous access
-- ------------------------------------------------------------------
revoke all on table sightings from anon;

drop policy if exists "lecture"  on sightings;
drop policy if exists "ecriture" on sightings;
drop policy if exists "maj"      on sightings;
drop policy if exists "read"     on sightings;
drop policy if exists "insert"   on sightings;
drop policy if exists "update"   on sightings;

grant usage on schema public to authenticated;
grant select, insert, update on table sightings to authenticated;

-- Everyone sees everything: that is the point of sharing.
create policy "read" on sightings
  for select to authenticated using (true);

-- You can only post under your own identity.
create policy "insert" on sightings
  for insert to authenticated with check (author_id = auth.uid());

-- You can only change (and soft-delete) your own sightings.
create policy "update" on sightings
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ------------------------------------------------------------------
--  3. Reserve road data, behind authentication
--     Private bucket "cartes": upload reserve.json into it
--     (Storage -> cartes -> Upload file). Signed-in accounts can read
--     it; nobody can write to it except from the dashboard.
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cartes', 'cartes', false)
on conflict (id) do nothing;

drop policy if exists "cartes lecture" on storage.objects;
drop policy if exists "map read"       on storage.objects;
create policy "map read" on storage.objects
  for select to authenticated using (bucket_id = 'cartes');

-- ------------------------------------------------------------------
--  4. Reload the schema exposed by the API
-- ------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ===================================================================
--  Add a guide: Authentication -> Users -> Add user
--    email + password, tick "Auto Confirm User",
--    then add the vehicle to LW_VEHICLES in config.js.
--
--  Remove a guide who leaves: delete the account on the same page.
--  Their past sightings stay in the database.
--
--  Occasional clean-up, to run by hand from time to time:
--    delete from sightings where ts < now() - interval '30 days';
-- ===================================================================
