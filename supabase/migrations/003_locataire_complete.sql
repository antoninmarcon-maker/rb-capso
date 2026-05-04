-- RPC qui permet au locataire de :
--   1. Compléter ses infos (jsonb patch sur le payload)
--   2. Choisir ses paiements
--   3. Poser sa signature
-- en une seule transaction. Anon-callable, transition pending → signed.

create or replace function submit_contract_by_locataire(
  p_code text,
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
begin
  if p_sig is null or length(p_sig) < 50 then
    raise exception 'signature requise';
  end if;

  select id, payload into v_id, v_payload
  from contracts
  where code = p_code and status = 'pending'
  limit 1;

  if v_id is null then
    raise exception 'contrat introuvable ou déjà signé';
  end if;

  -- Merge des champs locataire (le patch écrase les valeurs existantes)
  v_payload := coalesce(v_payload, '{}'::jsonb) || coalesce(p_locataire_patch, '{}'::jsonb);

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

grant execute on function submit_contract_by_locataire(text, jsonb, text[], text, text) to anon, authenticated;
