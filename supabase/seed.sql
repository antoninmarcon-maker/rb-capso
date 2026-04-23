-- Seed initial : les 2 vans

insert into vans (slug, name, daily_rate_cents, deposit_cents)
values
  ('marceau', 'Marceau', 9000, 150000),
  ('lazare',  'Lazare',  13000, 150000)
on conflict (slug) do nothing;
