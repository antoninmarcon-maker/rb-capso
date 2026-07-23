# Analytics RB-CapSO

Objectif : Romain veut voir le nombre de visiteurs, le nombre de clics sur
les actions qui comptent (téléphone, email, WhatsApp, Instagram), et suivre
ses indicateurs dans le temps. Une campagne Google Ads tourne en parallèle.

## État au 2026-07-22

| Élément | État |
|---|---|
| Conteneur GTM `GTM-MRM597NW` | en production sur les 3 pages |
| Propriété GA4 `G-99EMNQYCK1` | balise publiée, collecte confirmée |
| Consent Mode v2 | en production, câblé au bandeau du site |
| Dimensions personnalisées GA4 (Section, Vehicule, Forfait) | créées |
| Variables de couche de données GTM (4) | créées |
| Déclencheurs de clic (tel, mail, WhatsApp, Instagram) | créés et publiés |
| Déclencheurs `demande_reservation` et `section_vue` | créés et publiés |
| Balises GA4 (6 événements) | publiées en v3 ; conteneur courant : v4 |
| Association GA4 / Google Ads | acceptée |
| Événements clés GA4 | plus requis pour Ads (balise dédiée) ; optionnel côté GA4 |
| Stratégie d'enchères Google Ads | conservée sur Maximiser les conversions |
| Action de conversion Google Ads | **créée le 2026-07-22, balise GTM dédiée (conteneur v4)** |
| Page /stats | **en production**, protégée par mot de passe, 88 vérifications |
| Dépense publicitaire sur /stats | uniquement la dépense réelle Google Ads (métrique GA4 `advertiserAdCost`). Pas de repli manuel (décision du 23/07) : tiret tant que la synchro n'a pas propagé |
| Lieux (villes, régions) et appareils sur /stats | en production |
| Campagnes Google Ads sur /stats | **automatiques** : découvertes via GA4 (`sessionGoogleAdsCampaignName`), dépense réelle par campagne (`advertiserAdCost`), demandes attribuées, coût par demande. Zéro saisie |
| Courbe d'évolution, taux de conversion, coût par demande (pub), clics Instagram | en production |
| Demandes de test (`vehicule=test`, 21-22/07) | filtrées de tous les compteurs |

Vérifié de bout en bout le 2026-07-21 : sur rb-capso.com, les hits
`page_view` et `section_vue` partent bien vers `G-99EMNQYCK1`, et GA4
enregistre le trafic du flux rb-capso.

### Les événements clés ne peuvent pas être marqués tout de suite

Contrairement à ce qui était écrit ici auparavant, l'interface GA4 ne
permet **pas** de saisir un événement clé au nom. Il faut cliquer l'étoile
à côté d'un événement **déjà listé** dans Admin → Affichage des données →
Événements. Or cette liste met jusqu'à 24 h à se peupler.

Revenir le lendemain et étoiler `demande_reservation`, `clic_telephone`,
`clic_email` et `clic_whatsapp`. Depuis le 2026-07-22 ce n'est plus
nécessaire pour Google Ads (la conversion passe par une balise dédiée,
voir la section 3), mais l'étoile reste utile pour les rapports GA4.

Les identifiants de compte (numéro client Google Ads, ID de propriété GA4)
ne sont volontairement pas notés ici : **ce dépôt est public**. Ce ne sont
pas des secrets, mais les exposer facilite l'hameçonnage ciblé. Seul
`G-99EMNQYCK1` y figure, car il est public par construction, présent dans le
HTML de chaque page.

## Si GA4 affiche « Aucune donnée reçue »

Vérifié le 2026-07-21 : le site est correctement tagué et Google accepte les
données. Un `POST` vers `region1.google-analytics.com/g/collect` avec
`tid=G-99EMNQYCK1` renvoie **204** depuis le terminal.

Depuis le Chrome d'Antonin, le même appel renvoie **503**. Une extension de
blocage ou un réglage de confidentialité intercepte la requête et fabrique
cette réponse. Ce n'est ni Google, ni la propriété, ni le code du site : les
visiteurs sans bloqueur sont comptés normalement, seules les visites de test
d'Antonin ne l'étaient pas.

Ce n'est pas au niveau réseau ou DNS, sinon `curl` échouerait aussi.

Avant de soupçonner le code, refaire ce test :

```sh
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://region1.google-analytics.com/g/collect?v=2&tid=G-99EMNQYCK1&cid=555000111.1784600000&en=page_view&dl=https%3A%2F%2Frb-capso.com%2F&_s=1"
```

`204` signifie que la chaîne fonctionne et que le problème est local au
navigateur. Attention, cette commande crée une vraie page vue dans les
statistiques.

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

## La configuration GTM en place

Tout ce qui suit est **déjà créé et publié** (balises GA4 en version 3 ;
le conteneur courant est la version 4, qui ajoute la conversion Google Ads,
voir la section Google Ads). Cette section sert de référence pour comprendre
le câblage ou le reproduire ailleurs, pas de liste de tâches.

### 1. Les déclencheurs de clic

Variables de clic activées (**Variables** → Configurer → bloc **Clics**).

4 déclencheurs **Clic - Liens uniquement**, condition sur `Click URL` :

| Action | Condition | Nom de l'événement GA4 |
|---|---|---|
| Téléphone | contient `tel:` | `clic_telephone` |
| Email | contient `mailto:` | `clic_email` |
| WhatsApp | contient `api.whatsapp.com` | `clic_whatsapp` |
| Instagram | contient `instagram.com` | `clic_instagram` |

Une balise **Google Analytics : événement GA4** par déclencheur, sur
`G-99EMNQYCK1`. Zéro code.

Ces déclencheurs sont indispensables : la « mesure améliorée » de GA4 ne
considère pas `tel:` et `mailto:` comme des clics sortants, elle ne les
compterait donc jamais toute seule.

### 1 bis. Les variables de couche de données

Sans elles, les paramètres poussés par le site (`vehicule`, `forfait`,
`nb_nuits`, `section`) n'atteignent jamais GA4 et les dimensions
personnalisées restent vides. GTM ne les lit pas tout seul.

| Nommer la variable | Nom de la variable de couche de données |
|---|---|
| `DLV - vehicule` | `vehicule` |
| `DLV - forfait` | `forfait` |
| `DLV - nb_nuits` | `nb_nuits` |
| `DLV - section` | `section` |

Elles seront ensuite référencées comme `{{DLV - vehicule}}` dans les
paramètres des balises d'événement.

### 2. Les événements envoyés par le code

Poussés par le site dans le `dataLayer`, captés par un déclencheur
**Événement personnalisé** portant le nom exact :

- `demande_reservation`, avec `vehicule`, `forfait`, `nb_nuits`. Poussé
  seulement après écriture en base, donc une demande refusée pour dates
  indisponibles ne compte pas. Aucune donnée personnelle.
- `section_vue`, avec `section`. Une fois par section et par chargement.
  Valeurs : `vans`, `penelop`, `peggy`, `tente`, `conception`, `apropos`,
  `faq`, `contact`, `devis`.

Les slugs de véhicules sont alignés sur ceux de la réservation (`penelop`
sans `e`), pour pouvoir croiser vues et conversions par véhicule.

Dans chacune de ces deux balises, renseigner les **paramètres
d'événement**, sinon GA4 reçoit l'événement mais pas son contenu :

| Balise | Paramètre | Valeur |
|---|---|---|
| `demande_reservation` | `vehicule` | `{{DLV - vehicule}}` |
| | `forfait` | `{{DLV - forfait}}` |
| | `nb_nuits` | `{{DLV - nb_nuits}}` |
| `section_vue` | `section` | `{{DLV - section}}` |

Puis marquer les événements clés : voir la note en haut de ce document,
l'étoile n'est disponible qu'une fois l'événement listé par GA4, ce qui
prend jusqu'à 24 h.

## Le tableau de bord de Romain : /stats

**En production** sur `rb-capso.com/stats`. Page protegee par mot de passe
sur le site, plutot qu'un outil Google. Romain ouvre une URL, tape un mot
de passe, voit ses chiffres. Pas de compte Google, pas d'app, pas
d'interface a apprendre.

- `web/stats/index.html` : la page, dans la charte du site, lisible sur
  telephone
- `web/api/stats.js` : fonction serverless Vercel qui interroge l'API GA4
- `web/api/stats.test.js` : verification hors ligne, `node web/api/stats.test.js`

Affiche : visiteurs, demandes de reservation, clics telephone/WhatsApp/
email, sources de trafic (traduites et expliquees), quel van interesse,
villes / regions / appareils, la depense publicitaire, et la gestion des
campagnes. Periode reglable 7 / 30 / 90 jours.

**Depense publicitaire, connectee a Google Ads via GA4.** Plutot que l'API
Google Ads (developer token a valider a la main), la fonction lit la
metrique GA4 `advertiserAdCost` : la depense Ads remonte dans GA4 quand le
lien GA4<->Ads est actif (compte Ads de Romain relie a la propriete). Si le
cout reel est positif, la page l'affiche "synchronisee avec Google Ads"
avec le nombre de clics ; sinon un tiret et une note expliquant la
propagation (24-48 h). Pas de budget saisi a la main: decision d'Antonin
du 23/07, un tiret honnete vaut mieux qu'un montant perime.

La cle du compte de service ne peut pas vivre dans la page: elle donnerait
a n'importe qui l'acces aux donnees. Elle reste dans la fonction, qui ne
renvoie que des nombres. Le mot de passe est verifie au meme endroit, un
controle en JavaScript cote page se contournant en quelques secondes.

### Mise en service, une seule fois — DEJA FAITE

Les variables sont posees dans Vercel et la page est en service. La
procedure ci-dessous reste ici pour reference (re-provisioning, autre
projet). Ne pas la rejouer sans raison.

**1. Activer l'API et creer un compte de service**

<https://console.cloud.google.com> → creer ou choisir un projet →
**API et services** → activer **Google Analytics Data API** →
**Identifiants** → Creer → **Compte de service** → puis, sur le compte
cree, onglet **Cles** → Ajouter une cle → **JSON**. Un fichier se
telecharge.

**2. Donner a ce compte l'acces en lecture a GA4**

GA4 → Admin → **Gestion des acces a la propriete** → `+` → coller
l'adresse du compte de service (elle finit par
`.iam.gserviceaccount.com`) → role **Lecteur**.

**3. Renseigner les variables dans Vercel**

Projet rb-capso → Settings → **Environment Variables** :

| Variable | Valeur |
|---|---|
| `STATS_PASSWORD` | le mot de passe donne a Romain, long de preference |
| `GA_PROPERTY_ID` | l'identifiant numerique de la propriete GA4 |
| `GA_SA_EMAIL` | le champ `client_email` du fichier JSON |
| `GA_SA_KEY` | le champ `private_key` du fichier JSON, tel quel |
| `SUPABASE_URL` | URL du projet Supabase (stockage des campagnes saisies à la main) |
| `SUPABASE_SERVICE_KEY` | clé service_role du même projet, secrète |

**Le fichier JSON est un secret.** Il ne doit jamais entrer dans ce depot,
qui est public, ni etre colle dans une conversation. Le copier directement
du fichier vers Vercel.

**4. Redeployer**, sinon les variables ne sont pas prises en compte.

### Ce que la page affiche

Visiteurs, visites, temps moyen de visite, demandes de reservation, taux
de conversion, clics telephone / WhatsApp / email / Instagram, sources de
trafic expliquees, quel van interesse, parcours de l'internaute
(entonnoir en personnes), villes / regions / appareils, courbe
d'evolution, depense publicitaire reelle et campagnes Google Ads
automatiques. Periode reglable sur 7, 30 ou 90 jours.

## Google Ads : fait le 2026-07-22, voie balise dédiée

Le plan initial (import de l'événement clé GA4) a été abandonné : GA4
n'accepte de marquer un événement clé qu'une fois l'événement reçu et
traité, et `demande_reservation` n'avait encore jamais été déclenché par un
vrai client. La balise Ads dédiée fonctionne immédiatement, sans attendre,
et son attribution au clic est plus fine pour les enchères.

Ce qui est en place :

- **Action de conversion** « Demande de réservation » dans le compte
  Google Ads RB CAPSO (propriété de Romain, numéro noté hors dépôt) : catégorie
  « Envoi de formulaire de lead », action principale, une conversion par
  clic, même valeur (1 EUR) par conversion, attribution basée sur les
  données. Identifiants : `AW-18318860933` / libellé
  `xqLgCKzztdQcEIXFjp9E`.
- **GTM version 4** : balise « Lien de conversion » sur All Pages (sans
  elle, l'attribution casse sur iOS) + balise « Suivi des conversions
  Google Ads » déclenchée sur l'événement `demande_reservation` existant.
- **GTM version 5 (2026-07-22 soir)** : balise « Balise Google »
  `AW-18318860933` sur Initialization - All Pages. Le diagnostic Google
  Ads « Votre site Web ne comporte pas de balise Google » exige un tag AW
  site-wide, la balise de conversion seule (déclenchée à l'événement) ne
  lui suffit pas. Chaque page vue émet désormais un ping ads
  (`google.com/ccm/collect`) qui respecte le Consent Mode ; le diagnostic
  se met à jour sous 24-72 h.
- **Objectif « Achat » supprimé** : la campagne Performance Max avait été
  créée avec un objectif Achat dont l'action n'avait jamais été installée
  (état « Mauvaise configuration », 0 conversion). L'action a été
  supprimée ; « Envoi de formulaire de lead » est désormais le seul
  objectif par défaut du compte, et la campagne (1 sur 1) optimise dessus.
- La stratégie d'enchères reste **Maximiser les conversions** : la bascule
  vers Maximiser les clics n'a plus de raison d'être puisque l'action de
  conversion existe et enregistrera dès la première demande.
- Le « suivi avancé des conversions » (envoi de données client hachées à
  Google) a été volontairement **refusé** : nouvelle finalité de
  consentement non couverte par le bandeau actuel.

**Ne jamais importer en plus l'événement GA4 `demande_reservation` dans
Google Ads** : chaque demande serait comptée deux fois et fausserait le
coût par conversion.

À savoir :

- L'état « Non vérifiée / Mauvaise configuration » de l'action est normal
  tant qu'aucune vraie demande n'a déclenché la balise. Il se met à jour
  tout seul après la première conversion (ou détection du tag par Google,
  quelques jours au plus).
- Deux événements GA4 `demande_reservation` de **test** (`vehicule=test`)
  existent : le 2026-07-21 (Measurement Protocol, voie « événement clé »
  abandonnée) et le 2026-07-22 (push dataLayer sur le site live pour
  activer la balise Ads : le ping `googleadservices.com/pagead/conversion/`
  est parti, sans gclid donc **aucune conversion comptée** côté Ads, mais
  la balise est désormais détectée par Google). Chacun compte pour
  1 demande dans GA4 et /stats à sa date. Aucune réservation en base.
- Vérifier que le conteneur publié porte bien la conversion :
  `curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-MRM597NW" | grep -c xqLgCKzztdQcEIXFjp9E`
  doit renvoyer au moins 1.

Attention : la publicité est une nouvelle finalité au sens du consentement.
Depuis le 2026-07-22 la politique cookies mentionne la mesure de conversion
Google Ads (cookies `_gcl_*`) ; le bandeau, lui, ne parle toujours que de
mesure d'audience. Si le reciblage ou le suivi avancé est activé un jour,
incrémenter la clé (`rb_cookies_v3`) et mettre les deux textes à jour.
Amélioration possible sans casser le comptage (décision à prendre) : passer
`ad_personalization` et `ad_user_data` à `denied` par défaut, la balise de
conversion n'a besoin que d'`ad_storage`.

## Ce qui reste à faire

### Le tableau de bord de Romain, dans Looker Studio

L'application mobile GA4 ne convient pas ici : elle n'a pas de tableau de
bord personnalisable, et sa section Publicité est quasi absente sur mobile.
Romain ne pourrait pas voir en un coup d'oeil ce que coûtent ses annonces à
côté de ce que rapporte son site.

Looker Studio est gratuit, connecte GA4 et Google Ads nativement, et produit
une page que Romain ouvre depuis un lien puis ajoute à son écran d'accueil.

**À faire seulement une fois les premières conversions enregistrées**, sinon
les champs à poser dans le tableau de bord n'existent pas encore.

#### Créer le rapport

1. <https://lookerstudio.google.com> → Créer → Rapport
2. Ajouter des données → **Google Analytics** → propriété RB-CapSO
3. Ajouter une seconde source → **Google Ads** → le compte RB-CapSO
4. Fichier → Paramètres du rapport → période par défaut : **30 derniers
   jours**

#### Les blocs, dans cet ordre

Romain lit du haut vers le bas sur un téléphone. Mettre les chiffres qui
décident en premier, le détail ensuite.

**Ligne 1, les résultats (source GA4)**

| Bloc | Type | Métrique |
|---|---|---|
| Visiteurs | Scorecard | `Utilisateurs actifs` |
| Demandes de réservation | Scorecard | `Nombre d'événements`, filtré sur `demande_reservation` |
| Clics téléphone | Scorecard | `Nombre d'événements`, filtré sur `clic_telephone` |
| Clics WhatsApp | Scorecard | `Nombre d'événements`, filtré sur `clic_whatsapp` |

Pour filtrer un scorecard sur un événement : panneau de droite → Filtre →
Ajouter un filtre → `Nom de l'événement` **Égal à** `demande_reservation`.

**Ligne 2, le coût (source Google Ads)**

| Bloc | Type | Métrique |
|---|---|---|
| Budget dépensé | Scorecard | `Coût` |
| Coût par demande | Scorecard | `Coût / conv.` |
| Clics sur annonces | Scorecard | `Clics` |

`Coût / conv.` n'existe que si l'action de conversion du point 3 est en
place. C'est la raison pour laquelle ce point vient avant.

**Ligne 3, d'où viennent les visiteurs (GA4)**

Graphique à barres horizontales. Dimension `Groupe de canaux par défaut de
la session`, métrique `Utilisateurs actifs`, tri décroissant, 5 lignes.

**Ligne 4, quel van intéresse (GA4)**

Tableau. Dimension : paramètre personnalisé `section`, métrique `Nombre
d'événements`, filtre `Nom de l'événement` égal à `section_vue`.

Le paramètre `section` doit d'abord être déclaré dans GA4 → Admin →
**Définitions personnalisées** → Créer une dimension personnalisée, portée
Événement, paramètre `section`. Sans ça il n'apparaît pas dans Looker
Studio. Idem pour `vehicule` et `forfait` si tu veux les exploiter.

Attention, les dimensions personnalisées ne sont **pas rétroactives** :
elles ne collectent qu'à partir de leur création.

#### Rendre le tout lisible sur téléphone

- Thème et mise en page → Largeur du canevas : choisir un format portrait,
  par exemple 360 x 900, plutôt que le paysage par défaut
- Un seul bloc par ligne en dessous de 400 px de large
- Nommer les blocs en français courant : « Demandes de réservation », pas
  `demande_reservation`

#### Donner l'accès à Romain

Partager → ajouter son adresse en **Lecteur**. Préférer l'invitation
nominative au lien public : le tableau de bord expose le budget publicitaire
et le chiffre d'affaires potentiel.

Sur son téléphone, il ouvre le lien dans Chrome ou Safari puis « Ajouter à
l'écran d'accueil ». L'icône se comporte comme une application.

## Ce que Romain peut regarder dans GA4 lui-même

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
