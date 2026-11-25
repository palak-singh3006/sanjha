import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { createCropPlanSchema } from "@/lib/validations/crop-plan";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const cropName = searchParams.get("cropName") || searchParams.get("crop");
    const status = searchParams.get("status");
    const season = searchParams.get("season");
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      const allPlans = [
        {
          id: "d1000000-0000-0000-0000-000000000001",
          farmId: "c1000000-0000-0000-0000-000000000001",
          farmName: "Gowda South Field",
          cropName: "Tomato",
          variety: "Abhinav Hybrid",
          season: "Kharif",
          areaAcres: 1.5,
          sowingDate: "2026-09-24",
          expectedHarvestDate: "2026-12-05",
          recommendedHarvestDate: "2026-12-08",
          status: "growing",
          driScore: 78,
          marketPressure: 74,
          estimatedYieldKg: 6200,
        },
        {
          id: "d1000000-0000-0000-0000-000000000002",
          farmId: "c1000000-0000-0000-0000-000000000001",
          farmName: "Gowda South Field",
          cropName: "Onion",
          variety: "Bhima Super",
          season: "Kharif",
          areaAcres: 2.0,
          sowingDate: "2026-09-09",
          expectedHarvestDate: "2026-12-18",
          recommendedHarvestDate: "2026-12-18",
          status: "growing",
          driScore: 36,
          marketPressure: 38,
          estimatedYieldKg: 8400,
        },
        {
          id: "d1000000-0000-0000-0000-000000000003",
          farmId: "c1000000-0000-0000-0000-000000000002",
          farmName: "Renuka Krishna Valley Farm",
          cropName: "Tomato",
          variety: "Saaho F1",
          season: "Kharif",
          areaAcres: 2.0,
          sowingDate: "2026-09-19",
          expectedHarvestDate: "2026-12-01",
          recommendedHarvestDate: "2026-12-04",
          status: "harvest_ready",
          driScore: 72,
          marketPressure: 70,
          estimatedYieldKg: 7800,
        },
        {
          id: "d1000000-0000-0000-0000-000000000004",
          farmId: "c1000000-0000-0000-0000-000000000003",
          farmName: "Basavaraj Canal Plot",
          cropName: "Onion",
          variety: "Pusa Red",
          season: "Kharif",
          areaAcres: 4.2,
          sowingDate: "2026-09-15",
          expectedHarvestDate: "2026-12-25",
          recommendedHarvestDate: "2026-12-25",
          status: "growing",
          driScore: 32,
          marketPressure: 35,
          estimatedYieldKg: 16500,
        },
        {
          id: "d1000000-0000-0000-0000-000000000005",
          farmId: "c1000000-0000-0000-0000-000000000004",
          farmName: "Sanjha Co-op Tomato Plot",
          cropName: "Tomato",
          variety: "Namdhari NS-501",
          season: "Kharif",
          areaAcres: 5.0,
          sowingDate: "2026-09-20",
          expectedHarvestDate: "2026-12-04",
          recommendedHarvestDate: "2026-12-08",
          status: "harvest_ready",
          driScore: 82,
          marketPressure: 88,
          estimatedYieldKg: 21000,
        },
        {
          id: "d1000000-0000-0000-0000-000000000006",
          farmId: "c1000000-0000-0000-0000-000000000005",
          farmName: "Patil Cotton Acreage",
          cropName: "Cotton",
          variety: "Bt Cotton RCH-2",
          season: "Kharif",
          areaAcres: 4.8,
          sowingDate: "2026-07-15",
          expectedHarvestDate: "2026-12-14",
          recommendedHarvestDate: "2026-12-14",
          status: "growing",
          driScore: 22,
          marketPressure: 26,
          estimatedYieldKg: 4800,
        },
        {
          id: "d1000000-0000-0000-0000-000000000007",
          farmId: "c1000000-0000-0000-0000-000000000006",
          farmName: "Kembhavi Pulse Cooperative",
          cropName: "Bengal Gram",
          variety: "JG-11 (Chana)",
          season: "Rabi",
          areaAcres: 6.0,
          sowingDate: "2026-10-05",
          expectedHarvestDate: "2026-12-20",
          recommendedHarvestDate: "2026-12-20",
          status: "growing",
          driScore: 18,
          marketPressure: 22,
          estimatedYieldKg: 5400,
        },
        {
          id: "d1000000-0000-0000-0000-000000000008",
          farmId: "c1000000-0000-0000-0000-000000000007",
          farmName: "Mallikarjun Red Gram Plot",
          cropName: "Red Gram",
          variety: "TS-3R (Maruti)",
          season: "Kharif",
          areaAcres: 3.2,
          sowingDate: "2026-07-10",
          expectedHarvestDate: "2026-12-28",
          recommendedHarvestDate: "2026-12-28",
          status: "growing",
          driScore: 24,
          marketPressure: 26,
          estimatedYieldKg: 2800,
        },
        {
          id: "d1000000-0000-0000-0000-000000000009",
          farmId: "c1000000-0000-0000-0000-000000000008",
          farmName: "Shorapur Basin Paddy Farm",
          cropName: "Paddy",
          variety: "BPT 5204 (Sona Masoori)",
          season: "Kharif",
          areaAcres: 5.5,
          sowingDate: "2026-08-01",
          expectedHarvestDate: "2026-12-10",
          recommendedHarvestDate: "2026-12-11",
          status: "growing",
          driScore: 26,
          marketPressure: 30,
          estimatedYieldKg: 14000,
        },
        {
          id: "d1000000-0000-0000-0000-000000000010",
          farmId: "c1000000-0000-0000-0000-000000000009",
          farmName: "Raja Venkatappa Canal Plot",
          cropName: "Groundnut",
          variety: "TMV-2",
          season: "Kharif",
          areaAcres: 4.0,
          sowingDate: "2026-08-15",
          expectedHarvestDate: "2026-12-16",
          recommendedHarvestDate: "2026-12-16",
          status: "growing",
          driScore: 31,
          marketPressure: 34,
          estimatedYieldKg: 5200,
        },
      ];

      let filtered = allPlans;
      if (farmId) filtered = filtered.filter((p) => p.farmId === farmId);
      if (cropName) filtered = filtered.filter((p) => p.cropName.toLowerCase().includes(cropName.toLowerCase()));
      if (status) filtered = filtered.filter((p) => p.status === status);
      return apiSuccess(filtered);
    }

    let query = admin
      .from("crop_plans")
      .select(`
        id, farm_id, crop_name, sow_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, quantity_kg, created_at,
        farms (id, name, area_acres, soil_type, cluster_id)
      `)
      .order("expected_harvest_date", { ascending: true })
      .limit(limit);

    if (farmId) query = query.eq("farm_id", farmId);
    if (cropName) query = query.ilike("crop_name", `%${cropName}%`);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return apiError(`Failed to fetch crop plans: ${error.message}`, { status: 500, details: error });
    }

    const results = (data || []).map((cp: any) => ({
      id: cp.id,
      farmId: cp.farm_id,
      farmName: cp.farms?.name,
      soilType: cp.farms?.soil_type,
      cropName: cp.crop_name,
      variety: "Hybrid Selection",
      season: "Kharif",
      areaAcres: Number(cp.farms?.area_acres || 2.5),
      sowingDate: cp.sow_date,
      sowDate: cp.sow_date,
      expectedHarvestDate: cp.expected_harvest_date,
      recommendedHarvestDate: cp.recommended_harvest_date,
      status: cp.status,
      driScore: cp.dri_score ?? 35,
      marketPressure: cp.market_pressure ?? 40,
      estimatedYieldKg: Number(cp.quantity_kg || 0),
      quantityKg: Number(cp.quantity_kg || 0),
      createdAt: cp.created_at,
    }));

    return apiSuccess(results, { meta: { count: results.length } });
  } catch (e) {
    return handleCatchError(e, "api/crop-plans GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createCropPlanSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({
        id: crypto.randomUUID(),
        ...val,
        driScore: 0,
        marketPressure: 0,
        isDemo: true,
      }, { status: 201 });
    }

    // Verify farm exists
    const { data: farm } = await admin.from("farms").select("id").eq("id", val.farmId).maybeSingle();
    if (!farm) {
      return apiError(`Farm with ID ${val.farmId} not found`, { status: 404 });
    }

    const { data, error } = await admin
      .from("crop_plans")
      .insert({
        farm_id: val.farmId,
        crop_name: val.cropName,
        sow_date: val.sowingDate || new Date().toISOString().split("T")[0],
        expected_harvest_date: val.expectedHarvestDate,
        recommended_harvest_date: val.recommendedHarvestDate || val.expectedHarvestDate,
        status: val.status || "growing",
        quantity_kg: val.estimatedYieldKg || 5000,
        dri_score: 0,
        market_pressure: 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(`Failed to create crop plan: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess(data, { status: 201 });
  } catch (e) {
    return handleCatchError(e, "api/crop-plans POST");
  }
}
