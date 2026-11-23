-- =============================================================================
-- SANJHA — Community Crop Intelligence Migration
-- Run in Supabase SQL Editor AFTER schema.sql
-- Safe to run multiple times (uses IF NOT EXISTS / DROP POLICY IF EXISTS)
-- =============================================================================

-- Main community crop plans table
-- Note: Uses `public.community_crop_plans` to avoid touching legacy `public.crop_plans`.
-- `farmer_id` maps directly to Supabase `auth.users(id)` as verified in the live schema.
CREATE TABLE IF NOT EXISTS public.community_crop_plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  farm_id         uuid        NOT NULL REFERENCES public.farms(id)  ON DELETE CASCADE,
  village         text        NOT NULL DEFAULT '',
  crop_name       text        NOT NULL CHECK (char_length(trim(crop_name)) > 0),
  acreage         numeric     NOT NULL CHECK (acreage > 0 AND acreage <= 10000),
  season          text        NOT NULL DEFAULT 'kharif'
                              CHECK (season IN ('kharif', 'rabi', 'zaid', 'annual')),
  sowing_period   text,
  harvest_period  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS community_crop_plans_farmer_idx
  ON public.community_crop_plans (farmer_id);
CREATE INDEX IF NOT EXISTS community_crop_plans_village_season_idx
  ON public.community_crop_plans (village, season);
CREATE INDEX IF NOT EXISTS community_crop_plans_farm_idx
  ON public.community_crop_plans (farm_id);

-- Dedicated auto-update trigger function (avoids modifying or conflicting with shared functions)
CREATE OR REPLACE FUNCTION public.set_community_crop_plans_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_crop_plans_updated_at ON public.community_crop_plans;
CREATE TRIGGER community_crop_plans_updated_at
  BEFORE UPDATE ON public.community_crop_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_community_crop_plans_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE public.community_crop_plans ENABLE ROW LEVEL SECURITY;

-- Farmers read only their own plans (never other farmers' plans)
DROP POLICY IF EXISTS "community_crop_plans_select_own" ON public.community_crop_plans;
CREATE POLICY "community_crop_plans_select_own" ON public.community_crop_plans
  FOR SELECT TO authenticated
  USING (farmer_id = auth.uid());

-- Farmers insert only for themselves and only for farms they own (farms.owner_id === auth.uid())
DROP POLICY IF EXISTS "community_crop_plans_insert_own" ON public.community_crop_plans;
CREATE POLICY "community_crop_plans_insert_own" ON public.community_crop_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    farmer_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = community_crop_plans.farm_id
        AND f.owner_id = auth.uid()
    )
  );

-- Farmers update only their own plans on farms they own (verifies both existing and updated row)
DROP POLICY IF EXISTS "community_crop_plans_update_own" ON public.community_crop_plans;
CREATE POLICY "community_crop_plans_update_own" ON public.community_crop_plans
  FOR UPDATE TO authenticated
  USING (
    farmer_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = community_crop_plans.farm_id
        AND f.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    farmer_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = community_crop_plans.farm_id
        AND f.owner_id = auth.uid()
    )
  );

-- Farmers delete only their own plans
DROP POLICY IF EXISTS "community_crop_plans_delete_own" ON public.community_crop_plans;
CREATE POLICY "community_crop_plans_delete_own" ON public.community_crop_plans
  FOR DELETE TO authenticated
  USING (farmer_id = auth.uid());

-- NOTE: Community aggregation is performed server-side via service_role key.
-- Individual farmer data is NEVER exposed through community aggregation endpoints.
