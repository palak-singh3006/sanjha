-- =============================================================================
-- Sanjha — Soil Recovery & Next Crop (run in Supabase SQL Editor)
-- =============================================================================
-- PHASE GUIDE (plain language — share with teammates):
--
-- Phase A — Env: .env.local has Supabase URL + service_role + GEMINI_API_KEY.
-- Phase B — This file: creates tables + seed reference data + RLS safety net.
-- Phase C — App: POST /api/soil/analyze saves one row per analysis per farm.
-- Phase D — History: GET /api/soil/history?farmId=... for charts / past runs.
-- Phase E — Static tips: GET /api/soil/recommendations?crop=&soil= (+ optional AI).
-- Phase F — IoT later: POST /api/soil/sensor-ingest stores raw readings (no logic yet).
--
-- After running: restart `npm run dev` if you only changed DB (not required, but good habit).
-- =============================================================================

-- Reference: estimated nutrient draw per crop (heuristic constants, tune with agronomist)
CREATE TABLE IF NOT EXISTS crop_npk_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name       text NOT NULL UNIQUE,
  nitrogen_draw   float4 NOT NULL,   -- relative draw 0–100 scale contribution
  phosphorus_draw float4 NOT NULL,
  potassium_draw  float4 NOT NULL,
  stress_multiplier float4 NOT NULL DEFAULT 1.0
);

-- Reference: soil type modifiers for recovery narrative + math
CREATE TABLE IF NOT EXISTS soil_recovery_profiles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soil_type          text NOT NULL UNIQUE,
  recovery_modifier  float4 NOT NULL,  -- >1 = slower recovery, <1 = faster
  water_retention    float4 NOT NULL, -- 0–1, high + paddy = extra stress
  organic_support    float4 NOT NULL  -- 0–1, higher = organic practices easier
);

-- One saved analysis per run (NPK + stress + plans + optional Gemini text)
CREATE TABLE IF NOT EXISTS soil_analyses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id               uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  previous_crop         text NOT NULL,
  soil_type             text NOT NULL,
  farming_method        text NOT NULL,
  weeks_since_harvest   int NOT NULL CHECK (weeks_since_harvest >= 0),
  nitrogen_score        float4 NOT NULL,
  phosphorus_score      float4 NOT NULL,
  potassium_score       float4 NOT NULL,
  stress_score          float4 NOT NULL,
  recovery_weeks        float4 NOT NULL,
  recommended_crop      text NOT NULL,
  compost_plan          text NOT NULL,
  green_manure_plan     text NOT NULL,
  gemini_advisory       text,          -- short farmer-friendly AI summary (optional)
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS soil_analyses_farm_created_idx
  ON soil_analyses (farm_id, created_at DESC);

-- Future IoT: raw sensor rows (normalize / merge into analyses in a later job)
CREATE TABLE IF NOT EXISTS soil_sensor_readings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  nitrogen    float4,
  phosphorus  float4,
  potassium   float4,
  moisture    float4,
  ph          float4,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS soil_sensor_farm_created_idx
  ON soil_sensor_readings (farm_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Seed crop NPK profiles (heuristic — document changes with agronomy team)
-- -----------------------------------------------------------------------------
INSERT INTO crop_npk_profiles (crop_name, nitrogen_draw, phosphorus_draw, potassium_draw, stress_multiplier)
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

INSERT INTO soil_recovery_profiles (soil_type, recovery_modifier, water_retention, organic_support)
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

-- -----------------------------------------------------------------------------
-- RLS (safety net when frontend uses anon key later; service_role bypasses RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE soil_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_npk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_recovery_profiles ENABLE ROW LEVEL SECURITY;

-- Reference tables: read-only to authenticated users
DROP POLICY IF EXISTS "read_crop_npk" ON crop_npk_profiles;
CREATE POLICY "read_crop_npk" ON crop_npk_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_soil_recovery_profiles" ON soil_recovery_profiles;
CREATE POLICY "read_soil_recovery_profiles" ON soil_recovery_profiles FOR SELECT TO authenticated USING (true);

-- Analyses: farmers see own farm rows
DROP POLICY IF EXISTS "soil_analyses_select_own_farm" ON soil_analyses;
CREATE POLICY "soil_analyses_select_own_farm" ON soil_analyses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM farms f WHERE f.id = soil_analyses.farm_id AND f.owner_id = auth.uid()
  ));

-- Inserts via anon: optional later; API uses service_role today
DROP POLICY IF EXISTS "soil_analyses_insert_own_farm" ON soil_analyses;
CREATE POLICY "soil_analyses_insert_own_farm" ON soil_analyses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM farms f WHERE f.id = soil_analyses.farm_id AND f.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "soil_sensor_select_own_farm" ON soil_sensor_readings;
CREATE POLICY "soil_sensor_select_own_farm" ON soil_sensor_readings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM farms f WHERE f.id = soil_sensor_readings.farm_id AND f.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "soil_sensor_insert_own_farm" ON soil_sensor_readings;
CREATE POLICY "soil_sensor_insert_own_farm" ON soil_sensor_readings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM farms f WHERE f.id = soil_sensor_readings.farm_id AND f.owner_id = auth.uid()
  ));
