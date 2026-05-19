-- Unification : tout passe par la table reservations.
--   1. Ajout du véhicule 'pamela'
--   2. Ajout du champ forfait (forfait kilométrique souhaité)
--   3. Mise à jour des contraintes CHECK
--   4. Mise à jour du submit_booking RPC pour accepter p_forfait
--   5. Mise à jour de la vue reservations_public pour exposer forfait

-- 1+3. Vehicle constraint : ajouter pamela
alter table reservations drop constraint if exists reservations_vehicle_check;
alter table reservations add constraint reservations_vehicle_check
  check (vehicle in ('penelop','peggy','pamela','tente'));

alter table availability_blocks drop constraint if exists availability_blocks_vehicle_check;
alter table availability_blocks add constraint availability_blocks_vehicle_check
  check (vehicle in ('penelop','peggy','pamela','tente'));

-- 2. Forfait column
alter table reservations add column if not exists forfait text;

-- 5. Vue publique : ajouter forfait (utile pour la légende client si besoin futur)
create or replace view reservations_public as
select id, vehicle, prenom, start_date, end_date, status, forfait
from reservations
where status != 'annulee';

grant select on reservations_public to anon, authenticated;

-- 4. RPC : accepte forfait
drop function if exists submit_booking(text, text, text, text, text, date, date, text);

create or replace function submit_booking(
  p_vehicle text,
  p_prenom text,
  p_nom text,
  p_tel text,
  p_email text,
  p_start date,
  p_end date,
  p_notes text default null,
  p_forfait text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_vehicle not in ('penelop','peggy','pamela','tente') then
    raise exception 'Invalid vehicle: %', p_vehicle;
  end if;
  if p_end <= p_start then
    raise exception 'end_date must be after start_date';
  end if;
  insert into reservations (vehicle, prenom, nom, tel, email, start_date, end_date, status, notes, forfait)
  values (p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, 'pending', p_notes, p_forfait)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function submit_booking(text, text, text, text, text, date, date, text, text) to anon, authenticated;
