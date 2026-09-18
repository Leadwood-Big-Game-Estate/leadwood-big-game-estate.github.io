-- ===================================================================
--  Leadwood Tracker — étape 2 : comptes individuels
--
--  À exécuter APRÈS supabase.sql, dans SQL Editor → New query → Run.
--  Après ce script, la clé « anon » seule ne donne plus accès à rien :
--  il faut un compte. Créez-les dans Authentication → Users → Add user.
-- ===================================================================

-- ------------------------------------------------------------------
--  1. Qui a posté quoi — rempli par le serveur, pas par le téléphone
-- ------------------------------------------------------------------
alter table sightings add column if not exists author_id uuid default auth.uid();

-- ------------------------------------------------------------------
--  2. Fermer l'accès anonyme
-- ------------------------------------------------------------------
revoke all on table sightings from anon;

drop policy if exists "lecture"  on sightings;
drop policy if exists "ecriture" on sightings;
drop policy if exists "maj"      on sightings;

grant usage on schema public to authenticated;
grant select, insert, update on table sightings to authenticated;

-- Tout le monde voit tout : c'est l'intérêt du partage.
create policy "lecture" on sightings
  for select to authenticated using (true);

-- On ne poste que sous sa propre identité.
create policy "ecriture" on sightings
  for insert to authenticated with check (author_id = auth.uid());

-- On ne modifie et on ne supprime que ses propres signalements.
-- (La suppression reste logique : colonne « deleted ».)
create policy "maj" on sightings
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ------------------------------------------------------------------
--  3. La carte de la réserve, derrière l'authentification
--     Storage → New bucket → nom « cartes » → décocher « Public bucket ».
--     Puis y téléverser le PDF sous le nom exact « carte.pdf ».
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cartes', 'cartes', false)
on conflict (id) do nothing;

drop policy if exists "cartes lecture" on storage.objects;
create policy "cartes lecture" on storage.objects
  for select to authenticated using (bucket_id = 'cartes');

-- ------------------------------------------------------------------
--  4. Rafraîchir le schéma exposé par l'API
-- ------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ===================================================================
--  Créer un guide : Authentication → Users → Add user
--    e-mail + mot de passe, et cocher « Auto Confirm User »
--  Pour que son nom de véhicule s'affiche sur ses signalements,
--  renseigner les métadonnées du compte (Raw User Meta Data) :
--    { "vehicule": "Land Cruiser 2 — Sipho" }
--  Sans cette métadonnée, l'adresse e-mail est utilisée à la place.
--
--  Désactiver un guide qui quitte la réserve : supprimer son compte
--  dans la même page. Ses signalements passés restent en base.
-- ===================================================================
