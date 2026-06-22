# APPLY - Durcissement de l'acces aux contrats

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
