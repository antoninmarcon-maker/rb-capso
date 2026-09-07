-- Options (surf, paddle, canoe-kayak, kit linge) et estimation vue par le client.
--
-- Le forfait km existait deja (004). On ajoute :
--   - reservations.options          : tableau JSON d'ids d'options cochees
--                                     (['surf','linge']), jamais null
--   - reservations.estimation_cents : le total estime affiche au client au
--                                     moment de la demande, en centimes entiers
--                                     (convention du depot, cf. 007 : jamais en
--                                     virgule flottante). Sert a Romain pour
--                                     savoir ce que le client a vu.
--   - submit_booking a 11 arguments, TOUS requis (aucun defaut) : Postgres ne
--     peut donc pas confondre cet appel avec l'ancienne signature.
--   - l'ancienne signature a 9 arguments est CONSERVEE comme simple relais.
--     Entre l'application de cette migration et le deploiement Vercel du
--     nouveau frontend, le site en prod appelle encore la version a 9 args :
--     sans ce relais, toute demande de reservation echouerait pendant cette
--     fenetre. Elle pourra etre supprimee par une migration ulterieure, une
--     fois le frontend deploye et verifie.
--
-- Idempotent : re-executable sans effet de bord.

alter table reservations add column if not exists options jsonb not null default '[]'::jsonb;
alter table reservations add column if not exists estimation_cents integer;

alter table reservations drop constraint if exists reservations_options_array;
alter table reservations add constraint reservations_options_array
  check (jsonb_typeof(options) = 'array');

alter table reservations drop constraint if exists reservations_estimation_positive;
alter table reservations add constraint reservations_estimation_positive
  check (estimation_cents is null or estimation_cents >= 0);

-- ─────────────────────────────────────────────────────────────
-- Nouvelle signature (11 arguments, aucun defaut).
-- Meme logique que 005 (chevauchements) + validation des options.
-- ─────────────────────────────────────────────────────────────
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
    if v_opt not in ('surf','paddle','kayak','linge') then
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

-- ─────────────────────────────────────────────────────────────
-- Relais : ancienne signature (9 arguments), pour le frontend deja en prod.
-- La logique n'existe qu'une fois, dans la version a 11 arguments.
-- ─────────────────────────────────────────────────────────────
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
language sql
security definer
set search_path = public
as $$
  select submit_booking(p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, p_notes, p_forfait, '[]'::jsonb, null::integer);
$$;

grant execute on function submit_booking(text, text, text, text, text, date, date, text, text, jsonb, integer) to anon, authenticated;
grant execute on function submit_booking(text, text, text, text, text, date, date, text, text) to anon, authenticated;
