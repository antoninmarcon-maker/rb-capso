-- 013 : le prix du contrat suit les dates et creneaux choisis par le locataire.
--
-- Romain, 27/09/2026 : « quand le locataire modifie les elements arrivee matin ou
-- apres-midi, ca ne modifie pas le prix ». Sur le lien de signature (?t=), le locataire
-- peut changer ses dates et ses creneaux ; submit_contract_by_token les enregistrait
-- mais gardait la duree, les lignes et le total calcules par Romain.
--
-- Le locataire ne peut toujours pas ecrire un prix (liste blanche inchangee) : la base
-- recalcule elle-meme a partir des nouvelles dates. Le prix/jour, le forfait km, les
-- options, les frais de service, l'assurance et la reduction restent ceux de Romain.
-- Regle de duree identique a calcDu (/app) : jours calendaires, moins une demi-journee
-- pour un depart l'apres-midi et une pour un retour le matin, minimum 0,5.
-- Le meme calcul existe cote client (prixSelonDates, bloc « PRIX LOCATAIRE » de
-- web/app/index.html) pour l'affichage ; web/prix-locataire.test.js verifie les deux.
--
-- A appliquer AVANT le merge du frontend (SQL Editor, compte de Romain). Rollback :
-- rejouer submit_contract_by_token de 012 puis
-- drop function recalcul_prix_locataire(jsonb); drop function jours_location(text,text,text,text);

-- Duree facturee, dates 'JJ/MM/AAAA'. 0 = dates absentes ou incoherentes.
create or replace function jours_location(p_debut text, p_debut_h text, p_fin text, p_fin_h text)
returns numeric
language plpgsql immutable set search_path = public
as $$
declare
  a date;
  b date;
  j numeric;
begin
  if coalesce(p_debut, '') !~ '^\d{2}/\d{2}/\d{4}$' or coalesce(p_fin, '') !~ '^\d{2}/\d{2}/\d{4}$' then
    return 0;
  end if;
  begin
    a := to_date(p_debut, 'DD/MM/YYYY');
    b := to_date(p_fin, 'DD/MM/YYYY');
  exception when others then
    return 0;
  end;
  if b < a then
    return 0;
  end if;
  j := (b - a) + 1;
  if position('Après' in coalesce(p_debut_h, '')) > 0 then j := j - 0.5; end if;
  if position('Matin' in coalesce(p_fin_h, '')) > 0 then j := j - 0.5; end if;
  return greatest(0.5, j);
end;
$$;

-- Payload du contrat avec duree, lignes, sous-total et total recalcules pour ses dates.
-- Rend le payload intact s'il manque de quoi calculer (prix/jour, dates, ligne location).
-- Deux formes de contrat :
--   presentiel (cle 'lignes') : chaque ligne proportionnelle a la duree est remise a
--     l'echelle (location, forfait km, options a la journee) ; frais de service,
--     assurance et kit linge (option a prix fixe) ne bougent pas ;
--   distance (sans 'lignes') : sous-total = jours x (prix/jour + forfait km), comme dCalcT.
-- Montants en centimes entiers ; total = somme - reduction, jamais negatif.
create or replace function recalcul_prix_locataire(d jsonb)
returns jsonb
language plpgsql immutable set search_path = public
as $$
declare
  j numeric;
  j0 numeric;
  pj numeric;
  pjc numeric;
  red numeric := 0;
  fe numeric := 0;
  loc_cents numeric;
  n_loc int;
  c numeric;
  somme numeric := 0;
  hors numeric := 0;
  l jsonb;
  lignes jsonb := '[]'::jsonb;
  duree text;
begin
  if d is null or coalesce(d->>'pj', '') !~ '^\d+(\.\d+)?$' then
    return d;
  end if;
  pj := (d->>'pj')::numeric;
  pjc := round(pj * 100);
  j := jours_location(d->>'debut', d->>'debut_h', d->>'fin', d->>'fin_h');
  if j = 0 or pjc <= 0 then
    return d;
  end if;
  if coalesce(d->>'red', '') ~ '^\d+(\.\d+)?$' then
    red := round((d->>'red')::numeric * 100);
  end if;
  duree := trim_scale(j)::text || ' j';

  if jsonb_typeof(d->'lignes') is distinct from 'array' or jsonb_array_length(d->'lignes') = 0 then
    if coalesce(d->>'forfait_extra', '') ~ '^\d+(\.\d+)?$' then
      fe := round((d->>'forfait_extra')::numeric * 100);
    end if;
    -- Duree inchangee : on garde les montants de Romain (pas d'ecart d'arrondi).
    if coalesce(d->>'stot', '') ~ '^\d+(\.\d+)?$'
       and round((d->>'stot')::numeric * 100 / (pjc + fe) * 2) / 2 = j then
      return d;
    end if;
    c := round(j * (pjc + fe));
    return d || jsonb_build_object(
      'duree', duree,
      'stot', trim_scale(c / 100)::text,
      'total', trim_scale(greatest(0, c - red) / 100)::text
    );
  end if;

  select count(*), min((x->>'cents')::numeric) into n_loc, loc_cents
  from jsonb_array_elements(d->'lignes') x
  where x->>'id' = 'location';
  if n_loc <> 1 or loc_cents is null then
    return d;
  end if;
  j0 := round(loc_cents / pjc * 2) / 2;
  if j0 <= 0 or j0 = j then
    return d;
  end if;

  for l in select value from jsonb_array_elements(d->'lignes') loop
    if l->>'id' = 'location' then
      c := round(j * pjc);
      l := jsonb_build_object(
        'id', 'location',
        'l', trim_scale(j)::text || ' jour' || case when j > 1 then 's' else '' end || ' × ' || trim_scale(pj)::text || ' €',
        'cents', c
      );
    elsif l->>'id' in ('service', 'assurance', 'linge') then
      c := (l->>'cents')::numeric;
    else
      c := round((l->>'cents')::numeric * j / j0);
      l := jsonb_set(l, '{cents}', to_jsonb(c));
    end if;
    somme := somme + c;
    if l->>'id' in ('service', 'assurance') then
      hors := hors + c;
    end if;
    lignes := lignes || jsonb_build_array(l);
  end loop;

  return d || jsonb_build_object(
    'duree', duree,
    'lignes', lignes,
    'stot', trim_scale((somme - hors) / 100)::text,
    'total', trim_scale(greatest(0, somme - red) / 100)::text
  );
end;
$$;

-- Fonctions internes : appelees par submit_contract_by_token (security definer), jamais
-- directement par le navigateur.
revoke execute on function jours_location(text, text, text, text) from public, anon, authenticated;
revoke execute on function recalcul_prix_locataire(jsonb) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Signature par lien : meme fonction que 012, plus le recalcul du prix.
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

  -- Prix (013) : les dates et creneaux du locataire changent la duree, donc le prix.
  if v_type in ('presentiel','distance') then
    v_payload := recalcul_prix_locataire(v_payload);
  end if;

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
