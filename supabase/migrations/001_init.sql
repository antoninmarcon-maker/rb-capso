-- RB-CapSO initial schema
-- Apply with: supabase db push

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- Vans
create table if not exists vans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  daily_rate_cents integer not null,
  deposit_cents integer not null default 150000,
  ical_export_token text unique not null default gen_random_uuid()::text,
  created_at timestamptz default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  address text,
  created_at timestamptz default now()
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  van_id uuid references vans(id) on delete cascade,
  customer_id uuid references customers(id),
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('pending','confirmed','cancelled','completed')),
  stripe_payment_intent_id text,
  total_cents integer not null,
  attribution_source text,
  created_at timestamptz default now()
);

-- Availability blocks (Yescapa + direct + manual)
create table if not exists availability_blocks (
  id uuid primary key default gen_random_uuid(),
  van_id uuid references vans(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  source text not null check (source in ('yescapa','direct','manual')),
  external_uid text,
  booking_id uuid references bookings(id),
  created_at timestamptz default now(),
  constraint no_overlap exclude using gist (
    van_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
);

-- iCal sync log
create table if not exists ical_sync_log (
  id uuid primary key default gen_random_uuid(),
  van_id uuid references vans(id) on delete cascade,
  source_url text,
  success boolean,
  events_count integer,
  error text,
  ran_at timestamptz default now()
);

-- Indexes
create index if not exists idx_bookings_van_dates on bookings (van_id, start_date, end_date);
create index if not exists idx_availability_van_dates on availability_blocks (van_id, start_date, end_date);
create index if not exists idx_bookings_status on bookings (status);

-- RLS policies
alter table vans enable row level security;
alter table bookings enable row level security;
alter table availability_blocks enable row level security;
alter table customers enable row level security;

drop policy if exists "public read vans" on vans;
create policy "public read vans" on vans for select using (true);

drop policy if exists "service write all" on vans;
create policy "service write all" on vans for all using (auth.role() = 'service_role');

-- Admin role check (to be refined)
drop policy if exists "admin manages bookings" on bookings;
create policy "admin manages bookings" on bookings for all using (auth.role() = 'service_role');

drop policy if exists "admin manages blocks" on availability_blocks;
create policy "admin manages blocks" on availability_blocks for all using (auth.role() = 'service_role');

drop policy if exists "admin manages customers" on customers;
create policy "admin manages customers" on customers for all using (auth.role() = 'service_role');
