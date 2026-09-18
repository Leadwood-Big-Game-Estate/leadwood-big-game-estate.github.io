-- ===================================================================
--  Leadwood Tracker — partage des signalements entre véhicules
--  À coller dans Supabase : SQL Editor → New query → Run
--
--  Ce script fonctionne quel que soit le réglage « Automatically
--  expose new tables » choisi à la création du projet : les
--  privilèges nécessaires sont accordés explicitement plus bas.
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

-- La relève ne demande que ce qui a changé depuis le dernier passage.
create index if not exists sightings_updated_at_idx on sightings (updated_at);

-- ------------------------------------------------------------------
--  1. Privilèges : rendre la table visible par l'API REST
-- ------------------------------------------------------------------
grant usage on schema public to anon;
grant select, insert, update on table sightings to anon;

-- ------------------------------------------------------------------
--  2. Sécurité au niveau des lignes
--     Sans RLS activé, la table serait ouverte à tout le monde.
--     Avec RLS et sans politique, elle serait fermée à tout le monde.
--     Les trois politiques ci-dessous ouvrent exactement ce qu'il faut.
-- ------------------------------------------------------------------
alter table sightings enable row level security;

drop policy if exists "lecture"  on sightings;
drop policy if exists "ecriture" on sightings;
drop policy if exists "maj"      on sightings;

create policy "lecture"  on sightings for select to anon using (true);
create policy "ecriture" on sightings for insert to anon with check (true);
create policy "maj"      on sightings for update to anon using (true) with check (true);

-- Remarque : il n'y a volontairement pas de politique DELETE.
-- L'application marque les signalements comme supprimés (colonne
-- « deleted ») au lieu de les effacer, sinon ils réapparaîtraient
-- chez les autres véhicules à la relève suivante.

-- ------------------------------------------------------------------
--  3. Forcer PostgREST à relire le schéma (évite un 404 transitoire)
-- ------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ------------------------------------------------------------------
--  Ménage occasionnel — à lancer à la main de temps en temps.
-- ------------------------------------------------------------------
-- delete from sightings where ts < now() - interval '30 days';
