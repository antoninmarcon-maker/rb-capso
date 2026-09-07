-- Option « materiel » : materiel de camping loue avec la tente de toit (batterie nomade,
-- glaciere, rechaud, table, chaises, toilettes seches, kit de cuisine, vaisselle, cuve a
-- eau, douche solaire, tente de douche), 15 EUR/jour dans la grille de Romain du 07/09/2026.
-- submit_booking (11 arguments) l'accepte ; la fonction est reecrite a l'identique de 009
-- avec ce seul ajout. Le relais a 9 arguments (009) reste valable. Idempotent.

create or replace function submit_booking(
  p_vehicle text,
  p_prenom text,
  p_nom text,
  p_tel text,
  p_email text,
  p_start date,
  p_end date,
  p_notes text,
  p_forfait text,
  p_options jsonb,
  p_estimation_cents integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_opt text;
begin
  if p_vehicle not in ('penelop','peggy','pamela','tente') then
    raise exception 'Invalid vehicle: %', p_vehicle;
  end if;
  if p_end <= p_start then
    raise exception 'end_date must be after start_date';
  end if;

  -- Options : tableau JSON d'ids connus, rien d'autre. Un client qui bricole
  -- le payload ne peut pas injecter de texte libre dans la colonne.
  if p_options is null or jsonb_typeof(p_options) <> 'array' then
    raise exception 'options must be a JSON array';
  end if;
  for v_opt in select jsonb_array_elements_text(p_options) loop
    if v_opt not in ('surf','paddle','kayak','linge','materiel') then
      raise exception 'Invalid option: %', v_opt;
    end if;
  end loop;
  if p_estimation_cents is not null and p_estimation_cents < 0 then
    raise exception 'estimation_cents must be >= 0';
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

  insert into reservations (vehicle, prenom, nom, tel, email, start_date, end_date, status, notes, forfait, options, estimation_cents)
  values (p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, 'pending', p_notes, p_forfait, p_options, p_estimation_cents)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function submit_booking(text, text, text, text, text, date, date, text, text, jsonb, integer) to anon, authenticated;
