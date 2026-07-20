# Analytics RB-CapSO

Objectif : Romain veut voir le nombre de visiteurs, le nombre de clics sur
les actions qui comptent (téléphone, email, WhatsApp, Instagram), et suivre
ses indicateurs dans le temps.

## Ce qui est déjà fait, côté code

| Élément | État | Où |
|---|---|---|
| Conteneur GTM `GTM-MRM597NW` | en production | les 3 pages |
| Consent Mode v2, tout refusé par défaut | en production | inline dans chaque `<head>`, avant GTM |
| Bandeau de consentement | en production | `web/consent.js` |
| Lien "Gestion des cookies" | en production | pied de page du site public |

Rien d'autre n'est à toucher dans le code. La suite se fait entièrement
dans les interfaces Google, ce qui est justement l'intérêt d'avoir posé
GTM : ajouter ou retirer un tag ne demandera plus de redéploiement.

## Ce qu'il reste à faire, dans ton compte Google

Ces étapes demandent d'être connecté au compte Google de RB-CapSO. Je ne
peux pas les faire à ta place : créer une propriété et publier un
conteneur engagent le compte.

### 1. Créer la propriété GA4

1. <https://analytics.google.com> → Admin → Créer → Propriété
2. Nom `RB-CapSO`, fuseau `France`, devise `Euro`
3. Créer un flux de données Web sur `https://rb-capso.com`
4. Dans **Enhanced measurement**, laisser activé. Ça couvre déjà les pages
   vues, le scroll et les clics sortants sans configuration.
5. Noter l'identifiant de mesure, au format `G-XXXXXXXXXX`

### 2. Brancher GA4 dans GTM

Dans <https://tagmanager.google.com>, conteneur `GTM-MRM597NW` :

1. **Balises** → Nouvelle → type **Google Tag**
2. Identifiant : le `G-XXXXXXXXXX` de l'étape 1
3. Déclencheur : **Initialization - All Pages**
4. Nommer `GA4 - Configuration`, enregistrer

Pas de réglage de consentement à ajouter sur cette balise : le Consent
Mode posé dans le code bloque déjà la mesure tant que le visiteur n'a pas
accepté, et la débloque automatiquement quand il accepte.

### 3. Suivre les clics qui comptent

D'abord activer les variables de clic, une seule fois :
**Variables** → Configurer → cocher tout le bloc **Clics**.

Puis, pour chacune des 4 actions ci-dessous, créer un déclencheur et une
balise.

Déclencheur : **Nouveau** → **Clic - Liens uniquement** → *Certains clics*
→ `Click URL` → **correspond à l'expression régulière** :

| Action | Expression régulière | Nom de l'événement GA4 |
|---|---|---|
| Téléphone | `^tel:` | `clic_telephone` |
| Email | `^mailto:` | `clic_email` |
| WhatsApp | `api\.whatsapp\.com\|wa\.me` | `clic_whatsapp` |
| Instagram | `instagram\.com` | `clic_instagram` |

Balise associée : **Google Analytics: événement GA4**, en sélectionnant la
balise `GA4 - Configuration` et en donnant le nom d'événement de la
colonne de droite.

### 4. Publier

Bouton **Envoyer** en haut à droite de GTM. Tant que le conteneur n'est
pas publié, `gtm.js` se charge sur le site sans rien faire.

Vérifier avant de publier avec le mode **Aperçu** de GTM : accepter le
bandeau sur le site, cliquer sur le bouton téléphone, et voir apparaître
`clic_telephone` dans le panneau de debug.

### 5. Marquer les événements clés

Dans GA4 → Admin → **Événements clés**, marquer `clic_telephone`,
`clic_email` et `clic_whatsapp`. Ils remonteront alors comme conversions
dans les rapports, ce qui est la vue qui intéresse Romain.

Ces événements n'apparaissent dans la liste qu'après avoir été déclenchés
au moins une fois. Compter 24 h après la publication.

## Ce que Romain regarde ensuite

Une fois publié, dans <https://analytics.google.com> :

- **Rapports → Acquisition → Vue d'ensemble** : combien de visiteurs, et
  d'où ils viennent (Google, Instagram, direct)
- **Rapports → Engagement → Événements** : combien de clics téléphone,
  email, WhatsApp
- **Temps réel** : qui est sur le site en ce moment, utile pour vérifier
  que tout fonctionne

Les données mettent 24 à 48 h à se stabiliser après la mise en route.

## Deux limites à connaître

**Les chiffres seront partiels.** Le bandeau est obligatoire, et une
partie des visiteurs refusera. En pratique, 40 à 60 % des visites ne
seront pas comptées. Les tendances restent lisibles, mais le nombre absolu
de visiteurs est un plancher, pas un total.

**Les pages admin sont incluses.** `/calendar` et `/app` portent le même
conteneur, donc la navigation de Romain se mélange à celle des clients. Si
ça brouille les chiffres, filtrer dans GA4 → Admin → Filtres de données
sur le chemin de page, plutôt que de retirer les snippets.
