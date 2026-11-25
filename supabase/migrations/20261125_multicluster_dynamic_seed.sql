-- =============================================================================
-- SANJHA MULTI-CLUSTER DYNAMIC SEED SCRIPT
-- Populates Hunasagi (HUN-01), Kembhavi (KEM-01), and Shorapur (SHO-01)
-- Run this in Supabase SQL Editor to make the map, dashboard, and DRI fully dynamic!
-- =============================================================================

-- 1. Insert Farmer Groups / Regional Clusters
INSERT INTO public.farmer_groups (id, name, code, village, district, state, description, lat, lng, total_acres)
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

-- 2. Insert Users Across All 3 Clusters
INSERT INTO public.users (id, full_name, email, phone, role, preferred_language, village, district, state)
VALUES
  -- Hunasagi Cluster
  ('a1000000-0000-0000-0000-000000000001', 'Sharanappa Gowda', 'farmer.sharanappa@sanjha.network', '+91 98450 12345', 'farmer', 'kn', 'Hunasagi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000002', 'Basavaraj Patil', 'coord.patil@sanjha.network', '+91 98450 23456', 'coordinator', 'kn', 'Hunasagi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000003', 'AgroFresh Procurement Ltd', 'buyer.agrofresh@sanjha.network', '+91 98450 34567', 'buyer', 'en', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000004', 'Renuka Devi', 'farmer.renuka@sanjha.network', '+91 98450 45678', 'farmer', 'kn', 'Hunasagi', 'Yadgir', 'Karnataka'),

  -- Kembhavi Cluster
  ('a1000000-0000-0000-0000-000000000005', 'Hanumantappa Pujari', 'farmer.hanumant@sanjha.network', '+91 98450 56789', 'farmer', 'kn', 'Kembhavi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000006', 'Kembhavi Raitha Sangha', 'fpo.kembhavi@sanjha.network', '+91 98450 67890', 'coordinator', 'kn', 'Kembhavi', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000007', 'Mallikarjun Biradar', 'farmer.mallikarjun@sanjha.network', '+91 98450 78901', 'farmer', 'kn', 'Kembhavi', 'Yadgir', 'Karnataka'),

  -- Shorapur Cluster
  ('a1000000-0000-0000-0000-000000000008', 'Venkatesh Nayak', 'farmer.venkatesh@sanjha.network', '+91 98450 89012', 'farmer', 'kn', 'Shorapur', 'Yadgir', 'Karnataka'),
  ('a1000000-0000-0000-0000-000000000009', 'Raja Venkatappa FPO', 'fpo.shorapur@sanjha.network', '+91 98450 90123', 'coordinator', 'kn', 'Shorapur', 'Yadgir', 'Karnataka')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  village = EXCLUDED.village;

-- 3. Update Leaders in Farmer Groups
UPDATE public.farmer_groups SET leader_id = 'a1000000-0000-0000-0000-000000000002' WHERE id = 'b1000000-0000-0000-0000-000000000001';
UPDATE public.farmer_groups SET leader_id = 'a1000000-0000-0000-0000-000000000006' WHERE id = 'b1000000-0000-0000-0000-000000000002';
UPDATE public.farmer_groups SET leader_id = 'a1000000-0000-0000-0000-000000000009' WHERE id = 'b1000000-0000-0000-0000-000000000003';

-- 4. Insert Farmer Profiles
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

-- 5. Insert Group Memberships
INSERT INTO public.group_memberships (group_id, user_id, role, status)
VALUES
  -- HUN-01
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'coordinator', 'active'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'member', 'active'),

  -- KEM-01
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'coordinator', 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 'member', 'active'),

  -- SHO-01
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000009', 'coordinator', 'active'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008', 'member', 'active')
ON CONFLICT (group_id, user_id) DO UPDATE SET
  status = EXCLUDED.status;

-- 6. Insert Multi-Cluster Farms with Distinct Lat/Lng & Soils
INSERT INTO public.farms (id, owner_id, group_id, name, acres, village, district, state, soil_type, survey_number, irrigation_type, lat, lng)
VALUES
  -- Hunasagi (HUN-01)
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Gowda South Field', 3.5, 'Hunasagi', 'Yadgir', 'Karnataka', 'loamy', 'SY-142/B', 'drip', 16.452000, 76.448000),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Renuka Krishna Valley Farm', 2.0, 'Hunasagi', 'Yadgir', 'Karnataka', 'clay', 'SY-89/1', 'canal_drip', 16.458000, 76.453000),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Basavaraj Canal Plot', 4.2, 'Hunasagi', 'Yadgir', 'Karnataka', 'loamy', 'SY-210/C', 'canal', 16.446000, 76.456000),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Sanjha Co-op Tomato Plot', 5.0, 'Hunasagi', 'Yadgir', 'Karnataka', 'black', 'SY-55/A', 'drip', 16.451000, 76.442000),

  -- Kembhavi (KEM-01)
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 'Patil Cotton Acreage', 4.8, 'Kembhavi', 'Yadgir', 'Karnataka', 'black', 'SY-78/2', 'borewell', 16.665000, 76.561000),
  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 'Kembhavi Pulse Cooperative', 6.0, 'Kembhavi', 'Yadgir', 'Karnataka', 'loamy', 'SY-104/1', 'rainfed_drip', 16.669000, 76.568000),
  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'Mallikarjun Red Gram Plot', 3.2, 'Kembhavi', 'Yadgir', 'Karnataka', 'red', 'SY-33/B', 'rainfed', 16.660000, 76.556000),

  -- Shorapur (SHO-01)
  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'Shorapur Basin Paddy Farm', 5.5, 'Shorapur', 'Yadgir', 'Karnataka', 'clay', 'SY-12/A', 'canal', 16.522000, 76.755000),
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 'Raja Venkatappa Canal Plot', 4.0, 'Shorapur', 'Yadgir', 'Karnataka', 'loamy', 'SY-91/C', 'canal_drip', 16.518000, 76.762000)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  acres = EXCLUDED.acres,
  soil_type = EXCLUDED.soil_type,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;

-- 7. Insert Crop Plans with Varied Risk Ratings (High, Medium, and Low)
INSERT INTO public.crop_plans (id, farm_id, crop_name, variety, season, area_acres, sowing_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, estimated_yield_kg, notes)
VALUES
  -- HUN-01: High Risk Tomato Glut & Medium Risk Onion
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Tomato', 'Abhinav Hybrid', 'Kharif', 1.5, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '14 days', 'growing', 78, 74, 6200, 'Breaker stage. Peak tomato arrivals in Hunasagi yard; stagger by 4 days recommended.'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Onion', 'Bhima Super', 'Kharif', 2.0, CURRENT_DATE - INTERVAL '75 days', CURRENT_DATE + INTERVAL '24 days', CURRENT_DATE + INTERVAL '24 days', 'growing', 36, 38, 8400, 'Moderate market pressure. Optimal vegetative canopy.'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Tomato', 'Saaho F1', 'Kharif', 2.0, CURRENT_DATE - INTERVAL '65 days', CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '10 days', 'harvest_ready', 72, 70, 7800, 'Heavy clay soil drainage risk during rain. Stagger harvest advised.'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'Onion', 'Pusa Red', 'Kharif', 4.2, CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', 'growing', 32, 35, 16500, 'Canal plot. Steady APMC demand expected.'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004', 'Tomato', 'Namdhari NS-501', 'Kharif', 5.0, CURRENT_DATE - INTERVAL '62 days', CURRENT_DATE + INTERVAL '9 days', CURRENT_DATE + INTERVAL '13 days', 'harvest_ready', 82, 88, 21000, 'Critical saturation: 21 tons harvest coinciding with peer plots.'),

  -- KEM-01: Low Risk Diversified Pulses & Cotton
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 'Cotton', 'Bt Cotton RCH-2', 'Kharif', 4.8, CURRENT_DATE - INTERVAL '130 days', CURRENT_DATE + INTERVAL '19 days', CURRENT_DATE + INTERVAL '19 days', 'growing', 22, 26, 4800, 'Boll maturation on track. High resilience black cotton soil.'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000006', 'Bengal Gram', 'JG-11 (Chana)', 'Rabi', 6.0, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', 'growing', 18, 22, 5400, 'Low moisture stress; nitrogen fixing pulse rotation.'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000007', 'Red Gram', 'TS-3R (Maruti)', 'Kharif', 3.2, CURRENT_DATE - INTERVAL '135 days', CURRENT_DATE + INTERVAL '33 days', CURRENT_DATE + INTERVAL '33 days', 'growing', 24, 26, 2800, 'Pod formation stage. Stable market price at Kembhavi APMC.'),

  -- SHO-01: Low/Nominal Risk Canal Paddy & Groundnut
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000008', 'Paddy', 'BPT 5204 (Sona Masoori)', 'Kharif', 5.5, CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '16 days', 'growing', 26, 30, 14000, 'Canal water steady. Institutional grain procurement assured.'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000009', 'Groundnut', 'TMV-2', 'Kharif', 4.0, CURRENT_DATE - INTERVAL '95 days', CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE + INTERVAL '21 days', 'growing', 31, 34, 5200, 'Pod maturity testing 75% dark inner shell.')
ON CONFLICT (id) DO UPDATE SET
  dri_score = EXCLUDED.dri_score,
  market_pressure = EXCLUDED.market_pressure,
  status = EXCLUDED.status;

-- 8. Weather Cache for Each Cluster (Creates Distinct Climate & DRI Inputs)
INSERT INTO public.weather_cache (cluster_id, date, temp_max, temp_min, rainfall_mm, condition, humidity)
VALUES
  -- HUN-01 (Unseasonal Rain Risk)
  ('HUN-01', CURRENT_DATE, 33.5, 22.0, 8.4, 'scattered_showers', 72.0),
  ('HUN-01', CURRENT_DATE + 1, 31.0, 21.0, 12.0, 'rainy', 82.0),
  ('HUN-01', CURRENT_DATE + 2, 32.0, 21.5, 4.0, 'cloudy', 65.0),

  -- KEM-01 (Dry, Stable Climate)
  ('KEM-01', CURRENT_DATE, 31.8, 20.5, 0.0, 'clear', 48.0),
  ('KEM-01', CURRENT_DATE + 1, 32.5, 21.0, 0.0, 'sunny', 46.0),
  ('KEM-01', CURRENT_DATE + 2, 33.0, 21.5, 0.0, 'clear', 50.0),

  -- SHO-01 (Canal Belt, Clear)
  ('SHO-01', CURRENT_DATE, 34.0, 23.0, 1.2, 'partly_cloudy', 54.0),
  ('SHO-01', CURRENT_DATE + 1, 33.0, 22.5, 0.0, 'clear', 52.0),
  ('SHO-01', CURRENT_DATE + 2, 34.5, 23.0, 0.0, 'clear', 50.0)
ON CONFLICT DO NOTHING;

-- 9. Mandi Prices Across Multiple Regional APMCs
INSERT INTO public.mandi_prices (crop_name, market_name, district, state, price_min, price_max, price_modal, date, source)
VALUES
  -- Tomato
  ('Tomato', 'Hunasagi APMC Yard', 'Yadgir', 'Karnataka', 2800, 3600, 3200, CURRENT_DATE, 'agmarknet'),
  ('Tomato', 'Yadgir APMC', 'Yadgir', 'Karnataka', 3100, 3900, 3500, CURRENT_DATE, 'agmarknet'),
  ('Tomato', 'Yeshwanthpur Bangalore', 'Bangalore Urban', 'Karnataka', 3800, 4800, 4300, CURRENT_DATE, 'agmarknet'),

  -- Pulses & Cotton (Kembhavi / Yadgir APMCs)
  ('Cotton', 'Kembhavi Cotton Yard', 'Yadgir', 'Karnataka', 6800, 7500, 7200, CURRENT_DATE, 'agmarknet'),
  ('Bengal Gram', 'Kembhavi APMC', 'Yadgir', 'Karnataka', 5800, 6400, 6100, CURRENT_DATE, 'agmarknet'),
  ('Red Gram', 'Gulbarga APMC', 'Kalaburagi', 'Karnataka', 9200, 10500, 9800, CURRENT_DATE, 'agmarknet'),

  -- Paddy & Groundnut (Shorapur APMC)
  ('Paddy', 'Shorapur APMC', 'Yadgir', 'Karnataka', 2300, 2600, 2450, CURRENT_DATE, 'agmarknet'),
  ('Groundnut', 'Shorapur APMC', 'Yadgir', 'Karnataka', 6400, 7100, 6800, CURRENT_DATE, 'agmarknet'),
  ('Onion', 'Yadgir APMC', 'Yadgir', 'Karnataka', 2400, 3200, 2800, CURRENT_DATE, 'agmarknet')
ON CONFLICT DO NOTHING;

-- 10. Multi-Cluster Marketplace Listings
INSERT INTO public.listings (id, farm_id, farmer_id, crop_name, quantity_kg, quality_grade, min_price, available_date, location_text, lat, lng, status)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Tomato', 2500, 'A', 34.00, CURRENT_DATE + INTERVAL '10 days', 'Hunasagi Mandi Yard', 16.452000, 76.448000, 'open'),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Onion', 4000, 'A', 28.50, CURRENT_DATE + INTERVAL '24 days', 'Hunasagi Mandi Yard', 16.452000, 76.448000, 'open'),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Cotton', 3000, 'A', 72.00, CURRENT_DATE + INTERVAL '18 days', 'Kembhavi Cotton Collection Center', 16.665000, 76.561000, 'open'),
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'Paddy', 8000, 'A', 25.00, CURRENT_DATE + INTERVAL '15 days', 'Shorapur APMC Warehouse', 16.522000, 76.755000, 'open')
ON CONFLICT (id) DO UPDATE SET
  min_price = EXCLUDED.min_price,
  quantity_kg = EXCLUDED.quantity_kg;
