-- RB-CapSO schema (vans : penelop, peggy, tente)
-- Modèle de données aligné sur les HTMLs de Romain.

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  vehicle text not null check (vehicle in ('penelop', 'peggy', 'tente')),
  prenom text,
  nom text,
  tel text,
  email text,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('pending','option','confirmee','annulee','completee')),
  notes text,
  created_at timestamptz default now(),
  constraint reservations_dates check (end_date > start_date)
);

create table if not exists availability_blocks (
  id uuid primary key default gen_random_uuid(),
  vehicle text not null check (vehicle in ('penelop', 'peggy', 'tente')),
  start_date date not null,
  end_date date not null,
  reason text,
  source text not null default 'manual' check (source in ('manual','yescapa')),
  created_at timestamptz default now(),
  constraint blocks_dates check (end_date > start_date)
);

create table if not exists admins (
  email text primary key,
  created_at timestamptz default now()
);

create index if not exists idx_reservations_vehicle_dates on reservations (vehicle, start_date, end_date);
create index if not exists idx_availability_vehicle_dates on availability_blocks (vehicle, start_date, end_date);

-- ─────────────────────────────────────────────────────────────
-- Vue publique (filtre les PII)
-- Le visiteur lit cette vue ; l'admin lit la table directement.
-- ─────────────────────────────────────────────────────────────

create or replace view reservations_public as
select id, vehicle, prenom, start_date, end_date, status
from reservations
where status != 'annulee';

-- ─────────────────────────────────────────────────────────────
-- RPC pour insertion par anon (réservation visiteur)
-- security definer = bypass RLS, force status = pending
-- ─────────────────────────────────────────────────────────────

create or replace function submit_booking(
  p_vehicle text,
  p_prenom text,
  p_nom text,
  p_tel text,
  p_email text,
  p_start date,
  p_end date,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_vehicle not in ('penelop', 'peggy', 'tente') then
    raise exception 'Invalid vehicle: %', p_vehicle;
  end if;
  if p_end <= p_start then
    raise exception 'end_date must be after start_date';
  end if;
  insert into reservations (vehicle, prenom, nom, tel, email, start_date, end_date, status, notes)
  values (p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, 'pending', p_notes)
  returning id into v_id;
  return v_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

alter table reservations enable row level security;
alter table availability_blocks enable row level security;
alter table admins enable row level security;

-- Anon : aucune politique sur reservations (pas de SELECT direct)
-- Anon lit via reservations_public (vue, security invoker default false)

-- Anon : SELECT public sur availability_blocks
drop policy if exists "public read blocks" on availability_blocks;
create policy "public read blocks" on availability_blocks for select using (true);

-- Admin : tout sur reservations
drop policy if exists "admin all reservations" on reservations;
create policy "admin all reservations" on reservations for all
  using ((auth.jwt() ->> 'email') in (select email from admins))
  with check ((auth.jwt() ->> 'email') in (select email from admins));

-- Admin : tout sur availability_blocks
drop policy if exists "admin all blocks" on availability_blocks;
create policy "admin all blocks" on availability_blocks for all
  using ((auth.jwt() ->> 'email') in (select email from admins))
  with check ((auth.jwt() ->> 'email') in (select email from admins));

-- Admin : SELECT sur sa propre ligne admin (suffit pour vérifier le statut)
drop policy if exists "admin self read" on admins;
create policy "admin self read" on admins for select
  using (email = (auth.jwt() ->> 'email'));

-- ─────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────

grant select on reservations_public to anon, authenticated;
grant execute on function submit_booking(text, text, text, text, text, date, date, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Seed
-- ─────────────────────────────────────────────────────────────

insert into admins (email) values ('rb.concept.capso@gmail.com')
on conflict (email) do nothing;
