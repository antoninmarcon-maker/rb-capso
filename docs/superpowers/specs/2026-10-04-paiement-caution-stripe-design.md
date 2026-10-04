# Paiement en ligne et caution par empreinte Stripe — design

Date : 04/10/2026. Demandeur : Antonin. Remplace le §4.5 de
`2026-09-06-refonte-site-app-design.md` (acompte/solde par Payment Links), devenu caduc :
Romain a choisi la totalité à la réservation, et la caution passe à l'empreinte.

## 1. Intention

- Le locataire paie sa location **dans l'app, depuis le contrat qu'il reçoit**, et
  enregistre **obligatoirement** sa carte pour la caution.
- La caution est **bloquée automatiquement** sur cette carte la veille du départ, sans
  action du client ni de Romain.
- Romain **suit et pilote** paiement et caution depuis « Mes contrats » et l'écran Retour.
  Il peut tout déclarer à la main (virement reçu, caution par chèque) : c'est lui qui gère.

Critère de succès : un contrat signé avec paiement en ligne arrive le jour du départ avec
« Payé » et « Caution bloquée » sans qu'aucun humain n'ait touché Stripe, et Romain libère
ou retient la caution en un clic au retour.

Validé par le test réel du 04/10/2026 (empreintes manuelles sur `/caution/*`, PR #60).

## 2. Décisions

| # | Sujet | Décision |
|---|---|---|
| 1 | Modes de paiement | **Au choix** : « Carte bancaire en ligne » (nouveau, en tête) ou les modes existants (virement, espèces, PayPal, chèque). |
| 2 | Carte pour la caution | **Obligatoire** dans tous les cas, sauf si Romain déclare la caution « gérée hors ligne ». |
| 3 | Paiement hors ligne | Romain clique « Marquer payé » quand le virement/espèces arrive. Pas d'automatisme. |
| 4 | Empreinte | Posée par une tâche planifiée **la veille du départ** (immédiatement si le départ est à moins de 24 h), renouvelée **tous les 4 jours** pour les locations longues. |
| 5 | Montant de caution | `payload.caution` du contrat (saisi par Romain : 3 000 / 2 000 / 500 €). |
| 6 | Montant payé | `payload.total` du contrat, **lu côté serveur**, jamais transmis par le navigateur. |
| 7 | Écran de paiement | **Stripe Checkout hébergé** (redirection). Aucune donnée carte ne touche nos serveurs. |
| 8 | Remboursement (annulation) | Depuis le dashboard Stripe, hors app. |
| 9 | Libérer / retenir | Depuis l'app (Mes contrats et écran Retour). |

## 3. Parcours locataire

1. Le locataire ouvre son lien (`/app?t=<token>`), complète et signe comme aujourd'hui.
2. Étape paiement : il choisit son mode. « Carte bancaire en ligne » est proposé en premier.
3. Après signature, un bloc unique s'affiche :
   - mode **carte en ligne** : « Payer X € et enregistrer ma carte pour la caution » ;
   - **autre mode** : « Enregistrer ma carte pour la caution de Y € (aucun débit) ».
4. Le bouton appelle `paiement` (action `checkout`) avec le token. Redirection vers Stripe
   Checkout :
   - carte en ligne : `mode=payment`, montant = total, `payment_intent_data.setup_future_usage=off_session` ;
   - autre mode : `mode=setup` (carte enregistrée, rien de débité).
   Texte Checkout : la carte sera utilisée pour une empreinte de Y € la veille du départ,
   débitée seulement en cas de dommage constaté à l'état des lieux (CGV §4).
5. Retour sur `/app?t=<token>&stripe=ok` : récapitulatif « Payé ✓ / Paiement par virement
   attendu » et « Carte enregistrée ✓ — caution de Y € bloquée le JJ/MM ».
6. Tant que la carte n'est pas enregistrée, le lien du contrat réaffiche le bloc 3 (reprise
   possible à tout moment). Annulation sur Stripe → retour avec `stripe=annule`, bloc 3
   réaffiché.

## 4. Caution automatique

Tâche `pg_cron` horaire → `pg_net` POST vers `paiement` (action `cron`, secret partagé).
La fonction, pour chaque contrat signé, non annulé, `caution.mode = 'auto'` :

- **Poser** : carte enregistrée, aucune empreinte active, départ ≤ 24 h → PaymentIntent
  `amount = caution`, `capture_method=manual`, `off_session=true`, `confirm=true`,
  `customer` + `payment_method` enregistrés, `metadata.contract_id`, clé d'idempotence
  `caution-<contract_id>-<n>`.
- **Renouveler** : empreinte active posée depuis ≥ 4 jours et retour pas encore effectué →
  nouvelle empreinte, puis annulation de l'ancienne seulement si la nouvelle a réussi.
- **Échec** (carte refusée, authentification exigée) : `caution.status = 'echec'`, motif
  Stripe conservé, email à Romain (une fois par tentative). Pas de nouvelle tentative
  automatique avant le passage suivant (1 h) ; 3 échecs → arrêt, action manuelle de Romain.

La fenêtre de 4 jours couvre la fenêtre Visa la plus courte (4 j 18 h en transaction
initiée par le marchand).

## 5. Pilotage par Romain

**Mes contrats** — deux pastilles par carte de contrat :

- Paiement : `En attente (mode)` · `Payé en ligne ✓` · `Payé (déclaré)` ;
- Caution : `Carte manquante` · `Carte enregistrée` · `Bloquée jusqu'au JJ/MM` ·
  `Libérée` · `Retenue X €` · `⚠️ Échec` · `Gérée hors ligne`.

Actions (menu sur la carte) :

| Action | Effet |
|---|---|
| Marquer payé | `paiement.status = 'paye_manuel'`, mode et date. Réversible. |
| Caution gérée hors ligne | `caution.mode = 'manuel'` : compte comme faite, aucune empreinte auto. Réversible tant qu'aucune empreinte n'est active. |
| Poser l'empreinte maintenant / Réessayer | Même logique que la tâche, immédiatement. |
| Libérer la caution | Annule le PaymentIntent actif. |
| Retenir un montant | Capture partielle (≤ montant bloqué) ; le reste est libéré par Stripe. Confirmation obligatoire avec le montant en clair. |

**Écran Retour** : « Caution restituée » cochée → propose « Libérer la caution maintenant » ;
décochée → champ « Montant retenu » + « Retenir ». Rien ne part sans clic explicite.

## 6. Architecture

### Données — migration `014_paiement_caution.sql`

Deux colonnes sur `contracts`, écrites **uniquement** par la fonction (service role) ou par
des RPC admin dédiés ; jamais par `submit_contract_by_token` :

```
paiement jsonb not null default '{}'
  { mode, status: attente|paye_en_ligne|paye_manuel, montant_cents,
    checkout_session_id, payment_intent_id, paid_at }
caution jsonb not null default '{}'
  { mode: auto|manuel, status: carte_manquante|carte_ok|bloquee|liberee|retenue|echec|manuel,
    montant_cents, customer_id, payment_method_id, payment_intent_id, bloquee_le,
    expire_vers, retenu_cents, echecs, dernier_motif, historique: [...] }
```

`fetch_contract_by_token` expose au locataire une **projection** : statuts, montants,
dates. Jamais les identifiants Stripe. Le nom `paiements` (tableau des modes, dans
`payload`) reste inchangé.

Table `stripe_events (id text primary key, recu_le timestamptz)` pour l'idempotence du webhook.
Job `pg_cron` `caution-empreintes`, horaire.

### Fonction `paiement` (une seule, un seul déploiement par le dashboard de Romain)

| Action | Appelant | Contrôle |
|---|---|---|
| `checkout` | locataire (anon) | token valide (≥ 24 car.), contrat signé, carte pas encore enregistrée |
| `webhook` | Stripe | signature `Stripe-Signature` (`STRIPE_WEBHOOK_SECRET`) |
| `admin` (`marquer_paye`, `caution_manuelle`, `poser`, `liberer`, `retenir`) | Romain | JWT Supabase d'un admin (table `admins`) |
| `cron` | pg_net | en-tête secret `CRON_SECRET` |

Webhook traité : `checkout.session.completed` (paiement et/ou carte enregistrée),
`payment_intent.amount_capturable_updated`, `payment_intent.canceled` (expiration),
`payment_intent.payment_failed`. Idempotent via `stripe_events`.

Secrets Supabase : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`.
`verify_jwt` désactivé sur la fonction (le webhook et le cron n'ont pas de JWT) ; chaque
action fait son propre contrôle.

### Emails (via `contract-email` / Resend)

Romain : paiement reçu, carte enregistrée, empreinte posée, échec d'empreinte.
Locataire : confirmation de paiement, caution libérée ou montant retenu.

## 7. Erreurs et cas limites

- Contrat modifié après paiement (total changé) : pas de rattrapage auto ; Romain voit le
  montant payé à côté du total et gère l'écart hors app.
- Contrat annulé : la tâche ignore les contrats `cancelled` ; une empreinte active est
  libérée à l'annulation.
- Double clic / double webhook : clés d'idempotence Stripe + `stripe_events`.
- Paiement réussi mais webhook en retard : le retour `stripe=ok` affiche « paiement en
  cours de confirmation » jusqu'à la mise à jour.
- Carte expirée avant le départ : échec d'empreinte → email Romain → il relance le client
  (le lien du contrat permet de réenregistrer une carte quand `caution.status = 'echec'`).

## 8. Tests et mise en service

- Mode test Stripe sur le compte RB-CapSO (`sk_test_…`), cartes de test Stripe : succès,
  refus, 3D Secure exigé, `4000 0000 0000 0341` (attache OK, débit refusé).
- Tests node sur la logique pure (calcul des montants, choix poser/renouveler/rien).
- Migration rejouée sur Supabase local ; RPC exercés en SQL.
- CI existante (tests node, axe WCAG AA) verte.
- Bascule live : remplacement des deux clés Stripe + webhook live, sans redéploiement.
- Ordre de mise en prod : migration → fonction + secrets → webhook Stripe → merge du front.

## 9. Hors périmètre

- Remboursements et annulations (dashboard Stripe).
- Modification des CGV (session dédiée en cours, doit intégrer l'autorisation de
  prélèvement de la caution sur la carte enregistrée).
- Pages `/caution/*` : conservées comme solution de secours manuelle.
