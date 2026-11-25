-- =============================================================================
-- SANJHA FAIL-SAFE MULTI-CLUSTER DYNAMIC SEED SCRIPT
-- Compatible with live Supabase database tables (`clusters`, `farms`, etc.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure `clusters` table has all necessary columns, & create `farmer_groups` view
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  village text,
  district text DEFAULT 'Yadgir',
  state text DEFAULT 'Karnataka',
  description text,
  lat numeric(10,6) DEFAULT 16.450000,
  lng numeric(10,6) DEFAULT 76.450000,
  total_acres numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clusters 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS district text DEFAULT 'Yadgir',
  ADD COLUMN IF NOT EXISTS state text DEFAULT 'Karnataka',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS lat numeric(10,6) DEFAULT 16.450000,
  ADD COLUMN IF NOT EXISTS lng numeric(10,6) DEFAULT 76.450000,
  ADD COLUMN IF NOT EXISTS total_acres numeric(10,2) DEFAULT 0;

-- Create compatibility view so BOTH `clusters` and `farmer_groups` work everywhere
CREATE OR REPLACE VIEW public.farmer_groups AS 
SELECT * FROM public.clusters;

-- -----------------------------------------------------------------------------
-- 2. Populate Clusters (HUN-01, KEM-01, SHO-01)
-- -----------------------------------------------------------------------------
INSERT INTO public.clusters (id, name, code, village, district, state, description, lat, lng, total_acres)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'Hunasagi Progressive Farmers Cluster',
    'HUN-01',
    'Hunasagi',
    'Yadgir',
    'Karnataka',
    'Pioneering synchronized tomato, onion and chilli cultivation with integrated drip and waste-to-wealth pooling.',
    16.450000,
    76.450000,
    142.50
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'Kembhavi Integrated Pulses & Cotton Cluster',
    'KEM-01',
    'Kembhavi',
    'Yadgir',
    'Karnataka',
    'Cooperative red gram, bengal gram and Bt cotton cluster with shared farmgate sorting and APMC forward contracts.',
    16.664000,
    76.562000,
    198.00
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Shorapur Krishna Basin Paddy Cluster',
    'SHO-01',
    'Shorapur',
    'Yadgir',
    'Karnataka',
    'Krishna canal command area cooperative focused on premium Sona Masoori paddy and groundnut rotation.',
    16.520000,
    76.758000,
    245.00
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  village = EXCLUDED.village,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  total_acres = EXCLUDED.total_acres;

-- -----------------------------------------------------------------------------
-- 3. Ensure `farms` table has columns and seed multi-cluster farms
-- -----------------------------------------------------------------------------
ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS cluster_id uuid,
  ADD COLUMN IF NOT EXISTS cluster_code text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS acres numeric,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS district text DEFAULT 'Yadgir',
  ADD COLUMN IF NOT EXISTS state text DEFAULT 'Karnataka',
  ADD COLUMN IF NOT EXISTS soil_type text DEFAULT 'loamy',
  ADD COLUMN IF NOT EXISTS lat numeric(10,6),
  ADD COLUMN IF NOT EXISTS lng numeric(10,6);

-- Seed farms using DO block to handle owner_id safely
DO $$
DECLARE
  v_owner uuid;
BEGIN
  -- Look for an existing user in auth.users or public.users
  BEGIN
    SELECT id INTO v_owner FROM auth.users LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_owner := NULL;
  END;

  IF v_owner IS NULL THEN
    v_owner := 'a1000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- 1. Gowda South Field (Hunasagi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000001', 'Gowda South Field', 3.5, 'Hunasagi', 'Yadgir', 'Karnataka', 'loamy', 16.452000, 76.448000, 'b1000000-0000-0000-0000-000000000001', 'HUN-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 2. Renuka Krishna Valley Farm (Hunasagi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000002', 'Renuka Krishna Valley Farm', 2.0, 'Hunasagi', 'Yadgir', 'Karnataka', 'clay', 16.458000, 76.453000, 'b1000000-0000-0000-0000-000000000001', 'HUN-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 3. Basavaraj Canal Plot (Hunasagi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000003', 'Basavaraj Canal Plot', 4.2, 'Hunasagi', 'Yadgir', 'Karnataka', 'loamy', 16.446000, 76.456000, 'b1000000-0000-0000-0000-000000000001', 'HUN-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 4. Sanjha Co-op Tomato Plot (Hunasagi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000004', 'Sanjha Co-op Tomato Plot', 5.0, 'Hunasagi', 'Yadgir', 'Karnataka', 'black', 16.451000, 76.442000, 'b1000000-0000-0000-0000-000000000001', 'HUN-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 5. Patil Cotton Acreage (Kembhavi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000005', 'Patil Cotton Acreage', 4.8, 'Kembhavi', 'Yadgir', 'Karnataka', 'black', 16.665000, 76.561000, 'b1000000-0000-0000-0000-000000000002', 'KEM-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 6. Kembhavi Pulse Cooperative (Kembhavi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000006', 'Kembhavi Pulse Cooperative', 6.0, 'Kembhavi', 'Yadgir', 'Karnataka', 'loamy', 16.669000, 76.568000, 'b1000000-0000-0000-0000-000000000002', 'KEM-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 7. Mallikarjun Red Gram Plot (Kembhavi)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000007', 'Mallikarjun Red Gram Plot', 3.2, 'Kembhavi', 'Yadgir', 'Karnataka', 'red', 16.660000, 76.556000, 'b1000000-0000-0000-0000-000000000002', 'KEM-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 8. Shorapur Basin Paddy Farm (Shorapur)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000008', 'Shorapur Basin Paddy Farm', 5.5, 'Shorapur', 'Yadgir', 'Karnataka', 'clay', 16.522000, 76.755000, 'b1000000-0000-0000-0000-000000000003', 'SHO-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

  -- 9. Raja Venkatappa Canal Plot (Shorapur)
  INSERT INTO public.farms (id, name, acres, village, district, state, soil_type, lat, lng, cluster_id, cluster_code)
  VALUES ('c1000000-0000-0000-0000-000000000009', 'Raja Venkatappa Canal Plot', 4.0, 'Shorapur', 'Yadgir', 'Karnataka', 'loamy', 16.518000, 76.762000, 'b1000000-0000-0000-0000-000000000003', 'SHO-01')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, acres = EXCLUDED.acres, soil_type = EXCLUDED.soil_type, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Ensure `crop_plans` table has columns and seed crop plans
-- -----------------------------------------------------------------------------
ALTER TABLE public.crop_plans
  ADD COLUMN IF NOT EXISTS farm_id uuid,
  ADD COLUMN IF NOT EXISTS crop_name text,
  ADD COLUMN IF NOT EXISTS variety text,
  ADD COLUMN IF NOT EXISTS season text DEFAULT 'Kharif',
  ADD COLUMN IF NOT EXISTS area_acres numeric,
  ADD COLUMN IF NOT EXISTS sowing_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS expected_harvest_date date,
  ADD COLUMN IF NOT EXISTS recommended_harvest_date date,
  ADD COLUMN IF NOT EXISTS dri_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS market_pressure int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_yield_kg numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'growing',
  ADD COLUMN IF NOT EXISTS notes text;

INSERT INTO public.crop_plans (id, farm_id, crop_name, variety, season, area_acres, sowing_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, estimated_yield_kg, notes)
VALUES
  -- HUN-01 (High Risk Tomato Glut)
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Tomato', 'Abhinav Hybrid', 'Kharif', 1.5, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '14 days', 'growing', 78, 74, 6200, 'Breaker stage. Peak tomato arrivals in Hunasagi yard; stagger by 4 days recommended.'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Onion', 'Bhima Super', 'Kharif', 2.0, CURRENT_DATE - INTERVAL '75 days', CURRENT_DATE + INTERVAL '24 days', CURRENT_DATE + INTERVAL '24 days', 'growing', 36, 38, 8400, 'Moderate market pressure. Optimal vegetative canopy.'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Tomato', 'Saaho F1', 'Kharif', 2.0, CURRENT_DATE - INTERVAL '65 days', CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '10 days', 'harvest_ready', 72, 70, 7800, 'Heavy clay soil drainage risk during rain. Stagger harvest advised.'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'Onion', 'Pusa Red', 'Kharif', 4.2, CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', 'growing', 32, 35, 16500, 'Canal plot. Steady APMC demand expected.'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004', 'Tomato', 'Namdhari NS-501', 'Kharif', 5.0, CURRENT_DATE - INTERVAL '62 days', CURRENT_DATE + INTERVAL '9 days', CURRENT_DATE + INTERVAL '13 days', 'harvest_ready', 82, 88, 21000, 'Critical saturation: 21 tons harvest coinciding with peer plots.'),

  -- KEM-01 (Low Risk Diversified Pulses & Cotton)
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 'Cotton', 'Bt Cotton RCH-2', 'Kharif', 4.8, CURRENT_DATE - INTERVAL '130 days', CURRENT_DATE + INTERVAL '19 days', CURRENT_DATE + INTERVAL '19 days', 'growing', 22, 26, 4800, 'Boll maturation on track. High resilience black cotton soil.'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000006', 'Bengal Gram', 'JG-11 (Chana)', 'Rabi', 6.0, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', 'growing', 18, 22, 5400, 'Low moisture stress; nitrogen fixing pulse rotation.'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000007', 'Red Gram', 'TS-3R (Maruti)', 'Kharif', 3.2, CURRENT_DATE - INTERVAL '135 days', CURRENT_DATE + INTERVAL '33 days', CURRENT_DATE + INTERVAL '33 days', 'growing', 24, 26, 2800, 'Pod formation stage. Stable market price at Kembhavi APMC.'),

  -- SHO-01 (Low/Nominal Risk Canal Paddy & Groundnut)
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000008', 'Paddy', 'BPT 5204 (Sona Masoori)', 'Kharif', 5.5, CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '16 days', 'growing', 26, 30, 14000, 'Canal water steady. Institutional grain procurement assured.'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000009', 'Groundnut', 'TMV-2', 'Kharif', 4.0, CURRENT_DATE - INTERVAL '95 days', CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE + INTERVAL '21 days', 'growing', 31, 34, 5200, 'Pod maturity testing 75% dark inner shell.')
ON CONFLICT (id) DO UPDATE SET
  dri_score = EXCLUDED.dri_score,
  status = EXCLUDED.status;

-- -----------------------------------------------------------------------------
-- 5. Weather Cache (HUN-01, KEM-01, SHO-01)
-- -----------------------------------------------------------------------------
ALTER TABLE public.weather_cache
  ADD COLUMN IF NOT EXISTS cluster_id text,
  ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS temp_max numeric,
  ADD COLUMN IF NOT EXISTS temp_min numeric,
  ADD COLUMN IF NOT EXISTS rainfall_mm numeric,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS humidity numeric;

INSERT INTO public.weather_cache (cluster_id, date, temp_max, temp_min, rainfall_mm, condition, humidity)
VALUES
  ('HUN-01', CURRENT_DATE, 33.5, 22.0, 8.4, 'scattered_showers', 72.0),
  ('HUN-01', CURRENT_DATE + 1, 31.0, 21.0, 12.0, 'rainy', 82.0),
  ('KEM-01', CURRENT_DATE, 31.8, 20.5, 0.0, 'clear', 48.0),
  ('KEM-01', CURRENT_DATE + 1, 32.5, 21.0, 0.0, 'sunny', 46.0),
  ('SHO-01', CURRENT_DATE, 34.0, 23.0, 1.2, 'partly_cloudy', 54.0),
  ('SHO-01', CURRENT_DATE + 1, 33.0, 22.5, 0.0, 'clear', 52.0)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Mandi Prices
-- -----------------------------------------------------------------------------
ALTER TABLE public.mandi_prices
  ADD COLUMN IF NOT EXISTS crop_name text,
  ADD COLUMN IF NOT EXISTS market_name text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS state text DEFAULT 'Karnataka',
  ADD COLUMN IF NOT EXISTS price_min numeric,
  ADD COLUMN IF NOT EXISTS price_max numeric,
  ADD COLUMN IF NOT EXISTS price_modal numeric,
  ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'agmarknet';

INSERT INTO public.mandi_prices (crop_name, market_name, district, state, price_min, price_max, price_modal, date, source)
VALUES
  ('Tomato', 'Hunasagi APMC Yard', 'Yadgir', 'Karnataka', 2800, 3600, 3200, CURRENT_DATE, 'agmarknet'),
  ('Cotton', 'Kembhavi Cotton Yard', 'Yadgir', 'Karnataka', 6800, 7500, 7200, CURRENT_DATE, 'agmarknet'),
  ('Bengal Gram', 'Kembhavi APMC', 'Yadgir', 'Karnataka', 5800, 6400, 6100, CURRENT_DATE, 'agmarknet'),
  ('Red Gram', 'Gulbarga APMC', 'Kalaburagi', 'Karnataka', 9200, 10500, 9800, CURRENT_DATE, 'agmarknet'),
  ('Paddy', 'Shorapur APMC', 'Yadgir', 'Karnataka', 2300, 2600, 2450, CURRENT_DATE, 'agmarknet'),
  ('Groundnut', 'Shorapur APMC', 'Yadgir', 'Karnataka', 6400, 7100, 6800, CURRENT_DATE, 'agmarknet'),
  ('Onion', 'Yadgir APMC', 'Yadgir', 'Karnataka', 2400, 3200, 2800, CURRENT_DATE, 'agmarknet')
ON CONFLICT DO NOTHING;
