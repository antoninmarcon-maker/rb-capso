-- Empeche les reservations qui chevauchent une reservation deja option/confirmee/completee
-- ou un blocage d'indisponibilite. Les demandes 'pending' ne bloquent pas (Romain pourra
-- arbitrer entre plusieurs demandes sur les memes dates avant d'en confirmer une).

drop function if exists submit_booking(text, text, text, text, text, date, date, text, text);

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

  -- Conflit avec une reservation officialisee (option/confirmee/completee)
  if exists (
    select 1 from reservations
    where vehicle = p_vehicle
      and status in ('option','confirmee','completee')
      and daterange(start_date, end_date, '[)') && daterange(p_start, p_end, '[)')
  ) then
    raise exception 'Dates indisponibles : chevauchement avec une reservation deja confirmee'
      using errcode = 'DATES';
  end if;

  -- Conflit avec un blocage admin
  if exists (
    select 1 from availability_blocks
    where vehicle = p_vehicle
      and daterange(start_date, end_date, '[)') && daterange(p_start, p_end, '[)')
  ) then
    raise exception 'Dates indisponibles : blocage admin sur ce vehicule'
      using errcode = 'DATES';
  end if;

  insert into reservations (vehicle, prenom, nom, tel, email, start_date, end_date, status, notes, forfait)
  values (p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, 'pending', p_notes, p_forfait)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function submit_booking(text, text, text, text, text, date, date, text, text) to anon, authenticated;
