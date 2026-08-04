# Graph Report - .  (2026-08-04)

## Corpus Check
- 13 files · ~274,850 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 77 nodes · 96 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Tests API stats
- Contrats et signature
- Reservations et disponibilites
- API stats : acces GA4
- API stats : agregations
- Email de contrat
- API stats : rapports
- Pont calendrier public
- Config Vercel
- Campagnes Google Ads

## God Nodes (most connected - your core abstractions)
1. `periode()` - 5 edges
2. `nombre()` - 5 edges
3. `lignes()` - 5 edges
4. `resultatsCampagnes()` - 5 edges
5. `reservations` - 4 edges
6. `compteEvenements()` - 4 edges
7. `contracts` - 3 edges
8. `set_updated_at()` - 3 edges
9. `submit_booking()` - 3 edges
10. `depenseAds()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `reservations_public` --reads_from--> `reservations`  [EXTRACTED]
  supabase/migrations/004_unify_demandes.sql → supabase/migrations/001_init.sql
- `submit_booking()` --reads_from--> `reservations`  [EXTRACTED]
  supabase/migrations/005_overlap_check.sql → supabase/migrations/001_init.sql
- `submit_booking()` --reads_from--> `availability_blocks`  [EXTRACTED]
  supabase/migrations/005_overlap_check.sql → supabase/migrations/001_init.sql
- `submit_contract_by_locataire()` --reads_from--> `contracts`  [EXTRACTED]
  supabase/migrations/003_locataire_complete.sql → supabase/migrations/002_app.sql
- `submit_contract_by_token()` --reads_from--> `contracts`  [EXTRACTED]
  supabase/migrations/006_secure_contract_access.sql → supabase/migrations/002_app.sql

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "Tests API stats"
Cohesion: 0.19
Nodes (12): appel(), appelsGA4, assert, cleJour(), crypto, fausseReponse(), handler, { privateKey } (+4 more)

### Community 1 - "Contrats et signature"
Cohesion: 0.18
Nodes (7): contracts, owner_settings, set_updated_at(), trg_contracts_updated, trg_settings_updated, submit_contract_by_locataire(), submit_contract_by_token()

### Community 2 - "Reservations et disponibilites"
Cohesion: 0.22
Nodes (6): admins, availability_blocks, reservations, reservations_public, reservations_public, submit_booking()

### Community 3 - "API stats : acces GA4"
Cohesion: 0.24
Nodes (8): base64url(), crypto, EVENEMENTS_CLIC, jetonAcces(), listerCampagnes(), NOMS_VANS, SECTIONS_HORS_VANS, supabase()

### Community 4 - "API stats : agregations"
Cohesion: 0.48
Nodes (7): compteEvenements(), depenseAds(), lignes(), nombre(), paires(), requetesCampagne(), resultatsCampagnes()

### Community 6 - "API stats : rapports"
Cohesion: 0.40
Nodes (5): periode(), rapports(), rapportsAdsDetail(), rapportsComplement(), rapportsEntonnoir()

### Community 7 - "Pont calendrier public"
Cohesion: 0.70
Nodes (4): init(), loadSupabaseSDK(), mapStatus(), syncFromSupabase()

### Community 8 - "Config Vercel"
Cohesion: 0.50
Nodes (3): cleanUrls, headers, $schema

## Knowledge Gaps
- **16 isolated node(s):** `cors`, `admins`, `owner_settings`, `campagnes`, `crypto` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `cors`, `admins`, `owner_settings` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._