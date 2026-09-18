-- ===================================================================
--  Leadwood Tracker — partage des signalements entre véhicules
--  À coller dans Supabase : SQL Editor → New query → Run
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

alter table sightings enable row level security;

-- Accès ouvert à la clé « anon public ». Cette clé n'est pas publiée
-- dans le dépôt GitHub : elle ne vit que sur les téléphones configurés.
-- Si elle circule hors de l'équipe, régénérez-la dans Supabase
-- (Settings → API → Reset) puis reconfigurez les appareils.
drop policy if exists "lecture" on sightings;
drop policy if exists "ecriture" on sightings;
drop policy if exists "maj" on sightings;

create policy "lecture"  on sightings for select to anon using (true);
create policy "ecriture" on sightings for insert to anon with check (true);
create policy "maj"      on sightings for update to anon using (true) with check (true);

-- Ménage : les signalements de plus de 30 jours ne servent plus à rien.
-- (facultatif — à lancer à la main de temps en temps)
-- delete from sightings where ts < now() - interval '30 days';
