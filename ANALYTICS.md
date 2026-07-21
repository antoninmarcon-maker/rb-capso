# Analytics RB-CapSO

Objectif : Romain veut voir le nombre de visiteurs, le nombre de clics sur
les actions qui comptent (téléphone, email, WhatsApp, Instagram), et suivre
ses indicateurs dans le temps. Une campagne Google Ads tourne en parallèle.

## État au 2026-07-21

| Élément | État |
|---|---|
| Conteneur GTM `GTM-MRM597NW` | en production sur les 3 pages |
| Propriété GA4 `G-99EMNQYCK1` | créée, balise publiée (version 2 du conteneur) |
| Consent Mode v2 | en production, câblé au bandeau du site |
| Événement `demande_reservation` | en production dans `submitDemande()` |
| Événement `section_vue` | en production sur la page publique |
| Déclencheurs de clic (tel, mail, WhatsApp, Instagram) | **à faire dans GTM** |
| Google Ads | **à faire** |

GA4 collecte depuis la publication de la version 2 du conteneur.

## La règle de consentement

Décision d'Antonin : **l'absence de réponse vaut acceptation.**

- le visiteur clique Accepter : mesuré
- le visiteur ne clique sur rien : mesuré
- le visiteur clique « Refuser les non-essentiels » : non mesuré,
  immédiatement et à ses visites suivantes

Techniquement, `Consent Mode v2` est initialisé à `granted` sauf si
`localStorage.rb_cookies_v2` vaut `min`. Le bloc est inline dans le `<head>`
des 3 pages et **doit rester avant le snippet GTM** : sinon GA4 envoie une
page vue avant que le refus soit appliqué. Les 3 blocs sont identiques,
un `md5` sur la section le vérifie.

La clé porte `_v2` volontairement. `rb_cookies` existait déjà pour le
bandeau d'origine, qui ne mentionnait que les cookies techniques. Ajouter la
mesure d'audience est une nouvelle finalité : sans changement de clé, tous
les visiteurs déjà venus auraient été mesurés sans jamais voir de bandeau le
mentionner. **Si une nouvelle finalité est ajoutée un jour (publicité,
reciblage), il faut à nouveau incrémenter la clé.**

### Limites connues, assumées

- **Le bandeau n'existe que sur la page publique.** `/app` et `/calendar`
  portent le même conteneur et respectent un refus déjà exprimé, mais
  n'offrent aucun moyen de refuser. Or `copierLienDem()` génère des liens
  `/app?demande=...` envoyés directement aux clients : pour eux, c'est une
  page d'entrée sans bandeau. À traiter si la conformité devient un sujet.
- **La première page vue part avant tout refus.** Conséquence directe de la
  règle « pas de réponse = acceptation ». Un refus coupe la suite, pas la
  vue initiale.
- **Les chiffres sont un plancher.** Les visiteurs qui refusent ne sont pas
  comptés.
- **Les pages admin sont incluses**, donc la navigation de Romain se mélange
  à celle des clients. Filtrer dans GA4 → Admin → Filtres de données sur le
  chemin de page si ça brouille les chiffres.

## Ce qui reste à faire

### 1. Les déclencheurs de clic, dans GTM

Activer d'abord les variables de clic, une seule fois :
**Variables** → Configurer → cocher le bloc **Clics**.

Puis 4 déclencheurs **Clic - Liens uniquement**, condition sur `Click URL` :

| Action | Condition | Nom de l'événement GA4 |
|---|---|---|
| Téléphone | contient `tel:` | `clic_telephone` |
| Email | contient `mailto:` | `clic_email` |
| WhatsApp | contient `api.whatsapp.com` | `clic_whatsapp` |
| Instagram | contient `instagram.com` | `clic_instagram` |

Une balise **Google Analytics : événement GA4** par déclencheur, pointant la
balise Google existante. Zéro code.

Tant que ce n'est pas fait, GA4 ne compte pas les clics téléphone et email :
sa « mesure améliorée » ne considère pas `tel:` et `mailto:` comme des clics
sortants.

### 2. Les événements déjà envoyés par le code

Ces deux-là existent déjà dans le `dataLayer`, il reste à créer la balise
GA4 correspondante dans GTM (déclencheur : **Événement personnalisé**, avec
le nom exact) :

- `demande_reservation`, avec `vehicule`, `forfait`, `nb_nuits`. Poussé
  seulement après écriture en base, donc une demande refusée pour dates
  indisponibles ne compte pas. Aucune donnée personnelle.
- `section_vue`, avec `section`. Une fois par section et par chargement.
  Valeurs : `vans`, `penelop`, `peggy`, `tente`, `conception`, `apropos`,
  `faq`, `contact`, `devis`.

Les slugs de véhicules sont alignés sur ceux de la réservation (`penelop`
sans `e`), pour pouvoir croiser vues et conversions par véhicule.

Puis GA4 → Admin → **Événements clés** : marquer `demande_reservation`,
`clic_telephone`, `clic_email`, `clic_whatsapp`. Ils n'apparaissent dans la
liste qu'après avoir été déclenchés au moins une fois, compter 24 h.

### 3. Google Ads

**D'abord, vérifier la stratégie d'enchères.** Si elle est réglée sur les
conversions, elle optimise à vide tant qu'aucune conversion ne remonte, et
elle dépense pendant ce temps. La basculer sur **Maximiser les clics**, puis
la remettre aux conversions quand le suivi enverra des données. C'est
l'action la moins technique et la plus coûteuse à ne pas faire.

Ensuite :

1. Google Ads → Objectifs → Conversions → Nouvelle action → **Site web**.
   Tu obtiens un `AW-XXXXXXXXX` et un libellé.
2. Dans GTM, poser la balise **Lien de conversion** sur **All Pages**, avant
   tout le reste. Sans elle, l'attribution casse sur iOS et Romain conclura
   à tort que ses annonces ne convertissent pas.
3. Puis la balise de conversion Google Ads.
4. GA4 → Admin → **Liaisons de produits** → Google Ads.

Attention : ajouter de la publicité est une nouvelle finalité. Il faudra
incrémenter la clé de consentement (`rb_cookies_v3`) et mettre à jour le
texte du bandeau et la politique cookies, qui aujourd'hui ne parlent que de
mesure d'audience.

## Ce que Romain regarde

- **Rapports → Acquisition → Vue d'ensemble** : combien de visiteurs, et
  d'où ils viennent
- **Rapports → Engagement → Événements** : les clics et les demandes
- **Temps réel** : utile pour vérifier que tout fonctionne

Les données se stabilisent en 24 à 48 h.

## Revenir en arrière sur le consentement

Pour repasser à un modèle strict (rien avant acceptation explicite), dans le
bloc `<head>` des 3 pages : mettre les 4 signaux `ad_storage`,
`ad_user_data`, `ad_personalization` et `analytics_storage` à `'denied'` par
défaut, ajouter `wait_for_update:500`, et ne les passer à `granted` que
depuis `acceptCookies(true)`. Le reste du câblage ne bouge pas.
