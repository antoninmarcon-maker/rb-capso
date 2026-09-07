-- 012 : piece d'identite obligatoire a la signature du contrat (Romain, 07/09/2026 :
-- « quand le locataire signe le contrat, il faut qu'il mette imperativement un fichier
-- avec sa carte d'identite »).
--
-- Choix : le fichier est stocke en base (bytea) et non dans Storage, pour une raison
-- RGPD pratique : la purge automatique est alors un simple DELETE planifie, alors qu'un
-- objet Storage supprime en SQL laisse le fichier physique orphelin. Taille bornee a
-- 5 Mo (le client compresse les photos a 1600 px avant envoi, ~300 Ko).
--
-- Regle d'exigence : un contrat cree par le nouveau /app porte la cle payload
-- 'pid_req' ; sa signature par lien (submit_contract_by_token) est refusee tant qu'aucune
-- piece n'a ete recue. Les contrats crees avant ce deploiement n'ont pas la cle et se
-- signent comme avant (ordre APPLY.md : migration d'abord, frontend ensuite).
--
-- Conservation : 120 jours apres la reception (delai moyen de reservation 41 jours +
-- location + marge), puis suppression par pg_cron chaque nuit. Suppression immediate si
-- le contrat est supprime (on delete cascade).

create table if not exists contract_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  kind text not null check (kind in ('id_recto')),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  data bytea not null,
  created_at timestamptz not null default now(),
  unique (contract_id, kind)
);

comment on table contract_documents is
  'Pieces d''identite des locataires (donnee sensible) : purgees 120 jours apres reception (cron purge-pieces-identite).';

alter table contract_documents enable row level security;

-- Romain (admin) lit et supprime ; personne d'autre ne voit la table. L'ecriture par le
-- locataire passe par la fonction ci-dessous (security definer), jamais en direct.
drop policy if exists "admin all contract_documents" on contract_documents;
create policy "admin all contract_documents" on contract_documents for all
  using ((auth.jwt() ->> 'email') in (select email from admins))
  with check ((auth.jwt() ->> 'email') in (select email from admins));

-- ─────────────────────────────────────────────────────────────────────────────
-- Depot par le locataire (lien ?t=) : remplace la piece precedente du meme type.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function submit_document_by_token(
  p_token text,
  p_kind text,
  p_mime text,
  p_data_b64 text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_bytes bytea;
  v_doc uuid;
begin
  if p_token is null or length(p_token) < 24 then
    raise exception 'token invalide';
  end if;
  if p_kind is distinct from 'id_recto' then
    raise exception 'type de piece inconnu';
  end if;
  if p_mime not in ('image/jpeg','image/png','image/webp','application/pdf') then
    raise exception 'format refuse : photo (JPEG, PNG, WebP) ou PDF';
  end if;

  select id into v_id from contracts
  where access_token = p_token and status = 'pending' and type in ('presentiel','distance')
  limit 1;
  if v_id is null then
    raise exception 'contrat introuvable ou deja signe';
  end if;

  begin
    v_bytes := decode(p_data_b64, 'base64');
  exception when others then
    raise exception 'fichier illisible';
  end;
  if v_bytes is null or length(v_bytes) < 1 then
    raise exception 'fichier vide';
  end if;
  if length(v_bytes) > 5242880 then
    raise exception 'fichier trop lourd (5 Mo maximum)';
  end if;

  insert into contract_documents (contract_id, kind, mime, size_bytes, data)
  values (v_id, p_kind, p_mime, length(v_bytes), v_bytes)
  on conflict (contract_id, kind) do update
    set mime = excluded.mime, size_bytes = excluded.size_bytes, data = excluded.data, created_at = now()
  returning id into v_doc;

  return v_doc;
end;
$$;

-- Le locataire peut savoir si sa piece est deja recue (reprise d'une signature interrompue).
create or replace function has_document_by_token(p_token text, p_kind text)
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from contract_documents d
    join contracts c on c.id = d.contract_id
    where c.access_token = p_token and d.kind = p_kind
  );
$$;

grant execute on function submit_document_by_token(text, text, text, text) to anon, authenticated;
grant execute on function has_document_by_token(text, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Signature par lien : meme fonction que 010, plus l'exigence de la piece pour les
-- contrats qui la demandent (cle payload 'pid_req', ecrite par le nouveau /app).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function submit_contract_by_token(
  p_token text,
  p_locataire_patch jsonb,
  p_paiements text[],
  p_sig text,
  p_sig_date text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_type text;
  v_payload jsonb;
  v_patch jsonb;
begin
  if p_token is null or length(p_token) < 24 then
    raise exception 'token invalide';
  end if;
  if p_sig is null or length(p_sig) < 50 then
    raise exception 'signature requise';
  end if;

  select id, type, payload into v_id, v_type, v_payload
  from contracts
  where access_token = p_token and status = 'pending'
  limit 1;

  if v_id is null then
    raise exception 'contrat introuvable ou deja signe';
  end if;

  -- Liste blanche : on ne retient du patch client que les cles que le locataire
  -- est legitimement autorise a remplir. Toute autre cle (prix, caution,
  -- signature proprietaire, etc.) est silencieusement ignoree.
  v_patch := (
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    from jsonb_each(coalesce(p_locataire_patch, '{}'::jsonb))
    where key in (
      'l_nom','l_pre','l_adr','l_tel','l_mail',
      'l_naiss','l_naiss_l','l_perm','l_perm_d',
      'debut','debut_h','fin','fin_h','lieu',
      's2nom','s2pre','s2tel','s2perm','s2naiss','s2perm_d','s2',
      'cgv_accept'
    )
  );

  if v_type in ('presentiel','distance') then
    -- Conditions d'annulation (010) : exigees pour les contrats qui embarquent le texte.
    if (v_payload ? 'annulation') and coalesce(v_patch->>'cgv_accept', '') <> 'true' then
      raise exception 'acceptation des conditions d''annulation requise';
    end if;
    if coalesce(v_patch->>'cgv_accept', '') = 'true' then
      v_patch := v_patch || jsonb_build_object(
        'cgv_accept', true,
        'cgv_accept_date', to_char(now() at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI')
      );
    else
      v_patch := v_patch - 'cgv_accept';
    end if;
    -- Piece d'identite (012) : exigee pour les contrats crees avec 'pid_req'.
    if (v_payload ? 'pid_req') and not exists (
      select 1 from contract_documents where contract_id = v_id and kind = 'id_recto'
    ) then
      raise exception 'piece d''identite requise avant la signature';
    end if;
  else
    v_patch := v_patch - 'cgv_accept';
  end if;

  v_payload := coalesce(v_payload, '{}'::jsonb) || v_patch;

  if p_paiements is not null and array_length(p_paiements, 1) > 0 then
    v_payload := jsonb_set(v_payload, '{paiements}', to_jsonb(p_paiements));
  end if;

  update contracts
    set payload = v_payload,
        signature_loc = p_sig,
        signature_loc_date = p_sig_date,
        status = 'signed'
  where id = v_id;

  return v_id;
end;
$$;

grant execute on function submit_contract_by_token(text, jsonb, text[], text, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Purge automatique : chaque nuit a 03:15 (UTC), suppression des pieces de plus de
-- 120 jours. pg_cron est disponible sur Supabase (a activer une fois par projet).
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;

create or replace function purge_contract_documents() returns integer
language plpgsql security definer set search_path = public
as $$
declare v_n integer;
begin
  delete from contract_documents where created_at < now() - interval '120 days';
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function purge_contract_documents() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-pieces-identite') then
    perform cron.unschedule('purge-pieces-identite');
  end if;
  perform cron.schedule('purge-pieces-identite', '15 3 * * *', 'select public.purge_contract_documents()');
end;
$$;
