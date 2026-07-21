# Analytics RB-CapSO

Objectif : Romain veut voir le nombre de visiteurs, le nombre de clics sur
les actions qui comptent (téléphone, email, WhatsApp, Instagram), et suivre
ses indicateurs dans le temps. Une campagne Google Ads tourne en parallèle.

## Ce qui est fait, côté code

| Élément | État | Où |
|---|---|---|
| Conteneur GTM `GTM-MRM597NW` | en production | les 3 pages |
| Propriété GA4 `G-99EMNQYCK1` | en production | balise « G4A rb capso », GTM version 2 |
| Consent Mode v2, tout accordé | en production | inline dans chaque `<head>`, avant GTM |
| Bandeau de consentement | présent mais non chargé | `web/consent.js` |

Rien d'autre à toucher dans le code. La suite se fait dans les interfaces
Google, ce qui est l'intérêt d'avoir posé GTM : ajouter ou retirer un tag
ne demandera plus de redéploiement, et aucun identifiant n'a besoin d'être
écrit dans le repo.

## Le choix de collecte, et son risque

Décision d'Antonin le 2026-07-20 : on collecte tout, sans bandeau, quitte à
régulariser plus tard.

Concrètement, `Consent Mode v2` est initialisé avec tous les signaux à
`granted`. GA4 mesure donc dès la première page vue, sans demander quoi que
ce soit au visiteur.

Ce que ça implique, pour que ce soit écrit quelque part :

- La CNIL impose le consentement préalable pour les cookies de mesure. GA4
  en configuration standard ne rentre pas dans l'exemption « mesure
  d'audience ». Le site est donc non conforme tant que le bandeau n'est pas
  remis. Le risque porte sur RB-CapSO, pas sur le développeur.
- Les visiteurs qui avaient cliqué « Refuser » pendant les 30 minutes où le
  bandeau était en ligne sont désormais mesurés malgré leur refus. Leur
  choix est toujours dans leur `localStorage`, mais plus rien ne le lit.
  En volume, c'est probablement nul.

### Revenir au consentement

Le bandeau n'a pas été supprimé, il est juste débranché. Pour le remettre,
dans le bloc `<head>` des 3 pages :

1. repasser les 4 signaux `ad_storage`, `ad_user_data`, `ad_personalization`
   et `analytics_storage` à `'denied'`
2. rajouter `wait_for_update:500` dans le même objet
3. rajouter la relecture du choix mémorisé, juste sous l'appel `default` :
   `try{if(localStorage.getItem('rbcapso_consent')==='granted'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}}catch(e){}`
4. rajouter `<script src="/consent.js" defer></script>` après le bloc
5. remettre le lien de retrait dans le pied de page de `web/index.html`,
   dans la liste `.footer-links` :
   `<li><a href="#" onclick="rbConsent.open();return false;">Gestion des cookies</a></li>`

L'ordre du point 3 est critique : la relecture doit rester **avant** le
snippet GTM, sinon GA4 envoie une page vue avant que le choix soit rejoué.

Le commit `64dda6f` contient la version complète si besoin de la relire.

## À faire en premier, avant toute technique

**Vérifier la stratégie d'enchères de la campagne Google Ads.**

Si elle est réglée sur les conversions, elle optimise à vide depuis que la
campagne tourne, puisqu'aucune conversion ne lui remonte, et elle continue
de dépenser pendant la mise en place. La basculer sur **Maximiser les
clics** en attendant. On la remettra aux conversions une fois que le suivi
enverra des données.

C'est l'action la moins technique et la plus coûteuse à ne pas faire.

## Vérifier que la mesure part vraiment

Sans ouvrir GA4, on peut lire le conteneur que GTM sert au navigateur.
Si l'identifiant de mesure y apparaît, la balise est publiée :

```sh
curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-MRM597NW" \
  | grep -o "G-[A-Z0-9]\{8,\}" | sort -u
```

Doit renvoyer `G-99EMNQYCK1`. Si la commande ne renvoie rien, la balise
est enregistrée mais pas publiée : dans GTM, « Envoyer » ouvre un panneau
où il reste à cliquer sur **Publier**. C'est l'erreur la plus courante,
elle a coûté un aller-retour ici.

Le conteneur pèse environ 340 Ko avec la balise GA4, contre 318 Ko à vide.

## 1. Créer la propriété GA4

1. <https://analytics.google.com> → Admin → Créer → Propriété
2. Nom `RB-CapSO`, fuseau `France`, devise `Euro`
3. Flux de données → Web → `https://rb-capso.com`
4. Laisser la **mesure améliorée** activée : elle couvre gratuitement les
   pages vues, le scroll et les clics sortants
5. Noter l'identifiant de mesure : c'est **`G-99EMNQYCK1`**

Sur l'écran « Choisissez comment configurer une balise Google », prendre
**Utiliser Google Tag Manager**, surtout pas l'installation manuelle. Le
snippet `gtag.js` proposé ferait doublon avec GTM et compterait chaque
visite deux fois. Google le dit sur l'écran : une seule balise Google par
page.

## 2. Brancher GA4 dans GTM

<https://tagmanager.google.com>, conteneur `GTM-MRM597NW` :

1. **Balises** → Nouvelle → **Google Analytics : balise Google**
2. Coller **`G-99EMNQYCK1`**
3. Déclencheur : **Initialization - All Pages**
4. Enregistrer, puis **Envoyer** pour publier

Aucun réglage de consentement à ajouter sur la balise : le Consent Mode du
code accorde déjà tout.

Dès la publication, les visiteurs, sources, appareils et pays remontent.
Vérifier dans GA4 → **Temps réel**, c'est immédiat. Tant que le conteneur
n'est pas publié, `gtm.js` se charge sur le site sans rien collecter.

## 3. Suivre les clics

Activer d'abord les variables de clic, une seule fois :
**Variables** → Configurer → cocher le bloc **Clics**.

Puis 4 déclencheurs **Clic - Liens uniquement**, condition sur `Click URL` :

| Action | Condition | Nom de l'événement GA4 |
|---|---|---|
| Téléphone | contient `tel:` | `clic_telephone` |
| Email | contient `mailto:` | `clic_email` |
| WhatsApp | contient `api.whatsapp.com` | `clic_whatsapp` |
| Instagram | contient `instagram.com` | `clic_instagram` |

Une balise **Google Analytics : événement GA4** par déclencheur, en
pointant la balise Google de l'étape 2. Zéro code.

Vérifier avec le mode **Aperçu** de GTM avant de publier : cliquer le
bouton téléphone du site et voir apparaître `clic_telephone` dans le
panneau de debug.

Puis dans GA4 → Admin → **Événements clés**, marquer `clic_telephone`,
`clic_email` et `clic_whatsapp`. Ils remonteront alors comme conversions.
Ils n'apparaissent dans la liste qu'après avoir été déclenchés au moins une
fois, compter 24 h.

## 4. Google Ads

1. Google Ads → Objectifs → Conversions → Nouvelle action → **Site web**.
   Tu obtiens un `AW-XXXXXXXXX` et un libellé de conversion.
2. Dans GTM, poser la balise **Lien de conversion** sur **All Pages**,
   avant tout le reste. Sans elle, l'attribution casse sur iOS et Romain
   conclura à tort que ses annonces ne convertissent pas.
3. Puis la balise de conversion Google Ads, avec le `AW-` et le libellé.
4. GA4 → Admin → **Liaisons de produits** → Google Ads, pour associer les
   deux comptes.

Une fois cette étape publiée, il reste à écrire côté code l'événement de
conversion sur `submitDemande()` et le suivi du parcours par section. Ce
n'est pas fait, c'est du travail dans le repo.

## Ce que Romain regarde ensuite

- **Rapports → Acquisition → Vue d'ensemble** : combien de visiteurs, et
  d'où ils viennent (Google, Instagram, direct)
- **Rapports → Engagement → Événements** : combien de clics téléphone,
  email, WhatsApp
- **Temps réel** : qui est sur le site maintenant, utile pour vérifier que
  tout fonctionne

Les données se stabilisent en 24 à 48 h.

## Une limite à connaître

**Les pages admin sont incluses.** `/calendar` et `/app` portent le même
conteneur, donc la navigation de Romain se mélange à celle des clients. Si
ça brouille les chiffres, filtrer dans GA4 → Admin → Filtres de données sur
le chemin de page, plutôt que de retirer les snippets.
