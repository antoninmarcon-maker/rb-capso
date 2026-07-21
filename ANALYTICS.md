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
| Association GA4 / Google Ads | acceptée |
| Action de conversion Google Ads | **à faire** |
| Tableau de bord Looker Studio pour Romain | **à faire** |

GA4 collecte depuis la publication de la version 2 du conteneur.

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

### 1 bis. Les variables de couche de données, dans GTM

Sans elles, les paramètres poussés par le site (`vehicule`, `forfait`,
`nb_nuits`, `section`) n'atteignent jamais GA4 et les dimensions
personnalisées restent vides. GTM ne les lit pas tout seul.

**Variables** → Nouvelle → **Variable de couche de données**, une par
paramètre. Le champ « Nom de la variable de couche de données » doit
contenir le nom exact ci-dessous.

| Nommer la variable | Nom de la variable de couche de données |
|---|---|
| `DLV - vehicule` | `vehicule` |
| `DLV - forfait` | `forfait` |
| `DLV - nb_nuits` | `nb_nuits` |
| `DLV - section` | `section` |

Elles seront ensuite référencées comme `{{DLV - vehicule}}` dans les
paramètres des balises d'événement.

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

Dans chacune de ces deux balises, renseigner les **paramètres
d'événement**, sinon GA4 reçoit l'événement mais pas son contenu :

| Balise | Paramètre | Valeur |
|---|---|---|
| `demande_reservation` | `vehicule` | `{{DLV - vehicule}}` |
| | `forfait` | `{{DLV - forfait}}` |
| | `nb_nuits` | `{{DLV - nb_nuits}}` |
| `section_vue` | `section` | `{{DLV - section}}` |

Puis GA4 → Admin → **Événements clés** : marquer `demande_reservation`,
`clic_telephone`, `clic_email`, `clic_whatsapp`. Le bouton « Nouvel
événement clé » permet de les saisir au nom sans attendre qu'ils se soient
déclenchés.

### 3. Google Ads

**D'abord, vérifier la stratégie d'enchères.** Si elle est réglée sur les
conversions, elle optimise à vide tant qu'aucune conversion ne remonte, et
elle dépense pendant ce temps. La basculer sur **Maximiser les clics**, puis
la remettre aux conversions une fois que les conversions remontent. C'est
l'action la moins technique et la plus coûteuse à ne pas faire.

L'association GA4 / Google Ads est acceptée. Le plus simple est donc
**d'importer l'événement clé depuis GA4** plutôt que de poser une seconde
balise de conversion :

Google Ads → Objectifs → Conversions → **Importer** → Google Analytics 4 →
sélectionner `demande_reservation`.

Cela évite un double comptage entre une balise Ads et GA4, et Ads calcule
alors nativement le **coût par conversion**, qui est la métrique la plus
utile pour Romain.

Si tu préfères malgré tout une balise Ads dédiée (attribution au clic plus
fine, utile si le budget grossit) : créer l'action de conversion, puis poser
dans GTM la balise **Lien de conversion** sur **All Pages** *avant* la
balise de conversion. Sans elle, l'attribution casse sur iOS et Romain
conclura à tort que ses annonces ne convertissent pas. Dans ce cas, ne pas
importer aussi l'événement GA4.

Attention : la publicité est une nouvelle finalité au sens du consentement.
Le bandeau et la politique cookies ne parlent aujourd'hui que de mesure
d'audience. Si le reciblage est activé un jour, incrémenter la clé
(`rb_cookies_v3`) et mettre les deux textes à jour.

### 4. Le tableau de bord de Romain, dans Looker Studio

L'application mobile GA4 ne convient pas ici : elle n'a pas de tableau de
bord personnalisable, et sa section Publicité est quasi absente sur mobile.
Romain ne pourrait pas voir en un coup d'oeil ce que coûtent ses annonces à
côté de ce que rapporte son site.

Looker Studio est gratuit, connecte GA4 et Google Ads nativement, et produit
une page que Romain ouvre depuis un lien puis ajoute à son écran d'accueil.

**À faire seulement après les points 1 à 3**, sinon les champs à poser dans
le tableau de bord n'existent pas encore.

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

## Ce que Romain regarde, en attendant le tableau de bord

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
