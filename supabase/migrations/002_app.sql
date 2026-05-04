-- RB-CapSO app schema : contrats + settings + RPC signature locataire.
-- Étend 001_init.sql (admins table déjà présente).

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('presentiel','retour','distance')),
  owner_email text not null,
  vehicle text check (vehicle is null or vehicle in ('penelop','peggy','pamela','tente')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','signed','cancelled','completed')),
  signature_loc text,
  signature_loc_date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_contracts_code on contracts (code);
create index if not exists idx_contracts_owner_created on contracts (owner_email, created_at desc);

create table if not exists owner_settings (
  email text primary key,
  prop jsonb default '{}'::jsonb,
  dprop jsonb default '{}'::jsonb,
  dpay jsonb default '{}'::jsonb,
  vehicles jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Triggers : updated_at
-- ─────────────────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_contracts_updated on contracts;
create trigger trg_contracts_updated
  before update on contracts
  for each row execute function set_updated_at();

drop trigger if exists trg_settings_updated on owner_settings;
create trigger trg_settings_updated
  before update on owner_settings
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RPC : lecture du contrat par code (anon-callable, security definer
-- pour bypass RLS et empêcher l'énumération de la table)
-- ─────────────────────────────────────────────────────────────

create or replace function fetch_contract_by_code(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
stable
as $$
declare result jsonb;
begin
  if p_code is null or length(p_code) < 4 then
    return null;
  end if;
  select to_jsonb(c.*) into result
  from contracts c
  where c.code = p_code
  limit 1;
  return result;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC : signature locataire (anon-callable, security definer)
-- Transition pending → signed sur match du code uniquement.
-- ─────────────────────────────────────────────────────────────

create or replace function submit_locataire_signature(
  p_code text,
  p_sig text,
  p_sig_date text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if p_sig is null or length(p_sig) < 50 then
    raise exception 'signature requise';
  end if;
  update contracts
    set signature_loc = p_sig,
        signature_loc_date = p_sig_date,
        status = 'signed'
  where code = p_code and status = 'pending'
  returning id into v_id;
  if v_id is null then
    raise exception 'contrat introuvable ou déjà signé';
  end if;
  return v_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

alter table contracts enable row level security;
alter table owner_settings enable row level security;

-- Anon : aucune policy (pas de SELECT/INSERT/UPDATE direct).
-- Lecture publique passe par fetch_contract_by_code(p_code), update via submit_locataire_signature.

-- Admin : RW complet
drop policy if exists "admin all contracts" on contracts;
create policy "admin all contracts" on contracts for all
  using ((auth.jwt() ->> 'email') in (select email from admins))
  with check ((auth.jwt() ->> 'email') in (select email from admins));

drop policy if exists "admin all owner_settings" on owner_settings;
create policy "admin all owner_settings" on owner_settings for all
  using ((auth.jwt() ->> 'email') in (select email from admins))
  with check ((auth.jwt() ->> 'email') in (select email from admins));

-- ─────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────

grant execute on function fetch_contract_by_code(text) to anon, authenticated;
grant execute on function submit_locataire_signature(text, text, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Seed : ligne owner_settings vide pour l'admin
-- ─────────────────────────────────────────────────────────────

insert into owner_settings (email) values ('rb.concept.capso@gmail.com')
on conflict (email) do nothing;
