# Graph Report - .  (2026-08-05)

## Corpus Check
- 58 files · ~274,850 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 233 nodes · 304 edges · 41 communities (19 shown, 22 thin omitted)
- Extraction: 85% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.89)
- Token cost: 1,410,307 input · 0 output

## Community Hubs (Navigation)
- Contrats & Signature Email
- API Stats & Campagnes
- Réservations & Admin App
- Analytics GTM/GA4
- Docs & Déploiement
- Tests API Stats
- Partage Contrats (tokens)
- Photos Hero Vanlife
- Galerie Peggy Setup
- Config Vercel
- Peggy Intérieur Arrière
- Tente Équipement Camp
- Pénélope Extérieur
- Pénélope Cuisine
- Tente Surf Trip
- Tente Couchage
- Consentement Cookies
- OG Cover Social
- Apple Touch Icon
- Peggy Intérieur Banquette
- Peggy Kitchenette
- Peggy Glacière
- Pénélope Couchage Mer
- Pénélope Salle d'Eau
- Logo RB-CapSO
- Douche Intérieure Van
- Intérieur Van Générique
- Atelier Artisan Portrait
- Fabrication Découpe Bois
- Fabrication Meuble Tiroirs
- Isolation Van Chantier
- Meubles Van Atelier
- Lit Coffre Van
- Tente Équipements Inclus
- Tente James Baroud
- Favicon 32px
- Favicon Principal
- Hero Poster Vidéo
- Règles Collaboration Git
- Règles Graphify Projet

## God Nodes (most connected - your core abstractions)
1. `contracts` - 19 edges
2. `stats serverless handler (/api/stats)` - 15 edges
3. `reservations` - 13 edges
4. `availability_blocks` - 8 edges
5. `syncFromSupabase()` - 8 edges
6. `submit_booking()` - 7 edges
7. `resultatsCampagnes()` - 7 edges
8. `admins` - 6 edges
9. `submit_contract_by_token()` - 6 edges
10. `rapportsEntonnoir()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `pickDay (client-side range conflict check)` --semantically_similar_to--> `submit_booking()`  [INFERRED] [semantically similar]
  web/index.html → supabase/migrations/005_overlap_check.sql
- `Tableau de bord /stats` --semantically_similar_to--> `Admin /calendar (cle anon publique + RLS)`  [INFERRED] [semantically similar]
  ANALYTICS.md → README.md
- `loadDemandesList` --shares_data_with--> `reservations`  [EXTRACTED]
  web/app/index.html → supabase/migrations/001_init.sql
- `setDemStatus` --shares_data_with--> `reservations`  [EXTRACTED]
  web/app/index.html → supabase/migrations/001_init.sql
- `supprimerDemande` --shares_data_with--> `reservations`  [EXTRACTED]
  web/app/index.html → supabase/migrations/001_init.sql

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **demande_reservation conversion tracking flow** — web_index_submitcalendarbooking, web_app_index_submitdemande, web_api_stats_demande_reservation, web_api_stats_handler, web_stats_index_afficher [EXTRACTED 1.00]
- **Remote contract signature flow (token-based)** — web_app_index_saveandsharec, web_app_index_creerlien, web_app_index_insertcontract, web_app_index_inviteclientbyemail, supabase_functions_contract_email_index_handler, web_app_index_initlocataire, web_app_index_envlocsig, supabase_migrations_006_secure_contract_access_fetch_contract_by_token, supabase_migrations_006_secure_contract_access_submit_contract_by_token, supabase_migrations_002_app_contracts [EXTRACTED 1.00]
- **Public availability sync (Supabase to localStorage to calendar)** — web_booking_bridge_syncfromsupabase, supabase_migrations_001_init_reservations_public, supabase_migrations_001_init_availability_blocks, web_index_loadreservations, web_index_rendercal [EXTRACTED 1.00]
- **Pipeline de mesure GA4 (GTM, consentement, evenements, DLV)** — analytics_gtm_container, analytics_ga4_property, analytics_consent_mode_v2, analytics_dlv_variables, analytics_demande_reservation, analytics_section_vue, analytics_clic_triggers [EXTRACTED 1.00]
- **Deploiement ordonne du durcissement des contrats** — supabase_apply_migration_006, supabase_apply_contract_email_function, supabase_apply_access_token, supabase_apply_deployment_order [EXTRACTED 1.00]
- **Reporting depense et conversions Google Ads** — analytics_google_ads_conversion, analytics_advertiser_ad_cost, analytics_stats_page, analytics_looker_studio_dashboard [EXTRACTED 1.00]

## Communities (41 total, 22 thin omitted)

### Community 0 - "Contrats & Signature Email"
Cohesion: 0.08
Nodes (28): cors, getAdminEmail(), contract-email Edge Function handler, contracts, fetch_contract_by_code(), set_updated_at(), submit_locataire_signature(), trg_contracts_updated (+20 more)

### Community 1 - "API Stats & Campagnes"
Cohesion: 0.14
Nodes (29): campagnes, campagnes_utm_non_vide constraint, base64url(), compteEvenements(), crypto, depenseAds(), EVENEMENTS_CLIC, GA4 Data API (batchRunReports) (+21 more)

### Community 2 - "Réservations & Admin App"
Cohesion: 0.12
Nodes (26): admins, availability_blocks, reservations, reservations_public, submit_booking(), owner_settings, reservations_public, submit_booking() (+18 more)

### Community 3 - "Analytics GTM/GA4"
Cohesion: 0.16
Nodes (17): Depense publicitaire via metrique GA4 advertiserAdCost, Declencheurs de clic GTM (tel, mail, WhatsApp, Instagram), Consent Mode v2 (regle opt-out), Evenement demande_reservation, Variables de couche de donnees GTM (DLV), Dimensions personnalisees GA4 (Section, Vehicule, Forfait), GA4 Property G-99EMNQYCK1, Action de conversion Google Ads (balise dediee AW-18318860933) (+9 more)

### Community 4 - "Docs & Déploiement"
Cohesion: 0.17
Nodes (16): Tableau de bord /stats, Admin /calendar (cle anon publique + RLS), Projet RB-CapSO (site + /app + /calendar), Base Supabase (projet bbjpjbviehsxshvzkvla, Paris), Hebergement Vercel (projet rb-capso-romain, auto-deploy), Acces contrat par access_token (remplace le code a 4 chiffres), Fonction edge contract-email (version durcie), Durcissement de l'acces aux contrats (branche security/harden-contract-access) (+8 more)

### Community 5 - "Tests API Stats"
Cohesion: 0.19
Nodes (12): appel(), appelsGA4, assert, cleJour(), crypto, fausseReponse(), handler, { privateKey } (+4 more)

### Community 6 - "Partage Contrats (tokens)"
Cohesion: 0.32
Nodes (8): chkLocSig (signature poller), chkLocSigC (signature poller), chkLocSigR (signature poller), creerLien (share distance contract), fetchContractStatus, insertContract, saveAndShareC (share presentiel contract), saveAndShareR (share retour PV)

### Community 7 - "Photos Hero Vanlife"
Cohesion: 0.33
Nodes (7): Photo 02 (480px) - Vanlife en bord de falaise, Scène vanlife côtière (deux vans, jeu de ballon, surf), Photo hero 768px - les deux vans en bord de falaise, Scene vanlife cotiere : les deux vans RB-CapSO en pleine nature, Photo 02 - Camp vanlife en falaise: deux vans, surf et volley face a la mer, Van sigle RB-CapSO (livree 'Location et Conception de Vans amenages', tente de toit ouverte), Vanlife cotier: camp sur falaise, surf et volley au bord de l'ocean

### Community 8 - "Galerie Peggy Setup"
Cohesion: 0.60
Nodes (5): Équipement camping autonome (table, réchaud, chaises, panneau solaire pliable), Photo galerie Peggy 1 - van portes ouvertes avec installation camping, Amenagement interieur : banquette convertible avec coffres, evier, rangements bois, rideaux, Peggy - Photo interieure 5 : banquette-lit, coin evier et table rabattable, Peggy (van aménagé)

### Community 9 - "Config Vercel"
Cohesion: 0.50
Nodes (3): cleanUrls, headers, $schema

### Community 10 - "Peggy Intérieur Arrière"
Cohesion: 1.00
Nodes (3): Peggy (van aménagé), Aménagement intérieur de Peggy (lit double, kitchenette bois, rangements), Peggy - vue arrière portes ouvertes sur l'intérieur aménagé

### Community 11 - "Tente Équipement Camp"
Cohesion: 1.00
Nodes (3): Tente de toit (location RB-CapSO), Equipement de camping fourni (table, rechaud, glaciere, station electrique, douche), Photo galerie tente 2 - campement complet avec equipement

### Community 12 - "Pénélope Extérieur"
Cohesion: 1.00
Nodes (3): Ambiance camping (table et chaises pliantes en pleine nature), Pénélope (van aménagé Fiat Ducato), Pénélope – vue extérieure au coucher du soleil, porte latérale ouverte

### Community 13 - "Pénélope Cuisine"
Cohesion: 1.00
Nodes (3): Cuisine aménagée du van (plaque gaz, évier, four, rangements cannage), Pénélope (van aménagé), Pénélope – photo intérieur cuisine (galerie 2)

### Community 14 - "Tente Surf Trip"
Cohesion: 1.00
Nodes (3): Photo tente 3 - Van avec tente de toit ouverte face a l'ocean, Surf trip cotier en van amenage, Tente de toit (produit de location RB-CapSO)

### Community 15 - "Tente Couchage"
Cohesion: 1.00
Nodes (3): Espace couchage interieur de la tente de toit, James Baroud (marque de la tente de toit), Tente de toit - interieur couchage (photo 4)

### Community 16 - "Consentement Cookies"
Cohesion: 0.67
Nodes (3): acceptCookies (Consent Mode v2 banner), rb_cookies_v3 consent flag (localStorage), afficher (render dashboard)

### Community 17 - "OG Cover Social"
Cohesion: 1.00
Nodes (3): OG Cover Photo (drone view of RB-CapSO campervan camp), Van aménagé RB-CapSO (solar-equipped campervan in nature), Vanlife / Outdoor Lifestyle (surf, camping, off-grid)

## Ambiguous Edges - Review These
- `Projet RB-CapSO (site + /app + /calendar)` → `Fichier de verification de domaine (jeton hexadecimal)`  [AMBIGUOUS]
  web/3cf5cee952bb70679ae054d475f98037.txt · relation: conceptually_related_to

## Knowledge Gaps
- **76 isolated node(s):** `cors`, `crypto`, `EVENEMENTS_CLIC`, `NOMS_VANS`, `SECTIONS_HORS_VANS` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Projet RB-CapSO (site + /app + /calendar)` and `Fichier de verification de domaine (jeton hexadecimal)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `submit_booking()` connect `Analytics GTM/GA4` to `Réservations & Admin App`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `GA4 demande_reservation conversion event` connect `Analytics GTM/GA4` to `API Stats & Campagnes`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `contracts` connect `Contrats & Signature Email` to `Réservations & Admin App`, `Partage Contrats (tokens)`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **What connects `cors`, `crypto`, `EVENEMENTS_CLIC` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contrats & Signature Email` be split into smaller, more focused modules?**
  _Cohesion score 0.08021390374331551 - nodes in this community are weakly interconnected._
- **Should `API Stats & Campagnes` be split into smaller, more focused modules?**
  _Cohesion score 0.13548387096774195 - nodes in this community are weakly interconnected._