-- Securisation de l'acces aux contrats.
--
-- Contexte des failles corrigees :
--   1. Le code a 4 chiffres etait l'unique secret protegeant des PII completes
--      (9000 combinaisons, brute-forcable en quelques minutes).
--   2. fetch_contract_by_code renvoyait to_jsonb(c.*) = la ligne entiere
--      (pieces d'identite, permis, signatures, adresses, email proprietaire).
--   3. submit_contract_by_locataire fusionnait un patch jsonb arbitraire dans
--      le payload sans liste blanche = le locataire pouvait ecraser prix/caution.
--
-- Strategie :
--   - Ajout d'un access_token a forte entropie (16 octets hex = 128 bits).
--   - Le code a 4 chiffres reste UNIQUEMENT un libelle humain affichable,
--     jamais un secret d'authentification.
--   - Nouveau RPC fetch_contract_by_token qui renvoie une projection MINIMISEE
--     (uniquement les champs dont l'UI locataire a besoin).
--   - DROP de fetch_contract_by_code et submit_locataire_signature : plus aucune
--     surface d'attaque basee sur le code a 4 chiffres.
--   - submit_contract_by_locataire reecrit avec une liste blanche de cles et
--     une recherche par token au lieu du code.
--
-- Idempotent autant que possible (re-execution sans effet de bord).

-- pgcrypto fournit gen_random_bytes() (deja active en 001_init.sql, on s'assure).
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. Colonne access_token + backfill + contrainte + index unique
-- ─────────────────────────────────────────────────────────────

alter table contracts add column if not exists access_token text;

-- Backfill des lignes existantes (token unique par ligne).
update contracts
  set access_token = encode(gen_random_bytes(16), 'hex')
  where access_token is null;

-- Defaut pour toutes les nouvelles lignes (le frontend n'a plus a le generer,
-- mais peut quand meme en fournir un : le defaut sert de filet de securite).
alter table contracts alter column access_token set default encode(gen_random_bytes(16), 'hex');
alter table contracts alter column access_token set not null;

create unique index if not exists idx_contracts_access_token on contracts (access_token);

-- ─────────────────────────────────────────────────────────────
-- 2. Suppression des RPC bases sur le code a 4 chiffres
--    (plus aucune cible pour le brute-force).
-- ─────────────────────────────────────────────────────────────

drop function if exists fetch_contract_by_code(text);
drop function if exists submit_locataire_signature(text, text, text);

-- ─────────────────────────────────────────────────────────────
-- 3. RPC : lecture du contrat par token, projection MINIMISEE.
--    security definer pour bypasser RLS, stable, search_path fige.
--    On ne renvoie QUE les champs rendus par l'UI locataire (web/app).
--    On retire : owner_email, signature proprietaire image, coordonnees
--    proprietaire (adresse / email / tel / assurance) et donnees bancaires
--    superflues que l'UI n'affiche pas.
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
  -- Un token legitime fait 32 caracteres hex (16 octets). On rejette tout
  -- ce qui est trop court pour couper court au brute-force / probing.
  if p_token is null or length(p_token) < 24 then
    return null;
  end if;

  select * into c from contracts where access_token = p_token limit 1;
  if c.id is null then
    return null;
  end if;

  p := coalesce(c.payload, '{}'::jsonb);

  -- Projection minimisee du payload : uniquement les cles rendues cote locataire.
  -- (vehicule, tarifs, modalites, nom proprietaire affichable, prefill locataire,
  --  paiements, date de signature proprietaire, etat de retour.)
  return jsonb_build_object(
    'id',                  c.id,
    'code',                c.code,
    'type',                c.type,
    'vehicle',             c.vehicle,
    'status',              c.status,
    'signature_loc_date',  c.signature_loc_date,
    'created_at',          c.created_at,
    'payload', (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(p)
      where key in (
        -- Vehicule
        'v_nom','v_marque','v_annee','v_immat',
        -- Proprietaire : uniquement le nom affichable (pas adresse/email/tel/assurance)
        'p_pre','p_nom',
        -- Modalites / tarifs
        'debut','debut_h','fin','fin_h','duree','lieu','km',
        'pj','stot','red','total','caution','forfait','forfait_extra',
        -- Paiement : IBAN affiche par l'UI ; on garde aussi banque/titulaire
        -- pour le virement, mais on retire le BIC/paypal qui ne sont pas rendus.
        'iban','banque','iban_tit',
        -- Prefill des champs locataire (l'admin a pu les pre-remplir)
        'l_nom','l_pre','l_adr','l_tel','l_mail','l_naiss','l_naiss_l','l_perm','l_perm_d',
        'paiements',
        -- Signature proprietaire : on expose seulement la DATE, pas l'image
        'sig_prop_date',
        -- Champs du proces-verbal de retour rendus cote locataire
        'ref_code','km_dep','km_ret','carbu','eau','etat','prop_ret','carro','obs'
      )
    )
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. RPC : completion + signature locataire par TOKEN, avec liste
--    blanche stricte des cles editables par le locataire.
--    Le locataire ne peut ecrire QUE ses propres champs + dates/lieu ;
--    impossible d'ecraser prix, caution, signature proprietaire, etc.
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
  v_payload jsonb;
  v_patch jsonb;
begin
  if p_token is null or length(p_token) < 24 then
    raise exception 'token invalide';
  end if;
  if p_sig is null or length(p_sig) < 50 then
    raise exception 'signature requise';
  end if;

  select id, payload into v_id, v_payload
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
      'debut','debut_h','fin','fin_h','lieu'
    )
  );

  v_payload := coalesce(v_payload, '{}'::jsonb) || v_patch;

  if p_paiements is not null then
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

-- On retire l'ancien submit_contract_by_locataire (base sur le code + merge
-- arbitraire). Le frontend bascule entierement sur submit_contract_by_token.
drop function if exists submit_contract_by_locataire(text, jsonb, text[], text, text);

-- ─────────────────────────────────────────────────────────────
-- 5. Grants
-- ─────────────────────────────────────────────────────────────

grant execute on function fetch_contract_by_token(text) to anon, authenticated;
grant execute on function submit_contract_by_token(text, jsonb, text[], text, text) to anon, authenticated;
