# Graph Report - pdf-sans-emoji  (2026-09-20)

## Corpus Check
- 31 files · ~534,300 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 280 nodes · 339 edges · 22 communities (20 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2431125`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Table Supabase reservations
- demande_reservation Event
- stats.js
- afficher (rendu du tableau de bord)
- stats.test.js
- Contract Access Hardening (security/harden-contract-access)
- Refonte RB-CapSO — plan d'implémentation
- Refonte RB-CapSO — site vitrine et application — design
- acceptCookies
- pricing.test.js
- Edge function Supabase contract-email
- index.ts
- booking-bridge.js
- build-destinations.js
- vercel.json
- a11y-scan.mjs
- RPC Supabase fetch_contract_by_token
- submitCalendarBooking
- live-regions.test.js
- date-utils.test.js
- pdf-text.test.js

## God Nodes (most connected - your core abstractions)
1. `Refonte RB-CapSO — plan d'implémentation` - 8 edges
2. `Refonte RB-CapSO — site vitrine et application — design` - 8 edges
3. `Table Supabase reservations` - 8 edges
4. `initAdminCal (calendrier admin intégré)` - 7 edges
5. `PR 1 — `feat/site-vitrine`` - 6 edges
6. `PR 3 — `feat/documents-signables`` - 6 edges
7. `4. Design par lot` - 6 edges
8. `loadAndRender (charge blocks + résas)` - 6 edges
9. `submitCalendarBooking()` - 6 edges
10. `periode()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Collaborative Repo Workflow Rules` --semantically_similar_to--> `Migration-first Deployment Order`  [INFERRED] [semantically similar]
  CLAUDE.md → supabase/APPLY.md
- `robots.txt AI Crawler Policy` --references--> `/calendar Admin (shared password login)`  [INFERRED]
  web/robots.txt → README.md
- `renderAdminCal` --semantically_similar_to--> `renderCal (grille mensuelle /calendar)`  [INFERRED] [semantically similar]
  web/app/index.html → web/calendar/index.html
- `renderAvailCal (calendrier public de dispo)` --semantically_similar_to--> `renderCal (grille mensuelle /calendar)`  [INFERRED] [semantically similar]
  web/app/index.html → web/calendar/index.html
- `submitDemande() (/app booking form)` --references--> `Événement GA4 demande_reservation`  [EXTRACTED]
  ANALYTICS.md → web/app/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cookie Consent Flow** — web_index_consent_default_block, web_index_cookiebar, web_index_acceptcookies, web_index_rouvrircookies, analytics_rb_cookies_v3, analytics_consent_mode_v2, analytics_opt_out_consent_rule [EXTRACTED 1.00]
- **Flux public de demande de réservation (?demande= → submit_booking → conversion GA4)** — web_app_index_initdemande, web_app_index_renderavailcal, web_app_index_submitdemande, supabase_rpc_submit_booking, ga4_event_demande_reservation [EXTRACTED 1.00]
- **Reservation Conversion Measurement Pipeline** — web_index_submitcalendarbooking, web_app_index_submitdemande, analytics_demande_reservation, analytics_gtm_mrm597nw, analytics_ga4_g_99emnqyck1, analytics_google_ads_conversion, analytics_stats_dashboard [EXTRACTED 1.00]
- **Portail mot de passe admin répété sur les trois pages privées (/app, /calendar, /stats)** — web_app_index_dologin, web_calendar_index_login, web_stats_index_login [INFERRED 0.85]
- **Cycle de vie d'une réservation : création publique, gestion admin, suppression calendrier** — supabase_rpc_submit_booking, web_app_index_loaddemandeslist, web_app_index_setdemstatus, web_calendar_index_deletereservation, supabase_table_reservations [INFERRED 0.85]

## Communities (22 total, 1 thin omitted)

### Community 0 - "Table Supabase reservations"
Cohesion: 0.13
Nodes (27): Table Supabase availability_blocks, Table Supabase contracts, Table Supabase owner_settings, Table Supabase reservations, Vue Supabase reservations_public, bootstrap (routeur d'entrée /app), copierLienDem (copie lien ?demande=), initAdminCal (calendrier admin intégré) (+19 more)

### Community 1 - "demande_reservation Event"
Cohesion: 0.13
Nodes (21): demande_reservation Event, GA4 Custom Dimensions (Section, Vehicule, Forfait), GA4 Property G-99EMNQYCK1, Google Ads Conversion Action AW-18318860933 (Demande de réservation), GTM Click Triggers (tel / mailto / WhatsApp / Instagram), GTM Data Layer Variables (vehicule, forfait, nb_nuits, section), GTM Container GTM-MRM597NW, Looker Studio Dashboard Plan (+13 more)

### Community 2 - "stats.js"
Cohesion: 0.11
Nodes (28): activiteLocation(), base64url(), compteEvenements(), crypto, demandesDepuisBase(), depenseAds(), EVENEMENTS_CLIC, jetonAcces() (+20 more)

### Community 3 - "afficher (rendu du tableau de bord)"
Cohesion: 0.13
Nodes (18): Endpoint POST /api/stats, Bloc Consent Mode v2 (rb_cookies_v3), Table CANAUX/APPAREILS (traduction GA4), Événement GA4 demande_reservation, Conteneur GTM GTM-MRM597NW, doLogin (login admin /app), login handler (soumission code admin /calendar), showAdmin (+10 more)

### Community 4 - "stats.test.js"
Cohesion: 0.14
Nodes (13): appel(), appelsGA4, assert, cleJour(), crypto, fausseReponse(), r, handler (+5 more)

### Community 5 - "Contract Access Hardening (security/harden-contract-access)"
Cohesion: 0.20
Nodes (10): Collaborative Repo Workflow Rules, graphify Knowledge Graph Rules, Vercel Auto-deploy on main, Vanilla HTML/CSS/JS Stack, Vercel Hosting (project rb-capso-romain), contracts.access_token (32-char token), contract-email Edge Function, Migration-first Deployment Order (+2 more)

### Community 6 - "Refonte RB-CapSO — plan d'implémentation"
Cohesion: 0.07
Nodes (26): Global Constraints, Ordre d'application en prod (à chaque PR, sur OK d'Antonin), PR 1 — `feat/site-vitrine`, PR 2 — `feat/estimation-options`, PR 3 — `feat/documents-signables`, PR 4 — `feat/identite-photos` (après merge de PR 3), PR 5 — `feat/stripe-acompte` (après merge de PR 3, compte Stripe vérifié), Refonte RB-CapSO — plan d'implémentation (+18 more)

### Community 7 - "Refonte RB-CapSO — site vitrine et application — design"
Cohesion: 0.12
Nodes (15): 1. Contexte, 2. Arbitrages (validés le 06/09/2026, révisés le 07/09 sur les réponses de Romain), 3. Découpage en lots et ordre de livraison, 4.1 PR 1 — Site vitrine (`web/index.html` seul, zéro base), 4.2 PR 2 — Estimation et options, 4.3 PR 3 — Trois documents signables, annulation au contrat, PDF locataire, 4.4 PR 4 — Pièce d'identité et photos, 4.5 PR 5 — Stripe : acompte 30 % et solde (+7 more)

### Community 8 - "acceptCookies"
Cohesion: 0.36
Nodes (7): Consent Mode v2, Opt-out Consent Rule (no response = acceptance), rb_cookies_v3 Consent Key, acceptCookies(), Consent Mode Default Block (inline head script), #cookieBar Cookie Banner, gtag()

### Community 9 - "pricing.test.js"
Cohesion: 0.18
Nodes (8): assert, blocApp, blocSite, ctx, extraireBloc(), fs, path, vm

### Community 10 - "Edge function Supabase contract-email"
Cohesion: 0.40
Nodes (5): Edge function Supabase contract-email, RPC Supabase submit_contract_by_token, envLocSig (signature locataire), envLrSig (signature retour locataire), inviteClientByEmail

### Community 11 - "index.ts"
Cohesion: 0.25
Nodes (5): cors, envoyer(), json(), OPTIONS, VEHICULES

### Community 12 - "booking-bridge.js"
Cohesion: 0.70
Nodes (4): init(), loadSupabaseSDK(), mapStatus(), syncFromSupabase()

### Community 13 - "build-destinations.js"
Cohesion: 0.32
Nodes (7): DATA, esc(), fs, jsonLd(), page(), path, RACINE

### Community 14 - "vercel.json"
Cohesion: 0.50
Nodes (3): cleanUrls, headers, $schema

### Community 15 - "a11y-scan.mjs"
Cohesion: 0.33
Nodes (5): baseline, corrigees, PAGES, seen, TAGS

### Community 18 - "submitCalendarBooking"
Cohesion: 0.14
Nodes (16): /calendar Admin (shared password login), Supabase Project bbjpjbviehsxshvzkvla (Paris), Site Verification Token File, isBooked(), loadReservations(), openCalendarModal(), pickDay(), localStorage rbcapso_reservations_v2 Store (+8 more)

### Community 19 - "live-regions.test.js"
Cohesion: 0.18
Nodes (9): assert, ctxApp(), evaluer(), extraire(), fs, lire(), path, TOASTS_APP (+1 more)

### Community 20 - "date-utils.test.js"
Cohesion: 0.28
Nodes (8): assert, chargerHelpers(), { execFileSync }, fs, FUSEAUX, path, testsUnFuseau(), ymdAttendu()

### Community 21 - "pdf-text.test.js"
Cohesion: 0.18
Nodes (8): a, assert, b, ctx, fs, path, src, vm

## Ambiguous Edges - Review These
- `web3forms Email Notification Integration` → `Site Verification Token File`  [AMBIGUOUS]
  web/3cf5cee952bb70679ae054d475f98037.txt · relation: conceptually_related_to

## Knowledge Gaps
- **104 isolated node(s):** `PAGES`, `TAGS`, `baseline`, `seen`, `corrigees` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 130 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `web3forms Email Notification Integration` and `Site Verification Token File`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `submitDemande() (/app booking form)` connect `demande_reservation Event` to `submitCalendarBooking`, `afficher (rendu du tableau de bord)`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Table Supabase reservations` connect `Table Supabase reservations` to `demande_reservation Event`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `submitCalendarBooking()` connect `submitCalendarBooking` to `demande_reservation Event`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Table Supabase reservations` (e.g. with `RPC Supabase submit_booking` and `Vue Supabase reservations_public`) actually correct?**
  _`Table Supabase reservations` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PAGES`, `TAGS`, `baseline` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Table Supabase reservations` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._