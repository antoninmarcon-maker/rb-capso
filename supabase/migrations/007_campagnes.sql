-- Campagnes marketing de Romain, affichees dans /stats.
--
-- Aucune policy RLS n'est creee volontairement: cette table n'est jamais lue
-- ni ecrite depuis le navigateur. Tout passe par la fonction serverless
-- web/api/stats.js, protegee par mot de passe, qui utilise la service_role.
-- RLS reste activee pour que la cle anon publique du site ne puisse rien en
-- faire, meme par accident.

create table if not exists campagnes (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  canal        text,
  date_debut   date not null,
  date_fin     date not null,
  -- En centimes, jamais en float: 0.1 + 0.2 ne fait pas 0.3 en virgule
  -- flottante, et un budget publicitaire finit toujours par etre additionne.
  budget_cents integer,
  -- Nom de campagne tel qu'il apparait dans GA4 (utm_campaign ou nom de la
  -- campagne Google Ads). Null pour une campagne hors ligne: dans ce cas
  -- l'attribution est impossible et /stats l'affiche comme "non tracee"
  -- plutot que comme zero, ce qui serait trompeur.
  utm_campaign text,
  cree_le      timestamptz not null default now(),

  constraint campagnes_dates_coherentes check (date_fin >= date_debut),
  constraint campagnes_budget_positif check (budget_cents is null or budget_cents >= 0),
  constraint campagnes_nom_non_vide check (length(trim(nom)) > 0)
);

alter table campagnes enable row level security;

create index if not exists campagnes_periode_idx on campagnes (date_debut desc);
