# APPLY - Durcissement de l'acces aux contrats

> **Statut : APPLIQUÉ et vérifié en prod le 05/08/2026.** Migration 006 active (les RPC brute-forçables n'existent plus en base), Edge Function contract-email durcie déployée (invite sans auth → 401, CORS verrouillé), frontend token sur main et servi sur rb-capso.com/app. La branche `security/harden-contract-access` n'a jamais été mergée : son frontend était périmé vs main ; ce runbook est conservé comme documentation d'architecture et de rollback.

Branche : `security/harden-contract-access`

Cette branche corrige des failles de securite LIVE sur l'acces aux contrats
locataire. Elle se compose de trois parties qui DOIVENT etre appliquees dans
l'ordre ci-dessous pour ne pas casser le site de reservation en production.

## Pourquoi cet ordre

Le frontend de la branche lit/ecrit les contrats via `access_token`
(`fetch_contract_by_token`, `submit_contract_by_token`). Ces fonctions
n'existent qu'apres la migration. Si on mergeait le frontend dans `main`
(deploiement Vercel automatique) AVANT d'avoir applique la migration en prod,
la signature locataire et la lecture de contrat seraient cassees pour tout le
monde. La migration et la fonction edge doivent donc partir EN PREMIER, le
merge frontend EN DERNIER.

## Prerequis (cote owner, avec les creds prod)

- Supabase CLI installe et authentifie (`supabase login`).
- Acces au projet Supabase `bbjpjbviehsxshvzkvla`.
- Les secrets de la fonction edge a jour (voir etape 2).

## Etape 1 - Migration DB (EN PREMIER)

La migration ajoute `contracts.access_token`, supprime les RPC
brute-forcables (`fetch_contract_by_code`, `submit_locataire_signature`,
`submit_contract_by_locataire`) et cree les RPC token (`fetch_contract_by_token`,
`submit_contract_by_token`).

```bash
# depuis la racine du repo, sur la branche security/harden-contract-access
supabase link --project-ref bbjpjbviehsxshvzkvla
supabase db push
```

Fichier applique : `supabase/migrations/006_secure_contract_access.sql`

Note de numerotation : le fichier est nomme `006_*` et non `004_*`. Les slots
`004_unify_demandes.sql` et `005_overlap_check.sql` existaient deja dans le
repo ; `006` est le prochain numero libre, ce qui garantit l'ordre
d'application chronologique correct.

La migration est idempotente la ou c'est possible
(`add column if not exists`, `create unique index if not exists`,
`create or replace function`, `drop function if exists`). Le backfill ne touche
que les lignes dont `access_token` est `null`.

### Verification post-migration (optionnelle mais recommandee)

```sql
-- toutes les lignes ont un token de 32 caracteres
select count(*) filter (where access_token is null) as nulls,
       count(*) filter (where length(access_token) <> 32) as bad_len
from contracts;            -- attendu : 0 | 0

-- les anciennes fonctions n'existent plus
select proname from pg_proc
where proname in ('fetch_contract_by_code','submit_locataire_signature','submit_contract_by_locataire');
-- attendu : aucune ligne
```

## Etape 2 - Redeploiement de la fonction edge contract-email (EN DEUXIEME)

La nouvelle fonction :
- exige un appelant ADMIN authentifie pour l'action `invite` (validation du JWT
  + appartenance a la table `admins`) ;
- identifie le contrat par `access_token` (plus par le code a 4 chiffres) ;
- construit les liens en `?t=<access_token>` et retire le code brut des mails ;
- verrouille le CORS sur le domaine de prod.

Secrets a positionner (en plus de ceux deja en place : `RESEND_API_KEY`,
`RESEND_FROM`, `ROMAIN_EMAIL`, `APP_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) :

```bash
# requis pour valider le JWT de l'appelant admin
supabase secrets set SUPABASE_ANON_KEY="<cle anon du projet>"
# origine CORS autorisee (defaut deja code = https://rb-capso.com)
supabase secrets set ALLOWED_ORIGIN="https://rb-capso.com"
# s'assurer que APP_URL pointe bien sur l'app (defaut = https://rb-capso.com/app)
supabase secrets set APP_URL="https://rb-capso.com/app"

supabase functions deploy contract-email
```

Fichier deploye : `supabase/functions/contract-email/index.ts`

## Etape 3 - Merge frontend vers main (EN DERNIER)

Une fois la migration poussee ET la fonction redeployee, merger la branche
dans `main`. Vercel deploiera alors le frontend qui consomme les nouveaux RPC.

```bash
git checkout main
git pull --ff-only
git merge --no-ff security/harden-contract-access
git push origin main
```

Vercel redeploie automatiquement sur push `main`.

## Compatibilite des liens deja envoyes

Les anciens liens `?code=1234` ne fonctionneront plus apres le merge : le
frontend ne lit plus le parametre `code`, et le RPC `fetch_contract_by_code` a
ete supprime. C'est voulu (le code a 4 chiffres etait la faille). Pour les
contrats `pending` en cours, regenerer et renvoyer le lien `?t=<token>` depuis
"Mes contrats" (bouton "copier le lien" ou renvoi par email). Le bouton et
l'email utilisent desormais automatiquement le token.

## Rollback

En cas de probleme apres l'etape 3, revert du merge frontend sur `main`
(`git revert -m 1 <merge_commit>` + push) restaure l'ancien frontend. ATTENTION:
l'ancien frontend appelle des RPC supprimes par la migration ; un rollback
frontend seul casserait aussi le site. Un rollback complet implique de
recreer les anciennes fonctions OU de garder le frontend token. La voie sure
est de corriger en avant (forward-fix) plutot que de revenir en arriere une
fois la migration appliquee.

---

# APPLY — Lots 2 et 3 de la refonte (septembre 2026)

> **Statut : APPLIQUÉ et vérifié en prod le 07/09/2026.** Migrations 009 puis 010 jouées
> par le SQL Editor du tableau de bord (compte du propriétaire du projet, ouvert dans le
> navigateur d'Antonin), vérification : `submit_booking` en 9 et 11 arguments, contrainte
> `contracts_type_check` avec `edl_depart`, colonnes `options` / `estimation_cents` /
> `parent_id`, règle d'acceptation et clé `reglement` présentes. Edge Function
> `contract-email` redéployée par l'onglet Code → « Deploy updates » (sonde : 404
> « contract not found » sur un token bidon). PR #20 puis #22 mergées ensuite.
> Le compte Supabase d'Antonin et son token CLI ne voient toujours pas le projet
> `bbjpjbviehsxshvzkvla` : la procédure ci-dessous reste la voie d'application.

Même ordre que le durcissement de juillet : **migration → Edge Function → merge frontend**.
Les deux migrations sont idempotentes et rétro-compatibles avec le frontend en prod :

- `009_options_estimation.sql` (PR #20) — conserve l'ancienne signature `submit_booking`
  à 9 arguments comme relais : le site en prod continue d'envoyer ses demandes.
- `010_documents_signables.sql` (PR #21) — n'exige l'acceptation des conditions que pour
  les contrats qui embarquent le texte (clé `annulation`, écrite par le nouveau frontend) :
  un contrat créé avant le merge reste signable.

## Par le tableau de bord Supabase (sans CLI ni mot de passe)

1. `https://supabase.com/dashboard/project/bbjpjbviehsxshvzkvla/sql/new`
2. Coller le contenu de `supabase/migrations/009_options_estimation.sql`, **Run**.
   Attendu : « Success. No rows returned ».
3. Coller le contenu de `supabase/migrations/010_documents_signables.sql`, **Run**.
4. Vérifier :

```sql
select proname, pronargs from pg_proc where proname = 'submit_booking' order by 2;
-- attendu : deux lignes, 9 et 11
select pg_get_constraintdef(oid) from pg_constraint where conname = 'contracts_type_check';
-- attendu : … 'edl_depart' …
select column_name from information_schema.columns
 where table_name in ('reservations','contracts') and column_name in ('options','estimation_cents','parent_id');
-- attendu : trois lignes
```

5. Edge Function (PR #21 seulement) : `supabase functions deploy contract-email --project-ref bbjpjbviehsxshvzkvla`
   depuis un poste lié au projet, ou via le tableau de bord (Edge Functions → contract-email → Deploy).
6. Merger la PR correspondante.

## Rollback

- 009 : `drop function submit_booking(text,text,text,text,text,date,date,text,text,jsonb,integer);`
  puis rejouer la définition à 9 arguments de `005_overlap_check.sql`. Les colonnes
  `options` / `estimation_cents` peuvent rester (le frontend précédent les ignore).
- 010 : rejouer les deux fonctions de `006_secure_contract_access.sql` ; laisser la
  colonne `parent_id` et la contrainte élargie (sans effet sur l'ancien frontend).

## Lot tarifs saisonniers (PR #25) - migration 011

`011_option_materiel.sql` (submit_booking accepte l'option `materiel`) : appliquee en prod
le 07/09/2026 via le SQL Editor du tableau de bord (compte de Romain). Verification faite :
`select proname, pronargs, prosrc like '%materiel%' from pg_proc where proname = 'submit_booking'`
-> 11 args : true (9 args : relais inchange). Aucun redeploiement de fonction edge necessaire.
