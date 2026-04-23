# RB-CapSO — Code starter

Monorepo Next.js 15 + Remotion pour le site et le pipeline vidéo.

## Structure

```
apps/
  web/     Site public (Next.js 15, Tailwind v4, Sanity, Supabase, Stripe, Resend)
  video/   Remotion (templates vidéo paramétrés)
packages/
  design-tokens/  Couleurs + polices partagées
supabase/
  migrations/
  seed.sql
```

## Lancer en local

```bash
pnpm install
cp .env.example .env.local
# Remplir les variables dans .env.local

# Dev site
pnpm dev

# Dev vidéo
pnpm video:studio
```

## Déployer

```bash
# Vercel : connecter le repo, root directory = apps/web
# Supabase : migrations dans supabase/migrations/
supabase db push

# Sanity
cd apps/web && pnpm dlx sanity@latest deploy
```

## Documentation

Le plan complet (23 documents markdown) est dans [../tasks/](../tasks/).

Point de départ : [../tasks/todo.md](../tasks/todo.md).

## Prochaines étapes pour le dev

1. Coder les fiches vans dynamiques avec Sanity (GROQ queries)
2. Implémenter le tunnel de réservation (react-day-picker + Stripe Checkout)
3. Implémenter le webhook Stripe
4. Coder l'admin `/admin` avec Supabase auth magic link
5. Finaliser les 3 autres templates Remotion (DispoCard, VanTour)
