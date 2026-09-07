# Refonte RB-CapSO — site vitrine et application — design

Date : 2026-09-06. Cadrage validé par Antonin le 6 septembre 2026 (12 arbitrages, voir §2).

## 1. Contexte

RB-CapSO loue deux vans aménagés (Pénélope 120 €/j, Peggy 95 €/j) et une tente de toit
(50 €/j) à Capbreton. Le site `rb-capso.com` (`web/index.html`) prend les demandes de
réservation ; l'outil interne `/app` (`web/app/index.html`) sert à Romain pour rédiger les
contrats, les faire signer à distance (lien à token) et faire le procès-verbal de retour.

Stack : HTML/CSS/JS vanilla, **zéro dépendance** (contrainte du dépôt), Supabase (tables
`reservations`, `contracts`, `owner_settings` ; RPC `security definer` ; 8 migrations),
une Edge Function `contract-email` (Resend), Vercel (auto-deploy sur `main`).

Romain a transmis neuf demandes. Ce document fixe ce qu'on construit, ce qu'on ne
construit pas, et dans quel ordre.

### Ce qui existe déjà et qu'on réutilise

| Demande | Déjà en place |
|---|---|
| Conditions d'annulation | Rédigées mot pour mot dans les CGV du site (§5) et dans la FAQ (HTML + JSON-LD `FAQPage`) |
| État des lieux de retour | Type `retour` de la table `contracts`, avec lien de partage et signature locataire (`envLrSig`) |
| PDF | jsPDF chargé dans `/app`, `downloadContractPDF(c)` côté admin |
| Signature | Canvas de signature (propriétaire et locataire), stockée en PNG base64 |
| Lien locataire | `access_token` 128 bits, RPC `fetch_contract_by_token` / `submit_contract_by_token` (migration 006) |
| Matériel de sport | FAQ « surf, stand-up paddle, kayak gonflable : 10 €/jour » |

### Défauts constatés pendant le cadrage, corrigés au passage

- Le bandeau du site n'affiche que le texte « RB-CapSO » ; le logo image n'existe que dans le hero et le footer.
- La formule de prix existe en **trois copies** (`updateBookingBar`, `showBookingForm`, `calcTot` dans `/app`) et diverge déjà : le site annonce la tente « 40–60 €/j », le code calcule 50.
- Le forfait kilométrique n'a aucun effet sur l'estimation affichée.
- La grille d'annulation se chevauche : « entre 15 et 30 jours » et « entre 7 et 15 jours » — le 15ᵉ jour tombe dans les deux.
- La FAQ existe en double (HTML visible + JSON-LD pour Google) : toute modification doit toucher les deux.
- Le comparatif départ/retour (`buildCmp`) lit les champs du formulaire de contrat *en session*, pas la base : vide dès que Romain fait le retour un autre jour.
- `CLAUDE.md` renvoie vers `tasks/lessons.md`, qui n'existe pas.

## 2. Arbitrages (validés le 06/09/2026, révisés le 07/09 sur les réponses de Romain)

Romain a répondu le 06/09 au soir, après le cadrage, sur WhatsApp : options au jour et
linge une fois (confirmé), **frais de service uniquement sur le contrat**, **totalité du
montant à la réservation** (pas d'acompte), paiement en ligne à voir avec sa banque
(Pennylane) ou Stripe, caution : il étudie l'empreinte bancaire. Les lignes 2 et 5
ci-dessous reflètent ses réponses ; le reste est inchangé.

| # | Sujet | Décision |
|---|---|---|
| 1 | Options | Surf, paddle, canoë-kayak : **10 €/jour** chacun. Kit linge de lit : **25 € par location**. |
| 2 | Frais de service 70 € | **Contrat uniquement** (Romain, 06/09) : le site et la demande estiment hors frais (`sans_frais`), les CGV §3 les annoncent, le contrat les porte. |
| 3 | Pièce d'identité | **Upload** dans un bucket Supabase privé, URL signée, **purge automatique 6 mois** après la fin de la location. |
| 4 | Paiement | **Stripe Payment Links** générés par une Edge Function. Compte Stripe **à créer par Romain** (bloquant pour la prod, pas pour le développement en mode test). |
| 5 | Règlement | **Totalité à la réservation**, à la signature du contrat (Romain, 06/09) ; pas d'acompte ni de solde. Le lot 5 génère donc un seul lien de paiement. |
| 6 | Caution | **Reste au chèque** (2 000 € vans / 500 € tente), CGV §4 inchangé. |
| 7 | Documents | **3 documents signables** : contrat de réservation, état des lieux de départ, état des lieux de retour. |
| 8 | Photos EDL | **Upload réel** de photos au départ et au retour (même bucket que la pièce d'identité). |
| 9 | PDF locataire | **Les deux signatures** : la projection du RPC token expose l'image de signature du propriétaire. |
| 10 | Frais annulés | Les 70 € sont **non remboursables** en cas d'annulation. |
| 11 | Frontière annulation | « de 15 à 30 jours **inclus** : 50 % », « de 7 à 14 jours : 25 % ». |
| 12 | TVA | Romain est auto-entrepreneur (SIRET au footer) : mention « TVA non applicable, art. 293 B du CGI ». |

Valeurs par défaut non contestées : logo dans le bandeau avec le mot-marque conservé
(voir §4.1), Instagram dans le bandeau + menu mobile + footer, case « j'accepte les
conditions d'annulation » obligatoire, terrain clos gratuit et systématique, tente de toit
alignée sur 50 €/j, options surf/paddle/kayak proposées aussi avec la tente, forfait km
retiré pour la tente.

## 3. Découpage en lots et ordre de livraison

Deux contraintes fixent l'ordre : le compte Stripe à créer, et la discipline documentée
dans `supabase/APPLY.md` — **migration → Edge Function → frontend**, jamais l'inverse.
Chaque lot = un worktree = une PR draft (skill `ship`). Le dépôt est de tier SOLIDE : rien
ne part en prod sans l'OK explicite d'Antonin.

| PR | Branche | Lots | Migration | Bloqué par |
|---|---|---|---|---|
| 1 | `feat/site-vitrine` | Bandeau, Instagram, terrain clos, CGV, FAQ + ces docs | — | — |
| 2 | `feat/estimation-options` | Estimation visible, options, forfaits, tarif partagé | 009 | — |
| 3 | `feat/documents-signables` | 3 documents, annulation au contrat, PDF locataire | 010 | — |
| 4 | `feat/identite-photos` | Pièce d'identité, photos EDL, purge, confidentialité | 011 | PR 3 |
| 5 | `feat/stripe-acompte` | Payment Links acompte/solde, webhook, récap paiement | 012 | PR 3 + compte Stripe |

Le plafond `ship` est de 3 sujets ouverts par dépôt : PR 4 et 5 s'ouvrent quand une des
trois premières est mergée.

## 4. Design par lot

### 4.1 PR 1 — Site vitrine (`web/index.html` seul, zéro base)

**Bandeau.** Le lien `.nav-logo` contient l'image `/assets/photo-01-5fb49c7f.png`
(300×300, losange orange) à **52 px** de haut sur desktop, **44 px** sous 480 px, suivi du
mot-marque « RB-CapSO » existant. Le mot-marque est conservé : à toute taille compatible
avec un bandeau de 70 px, le lettrage à l'intérieur du losange reste illisible ; c'est le
texte qui rend la marque lisible, le losange qui la rend reconnaissable. `alt=""` sur
l'image (décorative, le texte porte le nom), le lien garde son nom accessible.

**Instagram.** Icône SVG + `aria-label="Instagram"` dans `.nav-links` (avant le CTA
Contact), lien texte « Instagram » dans le menu mobile, et ligne « Suivez-nous sur
Instagram » dans la première colonne du footer. Tous vers `https://www.instagram.com/rb.capso/`,
`target="_blank" rel="noopener"`. Les liens de contact existants ne bougent pas.

**Terrain clos.** Phrase ajoutée à la réponse « Où récupérer le van ? » — dans le
`<details>` de la FAQ **et** dans le JSON-LD `FAQPage` :
« Votre véhicule peut être stationné dans un terrain clos pendant toute la durée de la location. »
Le §6d des CGV reçoit la même phrase.

**CGV et FAQ (annulation, tarifs, options).**
- §5 : « De 15 à 30 jours inclus avant le départ : 50 % … De 7 à 14 jours : 25 % … »
  + « Les frais de service (70 €) ne sont pas remboursables, quelle que soit la date d'annulation. »
- §3 : « Des frais de service de 70 € par location s'ajoutent au prix de la location et
  sont inclus dans l'estimation affichée sur le site. Options : planche de surf, stand-up
  paddle, canoë-kayak 10 €/jour chacun ; kit linge de lit 25 € par location. TVA non
  applicable, art. 293 B du CGI. »
- §2 : « Un acompte de 30 % du montant total est versé à la signature du contrat ; le
  solde est réglé au plus tard le jour du départ. »
- FAQ « conditions d'annulation » (HTML + JSON-LD) : mêmes frontières.
- FAQ « matériel de sport » (HTML + JSON-LD) : ajout du kit linge de lit 25 €.

Le site n'a pas besoin de migration : l'estimation elle-même arrive en PR 2.

### 4.2 PR 2 — Estimation et options

**Formule.**

```
total = jours × (prix_véhicule + supplément_km + 10 × nb_matériel)
      + 25 si kit linge
      + 70 (frais de service)
```

Pour la tente de toit : pas de forfait km (cartes masquées, `supplément_km = 0`).
Les options restent proposées. La caution n'entre pas dans le total ; elle est rappelée
en note (« Caution 2 000 € par chèque, non incluse »).

**Une seule source de vérité, dupliquée à l'identique.** Le projet n'a pas de système de
modules et refuse toute dépendance. Le bloc suivant vit **à l'identique** dans les deux
fichiers HTML, entre les marqueurs `// ═══ TARIF PARTAGÉ (début) ═══` et `(fin)` :

```js
const TARIF = {
  forfaits: [{l:'100 km/jour',k:100,e:0},{l:'200 km/jour',k:200,e:15},{l:'Illimité',k:null,e:25}],
  options: [
    {id:'surf',   l:'Planche de surf',  jour:10},
    {id:'paddle', l:'Stand-up paddle',  jour:10},
    {id:'kayak',  l:'Canoë-kayak',      jour:10},
    {id:'linge',  l:'Kit linge de lit', fixe:25}
  ],
  frais_service: 70,
  km_sup: 0.30
};
function calculerEstimation({jours, prix_jour, forfait, options, sans_km}) → {lignes:[{id,l,cents}], total_cents}
function fmtEuros(cents) → '530 €' | '47,50 €'
```

Montants en **centimes entiers** (convention du dépôt, migration 007 : « jamais en
float »). `web/pricing.test.js`, sur le modèle exact de `date-utils.test.js`, extrait ce
bloc des **deux** fichiers livrés, vérifie qu'ils sont identiques octet pour octet, puis
vérifie les montants sur des cas fixés (3 jours Pénélope 200 km/j surf + linge = 530 € ;
tente 2 jours avec forfait demandé = forfait ignoré ; demi-journée côté /app). La CI
lance déjà tous les `web/**/*.test.js`.

Dans `/app`, `FORFS` devient un alias de `TARIF.forfaits` ; `calcTot()` appelle
`calculerEstimation` puis soustrait la réduction saisie par Romain.

**Site — interface.** Dans le modal de réservation :
- Étape 1 (bandeau après sélection des dates) : le total estimé passe en `<strong>` 18 px
  sur sa propre ligne, plus la mention « frais de service inclus ».
- Étape 2 (formulaire) : sous les cartes forfait, un `<fieldset>` « Options » avec quatre
  cases à cocher natives (`<label><input type="checkbox">`), puis un bloc `#bookEstimate`
  (`role="status"`, `aria-live="polite"`) listant les lignes et le total, mis à jour à
  chaque changement de forfait ou d'option. Pour la tente, le `<fieldset>` forfait est
  masqué (`hidden`) et son radio désélectionné.
- L'annonce lecteur d'écran (`calAnnounce`) reprend le total.

**Base — migration `009_options_estimation.sql`.**
- `reservations.options jsonb not null default '[]'` (tableau d'ids : `["surf","linge"]`),
  `reservations.estimation_cents integer` (ce que le client a vu), contrainte
  `estimation_cents is null or estimation_cents >= 0`.
- Nouvelle surcharge `submit_booking(… 9 args …, p_options jsonb, p_estimation_cents integer)`
  — **11 arguments, tous requis**. L'ancienne signature à 9 arguments est **conservée**
  et réécrite comme simple relais vers la nouvelle avec `'[]'::jsonb, null` : entre
  l'application de la migration et le déploiement Vercel, le site en prod continue de
  fonctionner, et Postgres ne voit aucune ambiguïté de résolution (arités différentes,
  aucun défaut sur la nouvelle). Validation côté base : `p_options` est un tableau JSON
  dont chaque élément ∈ {surf, paddle, kayak, linge}.
- La vue `reservations_public` n'expose pas `options` (inutile côté public).

**Propagation.** `submitCalendarBooking` (site) et `submitDemande` (/app) envoient
`p_options` + `p_estimation_cents` ; l'email web3forms liste options et estimation ;
l'événement GA4 `demande_reservation` gagne `options` (ids séparés par virgule) et
`estimation` (euros). La carte « demande » de `/app` affiche options et estimation ;
`prefillContratFromDemande` reporte les options dans le contrat.

**Contrat (/app, étape Location).** Quatre cases « Options » identiques ; `calcTot`
produit sous-total (location + km + options), frais de service, réduction, total. Ces
lignes entrent dans `collectC()` (`options`, `frais_service`, `stot`, `total`) et dans
le PDF/récap. La ligne « Frais de service : 70 € » est systématique.

### 4.3 PR 3 — Trois documents signables, annulation au contrat, PDF locataire

**Modèle.** La table `contracts` garde une ligne par document. `type` accepte une
nouvelle valeur `edl_depart`. Nouvelle colonne `parent_id uuid references contracts(id)
on delete set null` (index) ; le champ `payload.ref_code` existant reste écrit pour
l'affichage, comme le fait déjà le retour.

```
contrat (presentiel) ──┬── edl_depart (parent_id → contrat)
                       └── retour     (parent_id → contrat)
```

**Contrat de réservation (/app, page Contrat).** Six étapes : Véhicule, Propriétaire,
Conducteurs, Location, Signatures, Récap. L'étape « Équipements » et le bloc « État du
véhicule au départ » (carburant, eau, état, propreté, carrosserie, batterie, observations,
vidéos) **quittent** le contrat. Le récap et le PDF gagnent : lignes de prix (location, km,
options, frais de service, réduction, total), acompte 30 % et solde, mention TVA 293 B,
texte des conditions d'annulation (identique aux CGV), ligne « Conditions acceptées par
le locataire le … ».

**État des lieux de départ (/app, nouvelle page « EDL départ »).** Six étapes : Contrat
associé (code → charge véhicule, locataire, dates, km départ, forfait, jours), Équipements
(la grille `eqi` déplacée), État (les six sélecteurs + km compteur + observations),
Photos/vidéos (déclaratif en PR 3, upload réel en PR 4), Signatures (propriétaire et
locataire), Récap + partage (lien, SMS, WhatsApp, email, PDF). Sauvegarde :
`type='edl_depart'`, `parent_id` = id du contrat, `payload.ref_code` = code du contrat.

**Retour.** `loadRetourRef` charge le contrat **et** le dernier `edl_depart` lié ; le
comparatif et le km départ lisent l'EDL départ stocké (repli : les champs de session,
comportement actuel). `parent_id` renseigné à la sauvegarde.

**Liste « Mes contrats ».** Exclut `edl_depart` et `retour` des lignes principales ; sous
chaque contrat, badges « EDL départ fait le … » / « Retour effectué le … » avec leur PDF,
ou boutons « 📝 EDL départ » / « 🔄 Retour » pour les créer.

**Vue locataire.** Trois branches selon `type` : contrat (parcours existant + étape
« Conditions »), `edl_depart` (nouveau, calqué sur le retour : équipements + état +
signature), `retour` (existant). Après signature **et** à chaque réouverture d'un lien
déjà signé : bouton « Télécharger mon document (PDF) ».

**Conditions d'annulation.** Texte unique `ANNULATION_TEXTE` dans `/app` (même contenu
que les CGV §5 du site, frais non remboursables inclus). Affiché dans l'étape
« Conditions » du parcours locataire avec une case `<input type="checkbox" required>`
« J'ai lu et j'accepte les conditions d'annulation ». Le RPC `submit_contract_by_token`
**refuse** la signature d'un contrat (`type` ∈ {presentiel, distance}) si le patch ne
contient pas `cgv_accept = true` ; il horodate `cgv_accept_date` côté serveur
(`now()`), jamais depuis le client.

**Migration `010_documents_signables.sql`.**
- Contrainte `contracts_type_check` élargie à `edl_depart` ; colonne `parent_id` + index.
- `fetch_contract_by_token` : projection élargie de **sig_prop** (image), **signature_loc**
  (l'image du locataire, pour le PDF à la réouverture), **p_adr / p_tel / p_mail**
  (coordonnées professionnelles de Romain, déjà publiques sur le site — `p_ass` reste
  exclu), des clés de tarif (`options`, `frais_service`, `acompte`, `solde`,
  `tva_mention`), des clés d'EDL (`equipements`, `prop`, `bat`, `vid_ext`, `vid_int`,
  `vid_note`, `photos`) et de `cgv_accept`, `cgv_accept_date`, `parent_id`.
- `submit_contract_by_token` : liste blanche + `cgv_accept` ; refus si absent pour un
  contrat ; horodatage serveur.

Décision de sécurité assumée : l'image de signature du propriétaire sort avec le token
du document concerné — le même secret qui donne déjà accès aux données personnelles du
locataire. Le durcissement de la migration 006 visait le brute-force du code à 4
chiffres, pas cette exposition.

**Edge Function `contract-email`.** Sujets et corps selon `type` : « Votre contrat de
location à signer », « Votre état des lieux de départ à signer », « Votre procès-verbal
de retour à signer » ; notification à Romain typée de même.

### 4.4 PR 4 — Pièce d'identité et photos

**Stockage — migration `011_documents_bucket.sql`.** Bucket `documents` **privé**
(`public = false`), limite 8 Mo par fichier, types `image/jpeg`, `image/png`,
`image/webp`, `application/pdf`. Chemins : `identites/<contract_id>/<uuid>.<ext>` et
`edl/<contract_id>/<depart|retour>/<uuid>.<ext>`. Policies `storage.objects` :
- admins (email ∈ `admins`) : tout ;
- anon : **aucune** policy directe. Le locataire téléverse via une URL signée
  d'upload obtenue par un nouveau RPC `create_upload_url_by_token(p_token, p_kind,
  p_ext)` (security definer) qui vérifie le token et le statut `pending`, puis renvoie
  un chemin + jeton d'upload signé (`storage.create_signed_upload_url` via l'API
  Storage côté Edge Function `documents-upload`, car les URL signées ne se créent pas
  en SQL). Le chemin retenu est inscrit dans `payload.id_doc` / `payload.photos[]`
  par `submit_contract_by_token` (clés en liste blanche, validées par regex sur le
  préfixe attendu).
- Lecture par Romain : URL signées 10 min générées côté client admin (`createSignedUrl`).

**Purge.** Job `pg_cron` quotidien `purge_documents` : supprime les objets de
`storage.objects` dont le contrat lié a `payload->>'fin'` (date de retour) antérieure à
**6 mois**, puis efface les références dans le payload. 6 mois et pas 3 : un avis de
contravention peut arriver plusieurs mois après ; pas 5 ans : la politique de
confidentialité annonce 5 ans pour les données comptables, une copie de CNI n'en est pas
une.

**Interface.** Parcours locataire, étape Infos : `<input type="file"
accept="image/*,application/pdf" capture="environment">` avec aperçu, taille contrôlée
côté client (≤ 8 Mo) et rappel « ou envoyez-la en réponse à l'email de confirmation ».
EDL départ/retour (admin) : même contrôle, plusieurs fichiers, vignettes ; l'EDL retour
affiche les photos de départ en regard. PDF : les photos ne sont pas incorporées (poids) ;
le PDF liste « N photo(s) jointe(s), consultables dans l'application ».

**Politique de confidentialité.** Nouvelle rubrique : « Copie de la pièce d'identité et
photos d'état des lieux : conservées 6 mois après la fin de la location, puis supprimées
automatiquement. Stockage chiffré chez Supabase (Europe). »

### 4.5 PR 5 — Stripe : acompte 30 % et solde

**Prérequis hors dépôt.** Compte Stripe vérifié (Romain). Secrets Supabase :
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Jamais dans le repo, jamais côté client.

**Migration `012_paiements.sql`.** `contracts.paiements jsonb not null default '{}'` :
`{acompte:{cents, url, stripe_id, status, paid_at}, solde:{…}}`. Colonne exposée dans
la projection token (le locataire voit ses liens et leur statut).

**Edge Function `payment-link`** (admin authentifié) : reçoit `contract_id` + `kind`
(`acompte` | `solde`), calcule le montant depuis le payload (30 % du total arrondi au
centime ; solde = total − acompte), crée un Payment Link Stripe (`line_items` avec
`price_data` inline, `metadata.contract_id`, `metadata.kind`, `after_completion` →
`APP_URL?t=<token>&paye=1`), stocke url/id dans `paiements`, renvoie l'URL.

**Edge Function `stripe-webhook`** : vérifie la signature (`STRIPE_WEBHOOK_SECRET`),
traite `checkout.session.completed`, marque `paiements.<kind>.status = 'paid'` +
`paid_at`, notifie Romain (réutilise Resend). Idempotent sur `stripe_id`.

**Interface.** Admin : bouton « Générer le lien d'acompte » à la création du lien de
signature, « Générer le lien du solde » ensuite ; statut payé/en attente. Locataire :
après signature, bloc « Régler l'acompte de X € » (lien Stripe), puis récapitulatif :
location, options, frais de service, total, acompte, solde, caution par chèque, TVA
293 B. Email d'invitation : le lien d'acompte y figure si déjà généré.

**Développement en mode test** (`sk_test_…`) tant que le compte n'est pas vérifié ;
bascule live = changement de deux secrets, sans redéploiement.

## 5. Accessibilité

La CI exécute axe (WCAG 2.1 AA) sur `/`, `/calendar/`, `/app/`, `/stats/` avec un
baseline qui ne peut que décroître (`.github/a11y-baseline.json`, jamais enrichi pour
faire passer une PR). Chaque PR : revue par l'agent `accessibility-lead` sur le diff
avant `ship ready`, et respect des patrons déjà en place — radios/checkbox natifs dans
des `<fieldset>`/`<legend>`, erreurs persistantes liées par `aria-describedby`, annonces
via les conteneurs `role="status"` statiques, `aria-disabled` plutôt que `disabled` sur
les boutons d'envoi, focus rendu au déclencheur.

## 6. Tests

- `node web/pricing.test.js` (nouveau) : identité des deux blocs tarif + montants.
- `node web/date-utils.test.js`, `node web/live-regions.test.js`, `node web/api/stats.test.js` : inchangés, doivent rester verts.
- Migrations : appliquées sur un Supabase local (`supabase start` + `supabase db reset`
  sur une copie des migrations) et RPC exercés en SQL — refus des options invalides,
  refus de signature sans `cgv_accept`, relais de l'ancienne signature `submit_booking`.
- Prévisualisation Vercel de chaque PR ouverte dans le navigateur : bandeau, estimation,
  parcours de réservation au clavier.

## 7. Hors périmètre

- Création du compte Stripe, pose des secrets (Romain / Antonin).
- Application des migrations en prod et merges : sur OK explicite d'Antonin.
- Page « Proprio à distance » (`#page-proprio`, `display:none!important`) : masquée
  aujourd'hui, non touchée.
- Regénération de `graphify-out/` : jamais depuis une branche, PR dédiée après merges.
- `tasks/lessons.md` manquant : signalé, non créé ici.
