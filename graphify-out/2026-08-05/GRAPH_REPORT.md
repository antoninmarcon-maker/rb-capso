# Graph Report - .  (2026-08-05)

## Corpus Check
- 11 files · ~274,919 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 188 nodes · 246 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.86)
- Token cost: 297,755 input · 0 output

## Community Hubs (Navigation)
- App admin : contrats et calendrier
- Doc analytics (ANALYTICS.md)
- API stats : coeur GA4
- Chaine de conversion mesuree
- Tests API stats
- Docs projet et deploiement
- BDD reservations
- BDD contrats et settings
- Consentement cookies
- Formulaires site public
- Signature et email contrat
- Edge function contract-email
- Pont calendrier public
- Calendrier de reservation public
- Config Vercel
- Campagnes Google Ads (BDD)
- Acces contrat par token

## God Nodes (most connected - your core abstractions)
1. `Table Supabase reservations` - 8 edges
2. `initAdminCal (calendrier admin intégré)` - 7 edges
3. `Contract Access Hardening (security/harden-contract-access)` - 6 edges
4. `submitCalendarBooking()` - 6 edges
5. `loadAndRender (charge blocks + résas)` - 6 edges
6. `periode()` - 5 edges
7. `nombre()` - 5 edges
8. `lignes()` - 5 edges
9. `resultatsCampagnes()` - 5 edges
10. `demande_reservation Event` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Collaborative Repo Workflow Rules` --semantically_similar_to--> `Migration-first Deployment Order`  [INFERRED] [semantically similar]
  CLAUDE.md → supabase/APPLY.md
- `submitDemande() (/app booking form)` --conceptually_related_to--> `/app Internal Tool`  [EXTRACTED]
  ANALYTICS.md → README.md
- `submitCalendarBooking()` --implements--> `demande_reservation Event`  [EXTRACTED]
  web/index.html → ANALYTICS.md
- `GTM Click Triggers (tel / mailto / WhatsApp / Instagram)` --references--> `Contact Action Links (tel / WhatsApp / Instagram / Maps)`  [INFERRED]
  ANALYTICS.md → web/index.html
- `robots.txt AI Crawler Policy` --references--> `/stats Dashboard (Romain's KPI page)`  [INFERRED]
  web/robots.txt → ANALYTICS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cookie Consent Flow** — web_index_consent_default_block, web_index_cookiebar, web_index_acceptcookies, web_index_rouvrircookies, analytics_rb_cookies_v3, analytics_consent_mode_v2, analytics_opt_out_consent_rule [EXTRACTED 1.00]
- **Reservation Conversion Measurement Pipeline** — web_index_submitcalendarbooking, web_app_index_submitdemande, analytics_demande_reservation, analytics_gtm_mrm597nw, analytics_ga4_g_99emnqyck1, analytics_google_ads_conversion, analytics_stats_dashboard [EXTRACTED 1.00]
- **Contract Access Hardening Rollout** — supabase_apply_harden_contract_access, supabase_apply_deployment_order, supabase_apply_access_token, supabase_migrations_006_secure_contract_access_fetch_contract_by_token, supabase_migrations_006_secure_contract_access_submit_contract_by_token, supabase_apply_contract_email_function [EXTRACTED 1.00]
- **Flux public de demande de réservation (?demande= → submit_booking → conversion GA4)** — web_app_index_initdemande, web_app_index_renderavailcal, web_app_index_submitdemande, supabase_rpc_submit_booking, ga4_event_demande_reservation [EXTRACTED 1.00]
- **Portail mot de passe admin répété sur les trois pages privées (/app, /calendar, /stats)** — web_app_index_dologin, web_calendar_index_login, web_stats_index_login [INFERRED 0.85]
- **Cycle de vie d'une réservation : création publique, gestion admin, suppression calendrier** — supabase_rpc_submit_booking, web_app_index_loaddemandeslist, web_app_index_setdemstatus, web_calendar_index_deletereservation, supabase_table_reservations [INFERRED 0.85]

## Communities (19 total, 3 thin omitted)

### Community 0 - "App admin : contrats et calendrier"
Cohesion: 0.13
Nodes (27): Table Supabase availability_blocks, Table Supabase contracts, Table Supabase owner_settings, Table Supabase reservations, Vue Supabase reservations_public, bootstrap (routeur d'entrée /app), copierLienDem (copie lien ?demande=), initAdminCal (calendrier admin intégré) (+19 more)

### Community 1 - "Doc analytics (ANALYTICS.md)"
Cohesion: 0.11
Nodes (23): demande_reservation Event, GA4 Custom Dimensions (Section, Vehicule, Forfait), GA4 Property G-99EMNQYCK1, Google Ads Conversion Action AW-18318860933 (Demande de réservation), GTM Click Triggers (tel / mailto / WhatsApp / Instagram), GTM Data Layer Variables (vehicule, forfait, nb_nuits, section), GTM Container GTM-MRM597NW, Looker Studio Dashboard Plan (+15 more)

### Community 2 - "API stats : coeur GA4"
Cohesion: 0.16
Nodes (20): base64url(), compteEvenements(), crypto, depenseAds(), EVENEMENTS_CLIC, jetonAcces(), lignes(), listerCampagnes() (+12 more)

### Community 3 - "Chaine de conversion mesuree"
Cohesion: 0.12
Nodes (20): Endpoint POST /api/stats, Bloc Consent Mode v2 (rb_cookies_v3), Table CANAUX/APPAREILS (traduction GA4), Événement GA4 demande_reservation, Conteneur GTM GTM-MRM597NW, RPC Supabase submit_booking, doLogin (login admin /app), submitDemande() (/app booking form) (+12 more)

### Community 4 - "Tests API stats"
Cohesion: 0.19
Nodes (12): appel(), appelsGA4, assert, cleJour(), crypto, fausseReponse(), handler, { privateKey } (+4 more)

### Community 5 - "Docs projet et deploiement"
Cohesion: 0.19
Nodes (12): Collaborative Repo Workflow Rules, graphify Knowledge Graph Rules, Vercel Auto-deploy on main, Vanilla HTML/CSS/JS Stack, Vercel Hosting (project rb-capso-romain), contracts.access_token (32-char token), contract-email Edge Function, Migration-first Deployment Order (+4 more)

### Community 6 - "BDD reservations"
Cohesion: 0.22
Nodes (6): admins, availability_blocks, reservations, reservations_public, reservations_public, submit_booking()

### Community 7 - "BDD contrats et settings"
Cohesion: 0.24
Nodes (6): contracts, owner_settings, set_updated_at(), trg_contracts_updated, trg_settings_updated, submit_contract_by_locataire()

### Community 8 - "Consentement cookies"
Cohesion: 0.36
Nodes (7): Consent Mode v2, Opt-out Consent Rule (no response = acceptance), rb_cookies_v3 Consent Key, acceptCookies(), Consent Mode Default Block (inline head script), #cookieBar Cookie Banner, gtag()

### Community 9 - "Formulaires site public"
Cohesion: 0.32
Nodes (7): Site Verification Token File, showToast(), Supabase submit_booking RPC (client call), submitCalendarBooking(), submitContact(), submitDevis(), web3forms Email Notification Integration

### Community 10 - "Signature et email contrat"
Cohesion: 0.40
Nodes (5): Edge function Supabase contract-email, RPC Supabase submit_contract_by_token, envLocSig (signature locataire), envLrSig (signature retour locataire), inviteClientByEmail

### Community 12 - "Pont calendrier public"
Cohesion: 0.70
Nodes (4): init(), loadSupabaseSDK(), mapStatus(), syncFromSupabase()

### Community 13 - "Calendrier de reservation public"
Cohesion: 0.60
Nodes (5): isBooked(), openCalendarModal(), pickDay(), renderCal(), selectVehicle()

### Community 14 - "Config Vercel"
Cohesion: 0.50
Nodes (3): cleanUrls, headers, $schema

## Ambiguous Edges - Review These
- `Site Verification Token File` → `web3forms Email Notification Integration`  [AMBIGUOUS]
  web/3cf5cee952bb70679ae054d475f98037.txt · relation: conceptually_related_to

## Knowledge Gaps
- **35 isolated node(s):** `cors`, `admins`, `owner_settings`, `campagnes`, `crypto` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Site Verification Token File` and `web3forms Email Notification Integration`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `submitDemande() (/app booking form)` connect `Chaine de conversion mesuree` to `Doc analytics (ANALYTICS.md)`, `Formulaires site public`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `Supabase Project bbjpjbviehsxshvzkvla (Paris)` connect `Doc analytics (ANALYTICS.md)` to `Formulaires site public`, `Docs projet et deploiement`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `submitCalendarBooking()` connect `Formulaires site public` to `Doc analytics (ANALYTICS.md)`, `Chaine de conversion mesuree`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Table Supabase reservations` (e.g. with `RPC Supabase submit_booking` and `Vue Supabase reservations_public`) actually correct?**
  _`Table Supabase reservations` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cors`, `admins`, `owner_settings` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App admin : contrats et calendrier` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._