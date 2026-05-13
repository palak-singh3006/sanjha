-- SANJHA — Supabase / PostgreSQL schema
-- Run in Supabase SQL editor or `psql` after creating a project.

create extension if not exists "uuid-ossp";

create type user_role as enum ('farmer', 'buyer', 'coordinator', 'admin');

create table public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique,
  role user_role not null default 'farmer',
  full_name text,
  phone text,
  preferred_language text default 'en',
  village text,
  created_at timestamptz default now()
);

create table public.farms (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.users (id) on delete cascade,
  name text not null,
  acres numeric,
  geo geography(point),
  soil_type text,
  created_at timestamptz default now()
);

create table public.crops (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references public.farms (id) on delete cascade,
  name text not null,
  season text,
  area_acres numeric,
  created_at timestamptz default now()
);

create table public.harvests (
  id uuid primary key default uuid_generate_v4(),
  crop_id uuid references public.crops (id) on delete cascade,
  expected_date date,
  risk_score int,
  market_pressure int,
  notes text,
  created_at timestamptz default now()
);

create table public.marketplace_listings (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references public.users (id) on delete cascade,
  crop text not null,
  quantity_kg numeric not null,
  min_price_per_kg numeric not null,
  status text default 'open',
  created_at timestamptz default now()
);

create table public.bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.marketplace_listings (id) on delete cascade,
  buyer_id uuid references public.users (id) on delete cascade,
  amount_per_kg numeric not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.users (id) on delete set null,
  title text not null,
  body text,
  crop text,
  region text,
  geo geography(point),
  upvotes int default 0,
  validated_count int default 0,
  success_rate int,
  created_at timestamptz default now()
);

create table public.soil_reports (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references public.farms (id) on delete cascade,
  previous_crop text,
  nitrogen int,
  phosphorus int,
  potassium int,
  stress int,
  payload jsonb,
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users (id) on delete cascade,
  channel text default 'in_app',
  locale text default 'en',
  title text,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table public.ratings (
  id uuid primary key default uuid_generate_v4(),
  rater_id uuid references public.users (id) on delete cascade,
  target_id uuid references public.users (id) on delete cascade,
  score int check (score between 1 and 5),
  context text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.farms enable row level security;
alter table public.crops enable row level security;
alter table public.harvests enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.bids enable row level security;
alter table public.community_posts enable row level security;
alter table public.soil_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.ratings enable row level security;
