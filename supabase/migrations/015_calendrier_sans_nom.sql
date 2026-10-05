-- 015 : le calendrier public n'expose plus le prenom des clients.
--
-- Antonin : « sur le site pas besoin de mettre le nom de la personne qui a reserve dans
-- le calendrier, c'est pas bien en terme de privacy ». La vue reservations_public (004)
-- renvoyait `prenom` a n'importe quel visiteur (lisible dans les requetes reseau).
-- On la recree sans cette colonne ; create or replace ne sait pas retirer une colonne,
-- d'ou drop view puis create view.
--
-- Ordre : migration avant ou apres le merge du frontend, indifferemment (le front lit
-- select('*') et n'utilise plus prenom ; web/app ne lit que start_date,end_date).
-- Rollback : recreer la vue de 004 :
--   drop view if exists reservations_public;
--   create view reservations_public as
--     select id, vehicle, prenom, start_date, end_date, status, forfait
--     from reservations where status != 'annulee';
--   grant select on reservations_public to anon, authenticated;

drop view if exists reservations_public;

create view reservations_public as
  select id, vehicle, start_date, end_date, status, forfait
  from reservations
  where status != 'annulee';

grant select on reservations_public to anon, authenticated;
