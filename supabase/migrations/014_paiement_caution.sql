-- 014 : paiement en ligne et caution par empreinte Stripe (spec 2026-10-04).
-- Etat ecrit par la fonction `paiement` (service role). Le locataire n'en voit qu'une
-- projection (statuts, montants, dates), jamais les identifiants Stripe.
-- A appliquer AVANT le deploiement de la fonction et le merge du frontend.
-- Prerequis : extensions pg_cron (deja active, 012) et pg_net ; secret Vault `cron_secret`
-- et `paiement_url` crees a la main (voir APPLY.md), jamais dans ce fichier.

alter table contracts add column if not exists paiement jsonb not null default '{}'::jsonb;
alter table contracts add column if not exists caution jsonb not null default '{}'::jsonb;

create table if not exists stripe_events (
  id text primary key,
  type text not null,
  recu_le timestamptz not null default now()
);
alter table stripe_events enable row level security;
-- Aucune policy : seule la fonction (service role) lit et ecrit.

create extension if not exists pg_net;

-- ─────────────────────────────────────────────────────────────
-- Lecture par token (reprise de 010) + projection paiement / caution.
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
    -- Paiement et caution (014) : projection, jamais d'identifiant Stripe.
    'paiement', jsonb_build_object(
      'status',        coalesce(c.paiement->>'status', 'attente'),
      'mode',          c.paiement->>'mode',
      'montant_cents', c.paiement->'montant_cents',
      'paid_at',       c.paiement->>'paid_at'),
    'caution', jsonb_build_object(
      'status',        coalesce(c.caution->>'status', 'carte_manquante'),
      'mode',          coalesce(c.caution->>'mode', 'auto'),
      'montant_cents', c.caution->'montant_cents',
      'bloquee_le',    c.caution->>'bloquee_le',
      'expire_vers',   c.caution->>'expire_vers',
      'retenu_cents',  c.caution->'retenu_cents'),
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
        -- Observations du contrat (les deux cles ont existe) : le PDF locataire les affiche aussi
        'rem','lrem',
        -- Paiement : IBAN affiche par l'UI ; banque/titulaire pour le virement.
        'iban','banque','iban_tit',
        -- Prefill des champs locataire (l'admin a pu les pre-remplir)
        'l_nom','l_pre','l_adr','l_tel','l_mail','l_naiss','l_naiss_l','l_perm','l_perm_d',
        -- Second conducteur saisi par le locataire
        's2nom','s2pre','s2tel','s2perm','s2naiss','s2perm_d','s2',
        'paiements',
        -- Signature proprietaire : image ET date (PDF locataire complet) ; signature
        -- locataire posee sur place (sig_loc, sa propre signature) pour les PDF EDL/retour
        'sig_prop','sig_prop_date','slieu','sig_loc','sig_loc_date',
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

grant execute on function fetch_contract_by_token(text) to anon, authenticated;

-- Cron horaire (minute 7) : la fonction decide seule quoi faire (LOGIQUE.decisionCaution).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'caution-empreintes') then
    perform cron.unschedule('caution-empreintes');
  end if;
  perform cron.schedule('caution-empreintes', '7 * * * *', $cmd$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'paiement_url'),
      headers := jsonb_build_object('Content-Type', 'application/json',
                   'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
      body    := '{"action":"cron"}'::jsonb)
  $cmd$);
end;
$$;
