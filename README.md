# RB-CapSO

Site rb-capso.com + outil interne /app + admin calendrier /calendar.

## Structure

```
web/
├── index.html              Site public (rb-capso.com)
├── app/index.html          Outil interne (rb-capso.com/app)
├── calendar/index.html     Admin calendrier (rb-capso.com/calendar)
└── vercel.json             Headers anti-cache

supabase/
└── migrations/
    └── 001_init.sql        Schema (reservations, availability_blocks, admins)
```

## Workflow d'édition

Édite directement le HTML qui t'intéresse dans `web/`, commit, push. Vercel déploie automatiquement en ~30 s.

```bash
git pull
# édite web/index.html (ou web/app/index.html)
git add .
git commit -m "fix: ..."
git push
```

Pour vérifier le déploiement : https://vercel.com/antoninmarcon-3663s-projects/rb-capso-romain

## Stack

- **Frontend** : HTML/CSS/JS vanilla (pas de framework)
- **Hosting** : Vercel (projet `rb-capso-romain`)
- **DB** : Supabase (projet `bbjpjbviehsxshvzkvla`, région Paris)
- **Domaines** : rb-capso.com (apex + www) — DNS managé par Vercel

## Déploiement manuel (fallback)

Si jamais Vercel auto-deploy ne marche pas :

```bash
cd web && vercel deploy --prod
```

## Variables / clés

Aucune variable d'environnement requise côté Vercel. La clé anon Supabase est volontairement publique dans `web/calendar/index.html` (protégée par RLS côté DB).

Les secrets (DB password, service_role key, admin password) ne sont **jamais** dans le repo.

## Admin /calendar

Login par mot de passe partagé pour `rb.concept.capso@gmail.com`. Le code est partagé hors-bande.
