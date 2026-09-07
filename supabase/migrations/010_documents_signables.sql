-- Trois documents signables : contrat de reservation, etat des lieux de depart,
-- proces-verbal de retour.
--
--   - type 'edl_depart' (le retour existait deja)
--   - parent_id : lien EDL / retour -> contrat (payload.ref_code reste ecrit pour
--     l'affichage, comme le fait deja le retour)
--   - fetch_contract_by_token : projection elargie pour que le locataire puisse
--     telecharger un PDF complet (image de signature du proprietaire, sa propre
--     signature a la reouverture du lien, coordonnees professionnelles de Romain
--     deja publiques sur le site — le numero d'assurance p_ass reste exclu),
--     lignes de tarif (options, frais de service, acompte, solde, TVA), champs
--     d'etat des lieux, acceptation des conditions d'annulation.
--   - submit_contract_by_token : un CONTRAT ne se signe pas sans cgv_accept = true
--     dans le patch ; la date d'acceptation est posee cote serveur, jamais reprise
--     du client. Un etat des lieux (depart/retour) se signe sans.
--
-- Decision de securite assumee (cadrage du 06/09/2026) : l'image de signature du
-- proprietaire sort avec le token du document concerne — le meme secret qui
-- donne deja acces aux donnees personnelles du locataire. Le durcissement de la
-- migration 006 visait le brute-force du code a 4 chiffres, pas cette exposition.
--
-- Idempotent : re-executable sans effet de bord.

alter table contracts drop constraint if exists contracts_type_check;
alter table contracts add constraint contracts_type_check
  check (type in ('presentiel','retour','distance','edl_depart'));

alter table contracts add column if not exists parent_id uuid references contracts(id) on delete set null;
create index if not exists idx_contracts_parent on contracts (parent_id);

-- ─────────────────────────────────────────────────────────────
-- Lecture par token : projection minimisee, elargie aux besoins du PDF locataire
-- et des etats des lieux.
-- ─────────────────────────────────────────────────────────────
create or replace function fetch_contract_by_token(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
stable
as $$
declare
  c contracts%rowtype;
  p jsonb;
begin
  if p_token is null or length(p_token) < 24 then
    return null;
  end if;

  select * into c from contracts where access_token = p_token limit 1;
  if c.id is null then
    return null;
  end if;

  p := coalesce(c.payload, '{}'::jsonb);

  return jsonb_build_object(
    'id',                  c.id,
    'code',                c.code,
    'type',                c.type,
    'vehicle',             c.vehicle,
    'status',              c.status,
    'parent_id',           c.parent_id,
    -- Signature du locataire : la sienne, pour le PDF a la reouverture du lien.
    'signature_loc',       c.signature_loc,
    'signature_loc_date',  c.signature_loc_date,
    'created_at',          c.created_at,
    'payload', (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(p)
      where key in (
        -- Vehicule
        'v_nom','v_marque','v_annee','v_immat',
        -- Proprietaire : nom et coordonnees professionnelles (publiques sur le
        -- site). p_ass (numero d'assurance) reste exclu.
        'p_pre','p_nom','p_adr','p_tel','p_mail',
        -- Modalites / tarifs
        'debut','debut_h','fin','fin_h','duree','lieu','km',
        'pj','stot','red','total','caution','forfait','forfait_extra',
        'options','frais_service','lignes','reglement','tva_mention','annulation',
        -- Paiement : IBAN affiche par l'UI ; banque/titulaire pour le virement.
        'iban','banque','iban_tit',
        -- Prefill des champs locataire (l'admin a pu les pre-remplir)
        'l_nom','l_pre','l_adr','l_tel','l_mail','l_naiss','l_naiss_l','l_perm','l_perm_d',
        -- Second conducteur saisi par le locataire
        's2nom','s2pre','s2tel','s2perm','s2naiss','s2perm_d','s2',
        'paiements',
        -- Signature proprietaire : image ET date (PDF locataire complet)
        'sig_prop','sig_prop_date','slieu',
        -- Acceptation des conditions d'annulation (posee par submit_contract_by_token)
        'cgv_accept','cgv_accept_date',
        -- Etats des lieux (depart et retour)
        'ref_code','equipements','km_dep','km_ret','km_par',
        'carbu','eau','etat','prop','prop_ret','carro','bat','obs',
        'vid_ext','vid_int','vid_note','photos'
      )
    )
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Completion + signature locataire par TOKEN.
-- Liste blanche stricte des cles editables + acceptation des conditions exigee
-- pour un contrat.
-- ─────────────────────────────────────────────────────────────
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

  -- Un contrat ne se signe pas sans acceptation explicite des conditions
  -- d'annulation ; la date est posee ici, jamais reprise du client.
  -- L'exigence ne porte que sur les contrats qui EMBARQUENT le texte des
  -- conditions (cle 'annulation', ecrite par le nouveau frontend) : un contrat
  -- cree avant ce deploiement n'a pas ce texte, son locataire n'a rien a
  -- accepter, et la migration reste applicable avant le merge du frontend
  -- sans bloquer une signature en cours (ordre APPLY.md : migration d'abord).
  if v_type in ('presentiel','distance') then
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

grant execute on function fetch_contract_by_token(text) to anon, authenticated;
grant execute on function submit_contract_by_token(text, jsonb, text[], text, text) to anon, authenticated;
