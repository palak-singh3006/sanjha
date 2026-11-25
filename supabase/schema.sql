-- =============================================================================
-- SANJHA — Village Farms as One
-- Primary Supabase PostgreSQL Schema (Full Production Definition)
-- Paste directly into the Supabase SQL Editor.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Enums and Types
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'coordinator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE crop_plan_status AS ENUM ('planning', 'sown', 'growing', 'harvest_ready', 'harvested', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('open', 'pending', 'accepted', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  role user_role NOT NULL DEFAULT 'farmer',
  full_name text NOT NULL,
  phone text,
  email text,
  preferred_language text DEFAULT 'en',
  village text,
  district text DEFAULT 'Yadgir',
  state text DEFAULT 'Karnataka',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Farmer Profiles Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  experience_years int DEFAULT 5,
  total_land_acres numeric(8,2) DEFAULT 0,
  primary_crops text[] DEFAULT ARRAY['Tomato', 'Onion'],
  has_irrigation boolean DEFAULT true,
  irrigation_sources text[] DEFAULT ARRAY['borewell', 'drip'],
  kyc_status text DEFAULT 'verified' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  aadhaar_last4 text,
  upi_id text,
  annual_income_range text DEFAULT '₹1.5L - ₹3L',
  cooperative_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. Farmer Groups / Clusters
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  village text NOT NULL,
  district text NOT NULL DEFAULT 'Yadgir',
  state text NOT NULL DEFAULT 'Karnataka',
  description text,
  leader_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  lat numeric(10,6) DEFAULT 16.450000,
  lng numeric(10,6) DEFAULT 76.450000,
  total_acres numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. Group Memberships
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.farmer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'lead', 'coordinator')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT uq_group_user UNIQUE(group_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 6. Farms Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.farmer_groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  acres numeric(8,2) NOT NULL DEFAULT 1.0,
  village text,
  district text DEFAULT 'Yadgir',
  state text DEFAULT 'Karnataka',
  soil_type text DEFAULT 'loamy' CHECK (soil_type IN ('loamy', 'clay', 'sandy', 'red', 'black')),
  survey_number text,
  irrigation_type text DEFAULT 'drip',
  lat numeric(10,6) DEFAULT 16.450000,
  lng numeric(10,6) DEFAULT 76.450000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. Crop Plans Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  variety text,
  season text DEFAULT 'Kharif',
  area_acres numeric(8,2) NOT NULL DEFAULT 1.0,
  sowing_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_harvest_date date NOT NULL,
  recommended_harvest_date date,
  status text NOT NULL DEFAULT 'growing' CHECK (status IN ('planning', 'sown', 'growing', 'harvest_ready', 'harvested', 'failed')),
  dri_score int DEFAULT 0,
  market_pressure int DEFAULT 0,
  estimated_yield_kg numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. Marketplace Listings Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL,
  farmer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  quantity_kg numeric(10,2) NOT NULL CHECK (quantity_kg > 0),
  quality_grade text DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
  min_price numeric(10,2) NOT NULL CHECK (min_price > 0),
  available_date date DEFAULT CURRENT_DATE,
  location_text text,
  lat numeric(10,6),
  lng numeric(10,6),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'accepted', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. Bids Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  price_per_kg numeric(10,2) NOT NULL CHECK (price_per_kg > 0),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 10. Mandi Prices Cache Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mandi_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  market_name text NOT NULL,
  district text,
  state text NOT NULL DEFAULT 'Karnataka',
  price_min numeric(10,2) NOT NULL,
  price_max numeric(10,2) NOT NULL,
  price_modal numeric(10,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  source text DEFAULT 'agmarknet',
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 11. Weather Cache Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text,
  date date NOT NULL,
  temp_max numeric(5,2),
  temp_min numeric(5,2),
  rainfall_mm numeric(6,2),
  condition text,
  humidity numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 12. Knowledge / Community Posts Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  cluster_id text,
  crop_tag text,
  pest_tag text,
  region_tag text,
  title text NOT NULL,
  body text NOT NULL,
  language text DEFAULT 'kn',
  upvotes int DEFAULT 0,
  validated_count int DEFAULT 0,
  success_rate int DEFAULT 85,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 13. Soil Module Reference and Analysis Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_npk_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL UNIQUE,
  nitrogen_draw float4 NOT NULL,
  phosphorus_draw float4 NOT NULL,
  potassium_draw float4 NOT NULL,
  stress_multiplier float4 NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS public.soil_recovery_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soil_type text NOT NULL UNIQUE,
  recovery_modifier float4 NOT NULL,
  water_retention float4 NOT NULL,
  organic_support float4 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.soil_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  previous_crop text NOT NULL,
  soil_type text NOT NULL,
  farming_method text NOT NULL,
  weeks_since_harvest int NOT NULL CHECK (weeks_since_harvest >= 0),
  nitrogen_score float4 NOT NULL,
  phosphorus_score float4 NOT NULL,
  potassium_score float4 NOT NULL,
  stress_score float4 NOT NULL,
  recovery_weeks float4 NOT NULL,
  recommended_crop text NOT NULL,
  compost_plan text NOT NULL,
  green_manure_plan text NOT NULL,
  gemini_advisory text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.soil_sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  nitrogen float4,
  phosphorus float4,
  potassium float4,
  moisture float4,
  ph float4,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 14. Backward Compatibility Views
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.marketplace_listings AS
  SELECT
    id,
    farmer_id,
    crop_name AS crop,
    quantity_kg,
    min_price AS min_price_per_kg,
    status,
    created_at
  FROM public.listings;

CREATE OR REPLACE VIEW public.community_posts AS
  SELECT
    id,
    author_id,
    title,
    body,
    crop_tag AS crop,
    region_tag AS region,
    upvotes,
    validated_count,
    success_rate,
    created_at
  FROM public.knowledge_posts;

CREATE OR REPLACE VIEW public.crops AS
  SELECT
    id,
    farm_id,
    crop_name AS name,
    season,
    area_acres,
    created_at
  FROM public.crop_plans;

-- -----------------------------------------------------------------------------
-- 15. Performance Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON public.farmer_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_group_id ON public.farms(group_id);
CREATE INDEX IF NOT EXISTS idx_farms_village ON public.farms(village);

CREATE INDEX IF NOT EXISTS idx_farmer_groups_code ON public.farmer_groups(code);
CREATE INDEX IF NOT EXISTS idx_farmer_groups_village ON public.farmer_groups(village);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON public.group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user ON public.group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON public.group_memberships(status);

CREATE INDEX IF NOT EXISTS idx_crop_plans_farm_id ON public.crop_plans(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_status ON public.crop_plans(status);
CREATE INDEX IF NOT EXISTS idx_crop_plans_crop_name ON public.crop_plans(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_plans_harvest_date ON public.crop_plans(expected_harvest_date);

CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_crop_name ON public.listings(crop_name);
CREATE INDEX IF NOT EXISTS idx_listings_farmer_id ON public.listings(farmer_id);

CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON public.bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_buyer_id ON public.bids(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);

CREATE INDEX IF NOT EXISTS idx_mandi_crop_date ON public.mandi_prices(crop_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_mandi_state_date ON public.mandi_prices(state, date DESC);

CREATE INDEX IF NOT EXISTS idx_weather_cluster_date ON public.weather_cache(cluster_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_crop_tag ON public.knowledge_posts(crop_tag);
CREATE INDEX IF NOT EXISTS idx_knowledge_region_tag ON public.knowledge_posts(region_tag);
CREATE INDEX IF NOT EXISTS idx_knowledge_upvotes ON public.knowledge_posts(upvotes DESC);

CREATE INDEX IF NOT EXISTS idx_soil_analyses_farm_created ON public.soil_analyses(farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_soil_sensor_farm_created ON public.soil_sensor_readings(farm_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 16. Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandi_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_npk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_recovery_profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 17. Row Level Security Policies
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role IN ('coordinator', 'admin')
  );
$$;

-- USERS POLICIES
DROP POLICY IF EXISTS "users_select_all" ON public.users;
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid() OR public.is_coordinator_or_admin())
  WITH CHECK (auth_id = auth.uid() OR public.is_coordinator_or_admin());

-- FARMER PROFILES POLICIES
DROP POLICY IF EXISTS "farmer_profiles_select_all" ON public.farmer_profiles;
CREATE POLICY "farmer_profiles_select_all" ON public.farmer_profiles
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "farmer_profiles_modify_own" ON public.farmer_profiles;
CREATE POLICY "farmer_profiles_modify_own" ON public.farmer_profiles
  FOR ALL TO authenticated
  USING (user_id = public.current_user_id() OR public.is_coordinator_or_admin())
  WITH CHECK (user_id = public.current_user_id() OR public.is_coordinator_or_admin());

-- FARMER GROUPS POLICIES
DROP POLICY IF EXISTS "farmer_groups_select_all" ON public.farmer_groups;
CREATE POLICY "farmer_groups_select_all" ON public.farmer_groups
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "farmer_groups_modify_coordinator" ON public.farmer_groups;
CREATE POLICY "farmer_groups_modify_coordinator" ON public.farmer_groups
  FOR ALL TO authenticated
  USING (leader_id = public.current_user_id() OR public.is_coordinator_or_admin())
  WITH CHECK (leader_id = public.current_user_id() OR public.is_coordinator_or_admin());

-- GROUP MEMBERSHIPS POLICIES
DROP POLICY IF EXISTS "memberships_select_all" ON public.group_memberships;
CREATE POLICY "memberships_select_all" ON public.group_memberships
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "memberships_insert_user" ON public.group_memberships;
CREATE POLICY "memberships_insert_user" ON public.group_memberships
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_user_id() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "memberships_update_manage" ON public.group_memberships;
CREATE POLICY "memberships_update_manage" ON public.group_memberships
  FOR UPDATE TO authenticated
  USING (user_id = public.current_user_id() OR public.is_coordinator_or_admin());

-- FARMS POLICIES
DROP POLICY IF EXISTS "farms_select_all" ON public.farms;
CREATE POLICY "farms_select_all" ON public.farms
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "farms_insert_own" ON public.farms;
CREATE POLICY "farms_insert_own" ON public.farms
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.current_user_id() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "farms_update_own" ON public.farms;
CREATE POLICY "farms_update_own" ON public.farms
  FOR UPDATE TO authenticated
  USING (owner_id = public.current_user_id() OR public.is_coordinator_or_admin())
  WITH CHECK (owner_id = public.current_user_id() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "farms_delete_own" ON public.farms;
CREATE POLICY "farms_delete_own" ON public.farms
  FOR DELETE TO authenticated
  USING (owner_id = public.current_user_id() OR public.is_coordinator_or_admin());

-- CROP PLANS POLICIES
DROP POLICY IF EXISTS "crop_plans_select_all" ON public.crop_plans;
CREATE POLICY "crop_plans_select_all" ON public.crop_plans
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "crop_plans_insert_own_farm" ON public.crop_plans;
CREATE POLICY "crop_plans_insert_own_farm" ON public.crop_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms WHERE id = crop_plans.farm_id AND owner_id = public.current_user_id())
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "crop_plans_update_own_farm" ON public.crop_plans;
CREATE POLICY "crop_plans_update_own_farm" ON public.crop_plans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = crop_plans.farm_id AND owner_id = public.current_user_id())
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "crop_plans_delete_own_farm" ON public.crop_plans;
CREATE POLICY "crop_plans_delete_own_farm" ON public.crop_plans
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms WHERE id = crop_plans.farm_id AND owner_id = public.current_user_id())
    OR public.is_coordinator_or_admin()
  );

-- LISTINGS POLICIES
DROP POLICY IF EXISTS "listings_select_all" ON public.listings;
CREATE POLICY "listings_select_all" ON public.listings
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "listings_insert_farmer" ON public.listings;
CREATE POLICY "listings_insert_farmer" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = public.current_user_id() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "listings_update_farmer" ON public.listings;
CREATE POLICY "listings_update_farmer" ON public.listings
  FOR UPDATE TO authenticated
  USING (farmer_id = public.current_user_id() OR public.is_coordinator_or_admin());

-- BIDS POLICIES
DROP POLICY IF EXISTS "bids_select_participant" ON public.bids;
CREATE POLICY "bids_select_participant" ON public.bids
  FOR SELECT TO authenticated, anon
  USING (
    buyer_id = public.current_user_id()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = bids.listing_id AND l.farmer_id = public.current_user_id()
    )
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "bids_insert_buyer" ON public.bids;
CREATE POLICY "bids_insert_buyer" ON public.bids
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = public.current_user_id() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "bids_update_parties" ON public.bids;
CREATE POLICY "bids_update_parties" ON public.bids
  FOR UPDATE TO authenticated
  USING (
    buyer_id = public.current_user_id()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = bids.listing_id AND l.farmer_id = public.current_user_id()
    )
    OR public.is_coordinator_or_admin()
  );

-- MANDI & WEATHER POLICIES
DROP POLICY IF EXISTS "mandi_read_all" ON public.mandi_prices;
CREATE POLICY "mandi_read_all" ON public.mandi_prices FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "mandi_write_admin" ON public.mandi_prices;
CREATE POLICY "mandi_write_admin" ON public.mandi_prices FOR ALL TO authenticated
  USING (public.is_coordinator_or_admin()) WITH CHECK (public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "weather_read_all" ON public.weather_cache;
CREATE POLICY "weather_read_all" ON public.weather_cache FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "weather_write_admin" ON public.weather_cache;
CREATE POLICY "weather_write_admin" ON public.weather_cache FOR ALL TO authenticated
  USING (public.is_coordinator_or_admin()) WITH CHECK (public.is_coordinator_or_admin());

-- KNOWLEDGE POSTS POLICIES
DROP POLICY IF EXISTS "knowledge_select_all" ON public.knowledge_posts;
CREATE POLICY "knowledge_select_all" ON public.knowledge_posts FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "knowledge_insert_user" ON public.knowledge_posts;
CREATE POLICY "knowledge_insert_user" ON public.knowledge_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = public.current_user_id() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "knowledge_update_author" ON public.knowledge_posts;
CREATE POLICY "knowledge_update_author" ON public.knowledge_posts FOR UPDATE TO authenticated
  USING (author_id = public.current_user_id() OR public.is_coordinator_or_admin());

-- REFERENCE TABLES POLICIES
DROP POLICY IF EXISTS "crop_npk_read" ON public.crop_npk_profiles;
CREATE POLICY "crop_npk_read" ON public.crop_npk_profiles FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "soil_recovery_read" ON public.soil_recovery_profiles;
CREATE POLICY "soil_recovery_read" ON public.soil_recovery_profiles FOR SELECT TO authenticated, anon USING (true);

-- -----------------------------------------------------------------------------
-- 18. Auto-Profile Trigger for Supabase Auth
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role := 'farmer';
  v_user_id uuid;
BEGIN
  IF (NEW.raw_user_meta_data->>'role') = 'buyer' THEN
    v_role := 'buyer';
  ELSIF (NEW.raw_user_meta_data->>'role') = 'coordinator' THEN
    v_role := 'coordinator';
  ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.users (auth_id, email, full_name, role, preferred_language, village)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'kn'),
    COALESCE(NEW.raw_user_meta_data->>'village', 'Hunasagi')
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now()
  RETURNING id INTO v_user_id;

  IF v_role = 'farmer' THEN
    INSERT INTO public.farmer_profiles (user_id, primary_crops, total_land_acres)
    VALUES (v_user_id, ARRAY['Tomato', 'Onion'], 3.5)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 19. Seed Data (Idempotent Multi-Cluster Dataset)
-- -----------------------------------------------------------------------------

INSERT INTO public.users (id, full_name, email, phone, role, preferred_language, village, district, state)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Sharanappa Gowda', 'farmer.sharanappa@sanjha.network', '+91 98450 12345', 'farmer', 'kn', 'Hunasagi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000002', 'Basavaraj Patil', 'coord.patil@sanjha.network', '+91 98450 23456', 'coordinator', 'kn', 'Hunasagi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000003', 'AgroFresh Procurement Ltd', 'buyer.agrofresh@sanjha.network', '+91 98450 34567', 'buyer', 'en', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000004', 'Renuka Devi', 'farmer.renuka@sanjha.network', '+91 98450 45678', 'farmer', 'kn', 'Hunasagi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000005', 'Hanumantappa Pujari', 'farmer.hanumant@sanjha.network', '+91 98450 56789', 'farmer', 'kn', 'Kembhavi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000006', 'Kembhavi Raitha Sangha', 'fpo.kembhavi@sanjha.network', '+91 98450 67890', 'coordinator', 'kn', 'Kembhavi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000007', 'Mallikarjun Biradar', 'farmer.mallikarjun@sanjha.network', '+91 98450 78901', 'farmer', 'kn', 'Kembhavi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000008', 'Venkatesh Nayak', 'farmer.venkatesh@sanjha.network', '+91 98450 89012', 'farmer', 'kn', 'Shorapur', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000009', 'Raja Venkatappa FPO', 'fpo.shorapur@sanjha.network', '+91 98450 90123', 'coordinator', 'kn', 'Shorapur', 'Yadgir', 'Karnataka')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

INSERT INTO public.farmer_profiles (user_id, experience_years, total_land_acres, primary_crops, has_irrigation, kyc_status, cooperative_name)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 12, 3.5, ARRAY['Tomato', 'Onion', 'Chilli'], true, 'verified', 'Hunasagi Raitha Sangha'),
  ('a1000000-0000-0000-0000-000000000004', 8, 2.0, ARRAY['Tomato', 'Wheat'], true, 'verified', 'Hunasagi Raitha Sangha'),
  ('a1000000-0000-0000-0000-000000000005', 15, 4.8, ARRAY['Cotton', 'Bengal Gram'], true, 'verified', 'Kembhavi Pulse Growers Association'),
  ('a1000000-0000-0000-0000-000000000007', 10, 3.2, ARRAY['Red Gram', 'Cotton'], true, 'verified', 'Kembhavi Pulse Growers Association'),
  ('a1000000-0000-0000-0000-000000000008', 14, 5.5, ARRAY['Paddy', 'Groundnut'], true, 'verified', 'Shorapur Krishna Basin Co-op')
ON CONFLICT (user_id) DO UPDATE SET
  total_land_acres = EXCLUDED.total_land_acres,
  primary_crops = EXCLUDED.primary_crops;

INSERT INTO public.farmer_groups (id, name, code, village, district, state, description, leader_id, lat, lng, total_acres)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Hunasagi Progressive Farmers Cluster', 'HUN-01', 'Hunasagi', 'Yadgir', 'Karnataka', 'Pioneering synchronized tomato, onion and chilli cultivation with integrated drip and waste-to-wealth pooling.', 'a1000000-0000-0000-0000-000000000002', 16.450000, 76.450000, 142.5),
  ('b1000000-0000-0000-0000-000000000002', 'Kembhavi Integrated Pulses & Cotton Cluster', 'KEM-01', 'Kembhavi', 'Yadgir', 'Karnataka', 'Cooperative red gram, bengal gram and Bt cotton cluster with shared farmgate sorting and APMC forward contracts.', 'a1000000-0000-0000-0000-000000000006', 16.664000, 76.562000, 198.0),
  ('b1000000-0000-0000-0000-000000000003', 'Shorapur Krishna Basin Paddy Cluster', 'SHO-01', 'Shorapur', 'Yadgir', 'Karnataka', 'Krishna canal command area cooperative focused on premium Sona Masoori paddy and groundnut rotation.', 'a1000000-0000-0000-0000-000000000009', 16.520000, 76.758000, 245.0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  total_acres = EXCLUDED.total_acres;

INSERT INTO public.group_memberships (group_id, user_id, role, status)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'coordinator', 'active'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'member', 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'coordinator', 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 'member', 'active'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000009', 'coordinator', 'active'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008', 'member', 'active')
ON CONFLICT (group_id, user_id) DO UPDATE SET
  status = EXCLUDED.status;

INSERT INTO public.farms (id, owner_id, group_id, name, acres, village, district, state, soil_type, survey_number, irrigation_type, lat, lng)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Gowda South Field', 3.5, 'Hunasagi', 'Yadgir', 'Karnataka', 'loamy', 'SY-142/B', 'drip', 16.452000, 76.448000),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Renuka Krishna Valley Farm', 2.0, 'Hunasagi', 'Yadgir', 'Karnataka', 'clay', 'SY-89/1', 'canal_drip', 16.458000, 76.453000),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Basavaraj Canal Plot', 4.2, 'Hunasagi', 'Yadgir', 'Karnataka', 'loamy', 'SY-210/C', 'canal', 16.446000, 76.456000),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Sanjha Co-op Tomato Plot', 5.0, 'Hunasagi', 'Yadgir', 'Karnataka', 'black', 'SY-55/A', 'drip', 16.451000, 76.442000),
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'Patil Cotton Acreage', 4.8, 'Kembhavi', 'Yadgir', 'Karnataka', 'black', 'SY-78/2', 'borewell', 16.665000, 76.561000),
  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'Kembhavi Pulse Cooperative', 6.0, 'Kembhavi', 'Yadgir', 'Karnataka', 'loamy', 'SY-104/1', 'rainfed_drip', 16.669000, 76.568000),
  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'Mallikarjun Red Gram Plot', 3.2, 'Kembhavi', 'Yadgir', 'Karnataka', 'red', 'SY-33/B', 'rainfed', 16.660000, 76.556000),
  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'Shorapur Basin Paddy Farm', 5.5, 'Shorapur', 'Yadgir', 'Karnataka', 'clay', 'SY-12/A', 'canal', 16.522000, 76.755000),
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 'Raja Venkatappa Canal Plot', 4.0, 'Shorapur', 'Yadgir', 'Karnataka', 'loamy', 'SY-91/C', 'canal_drip', 16.518000, 76.762000)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  acres = EXCLUDED.acres;

INSERT INTO public.crop_plans (id, farm_id, crop_name, variety, season, area_acres, sowing_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, estimated_yield_kg, notes)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Tomato', 'Abhinav Hybrid', 'Kharif', 1.5, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '14 days', 'growing', 78, 74, 6200, 'Breaker stage. Peak tomato arrivals in Hunasagi yard; stagger by 4 days recommended.'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Onion', 'Bhima Super', 'Kharif', 2.0, CURRENT_DATE - INTERVAL '75 days', CURRENT_DATE + INTERVAL '24 days', CURRENT_DATE + INTERVAL '24 days', 'growing', 36, 38, 8400, 'Moderate market pressure. Optimal vegetative canopy.'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Tomato', 'Saaho F1', 'Kharif', 2.0, CURRENT_DATE - INTERVAL '65 days', CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '10 days', 'harvest_ready', 72, 70, 7800, 'Heavy clay soil drainage risk during rain. Stagger harvest advised.'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'Onion', 'Pusa Red', 'Kharif', 4.2, CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', 'growing', 32, 35, 16500, 'Canal plot. Steady APMC demand expected.'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004', 'Tomato', 'Namdhari NS-501', 'Kharif', 5.0, CURRENT_DATE - INTERVAL '62 days', CURRENT_DATE + INTERVAL '9 days', CURRENT_DATE + INTERVAL '13 days', 'harvest_ready', 82, 88, 21000, 'Critical saturation: 21 tons harvest coinciding with peer plots.'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 'Cotton', 'Bt Cotton RCH-2', 'Kharif', 4.8, CURRENT_DATE - INTERVAL '130 days', CURRENT_DATE + INTERVAL '19 days', CURRENT_DATE + INTERVAL '19 days', 'growing', 22, 26, 4800, 'Boll maturation on track. High resilience black cotton soil.'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000006', 'Bengal Gram', 'JG-11 (Chana)', 'Rabi', 6.0, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', 'growing', 18, 22, 5400, 'Low moisture stress; nitrogen fixing pulse rotation.'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000007', 'Red Gram', 'TS-3R (Maruti)', 'Kharif', 3.2, CURRENT_DATE - INTERVAL '135 days', CURRENT_DATE + INTERVAL '33 days', CURRENT_DATE + INTERVAL '33 days', 'growing', 24, 26, 2800, 'Pod formation stage. Stable market price at Kembhavi APMC.'),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000008', 'Paddy', 'BPT 5204 (Sona Masoori)', 'Kharif', 5.5, CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '16 days', 'growing', 26, 30, 14000, 'Canal water steady. Institutional grain procurement assured.'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000009', 'Groundnut', 'TMV-2', 'Kharif', 4.0, CURRENT_DATE - INTERVAL '95 days', CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE + INTERVAL '21 days', 'growing', 31, 34, 5200, 'Pod maturity testing 75% dark inner shell.')
ON CONFLICT (id) DO UPDATE SET
  dri_score = EXCLUDED.dri_score,
  status = EXCLUDED.status;

INSERT INTO public.listings (id, farm_id, farmer_id, crop_name, quantity_kg, quality_grade, min_price, available_date, location_text, lat, lng, status)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Tomato', 2500, 'A', 34.00, CURRENT_DATE + INTERVAL '10 days', 'Hunasagi Mandi Yard', 16.452000, 76.448000, 'open'),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Onion', 4000, 'A', 28.50, CURRENT_DATE + INTERVAL '24 days', 'Hunasagi Mandi Yard', 16.452000, 76.448000, 'open'),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Cotton', 3000, 'A', 72.00, CURRENT_DATE + INTERVAL '18 days', 'Kembhavi Cotton Collection Center', 16.665000, 76.561000, 'open'),
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'Paddy', 8000, 'A', 25.00, CURRENT_DATE + INTERVAL '15 days', 'Shorapur APMC Warehouse', 16.522000, 76.755000, 'open')
ON CONFLICT (id) DO UPDATE SET
  min_price = EXCLUDED.min_price,
  quantity_kg = EXCLUDED.quantity_kg;

INSERT INTO public.bids (id, listing_id, buyer_id, price_per_kg, message, status)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 36.50, 'Can pick up directly at farmgate with refrigerated truck on harvest day.', 'pending')
ON CONFLICT (id) DO UPDATE SET
  price_per_kg = EXCLUDED.price_per_kg;

INSERT INTO public.mandi_prices (crop_name, market_name, district, state, price_min, price_max, price_modal, date, source)
VALUES
  ('Tomato', 'Hunasagi APMC Yard', 'Yadgir', 'Karnataka', 2800, 3600, 3200, CURRENT_DATE, 'agmarknet'),
  ('Tomato', 'Yadgir APMC', 'Yadgir', 'Karnataka', 3100, 3900, 3500, CURRENT_DATE, 'agmarknet'),
  ('Tomato', 'Yeshwanthpur Bangalore', 'Bangalore Urban', 'Karnataka', 3800, 4800, 4300, CURRENT_DATE, 'agmarknet'),
  ('Cotton', 'Kembhavi Cotton Yard', 'Yadgir', 'Karnataka', 6800, 7500, 7200, CURRENT_DATE, 'agmarknet'),
  ('Bengal Gram', 'Kembhavi APMC', 'Yadgir', 'Karnataka', 5800, 6400, 6100, CURRENT_DATE, 'agmarknet'),
  ('Red Gram', 'Gulbarga APMC', 'Kalaburagi', 'Karnataka', 9200, 10500, 9800, CURRENT_DATE, 'agmarknet'),
  ('Paddy', 'Shorapur APMC', 'Yadgir', 'Karnataka', 2300, 2600, 2450, CURRENT_DATE, 'agmarknet'),
  ('Groundnut', 'Shorapur APMC', 'Yadgir', 'Karnataka', 6400, 7100, 6800, CURRENT_DATE, 'agmarknet'),
  ('Onion', 'Yadgir APMC', 'Yadgir', 'Karnataka', 2400, 3200, 2800, CURRENT_DATE, 'agmarknet'),
  ('Chilli', 'Byadgi APMC', 'Haveri', 'Karnataka', 16500, 24000, 19800, CURRENT_DATE, 'agmarknet'),
  ('Wheat', 'Bijapur APMC', 'Vijayapura', 'Karnataka', 2800, 3400, 3100, CURRENT_DATE, 'agmarknet')
ON CONFLICT DO NOTHING;

INSERT INTO public.weather_cache (cluster_id, date, temp_max, temp_min, rainfall_mm, condition, humidity)
VALUES
  ('HUN-01', CURRENT_DATE, 33.5, 22.0, 8.4, 'scattered_showers', 72.0),
  ('HUN-01', CURRENT_DATE + 1, 31.0, 21.0, 12.0, 'rainy', 82.0),
  ('HUN-01', CURRENT_DATE + 2, 32.0, 21.5, 4.0, 'cloudy', 65.0),
  ('KEM-01', CURRENT_DATE, 31.8, 20.5, 0.0, 'clear', 48.0),
  ('KEM-01', CURRENT_DATE + 1, 32.5, 21.0, 0.0, 'sunny', 46.0),
  ('KEM-01', CURRENT_DATE + 2, 33.0, 21.5, 0.0, 'clear', 50.0),
  ('SHO-01', CURRENT_DATE, 34.0, 23.0, 1.2, 'partly_cloudy', 54.0),
  ('SHO-01', CURRENT_DATE + 1, 33.0, 22.5, 0.0, 'clear', 52.0),
  ('SHO-01', CURRENT_DATE + 2, 34.5, 23.0, 0.0, 'clear', 50.0)
ON CONFLICT DO NOTHING;


INSERT INTO public.knowledge_posts (id, author_id, cluster_id, crop_tag, pest_tag, region_tag, title, body, language, upvotes, validated_count, success_rate)
VALUES
  ('k1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'HUN-01', 'Tomato', 'Tuta absoluta / Pinworm', 'Yadgir', 'ಪೆರೋಮೋನ್ ಬಲೆ ಮತ್ತು ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಣೆ (Pheromone Traps for Tomato Pinworm)', 'ಟೊಮೆಟೊ ಬೆಳೆಯಲ್ಲಿ ಪಿನ್‌ವರ್ಮ್ ನಿಯಂತ್ರಣಕ್ಕೆ ಎಕರೆಗೆ 12 ಪೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ. ಸಂಜೆ 5 ಲೀಟರ್ ನೀರಿಗೆ 10 ಮಿಲಿ ಬೇವಿನ ಎಣ್ಣೆ (10,000 ppm) ಮಿಶ್ರಣ ಮಾಡಿ ಸಿಂಪಡಿಸಿದಾಗ 85% ಕ್ಕೂ ಹೆಚ್ಚು ನಿಯಂತ್ರಣ ಕಂಡಿದೆ.', 'kn', 42, 18, 92),
  ('k1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'HUN-01', 'Onion', 'Purple Blotch / ಕಪ್ಪು ಚುಕ್ಕೆ', 'Yadgir', 'ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ಶಿಲೀಂಧ್ರ ನಿಯಂತ್ರಣ (Managing Purple Blotch via Drip Scheduling)', 'ಹೆಚ್ಚು ಆರ್ದ್ರತೆ ಇರುವಾಗ ಹನಿ ನೀರಾವರಿಯನ್ನು ಮುಂಜಾನೆ 6-8 ಗಂಟೆಯೊಳಗೆ ಮುಗಿಸಿ. ಎಲೆಗಳ ಮೇಲೆ ನೀರು ದೀರ್ಘಕಾಲ ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಂಡರೆ ಪರ್ಪಲ್ ಬ್ಲಾಚ್ ಹರಡುವಿಕೆ ತಡೆಯಬಹುದು.', 'kn', 35, 14, 88),
  ('k1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'HUN-01', 'Waste to Wealth', 'Crop Residue', 'Yadgir', 'Bio-pelleting Tomato Stems for Local Biomass Power Plants', 'Instead of burning dry tomato vines, our cluster combined 8 tons and sold directly to the Gulbarga biomass pellet plant at ₹4,200/ton, netting ₹33,600 extra revenue and preventing open burning.', 'en', 64, 26, 96)
ON CONFLICT (id) DO UPDATE SET
  upvotes = EXCLUDED.upvotes;

INSERT INTO public.crop_npk_profiles (crop_name, nitrogen_draw, phosphorus_draw, potassium_draw, stress_multiplier)
VALUES
  ('tomato', 72, 48, 78, 1.05),
  ('onion', 55, 42, 50, 1.0),
  ('paddy', 62, 38, 45, 1.18),
  ('rice', 62, 38, 45, 1.18),
  ('wheat', 58, 52, 48, 0.95),
  ('maize', 68, 45, 52, 1.02),
  ('potato', 65, 55, 70, 1.08),
  ('chilli', 70, 46, 65, 1.06),
  ('pulses', 35, 38, 32, 0.88),
  ('legume', 35, 38, 32, 0.88),
  ('cotton', 75, 50, 72, 1.12),
  ('sugarcane', 80, 45, 85, 1.15)
ON CONFLICT (crop_name) DO UPDATE SET
  nitrogen_draw = EXCLUDED.nitrogen_draw,
  phosphorus_draw = EXCLUDED.phosphorus_draw,
  potassium_draw = EXCLUDED.potassium_draw,
  stress_multiplier = EXCLUDED.stress_multiplier;

INSERT INTO public.soil_recovery_profiles (soil_type, recovery_modifier, water_retention, organic_support)
VALUES
  ('loamy', 0.92, 0.55, 0.72),
  ('clay', 1.12, 0.78, 0.65),
  ('sandy', 1.05, 0.28, 0.45),
  ('red', 1.0, 0.42, 0.58),
  ('black', 0.88, 0.62, 0.80)
ON CONFLICT (soil_type) DO UPDATE SET
  recovery_modifier = EXCLUDED.recovery_modifier,
  water_retention = EXCLUDED.water_retention,
  organic_support = EXCLUDED.organic_support;
