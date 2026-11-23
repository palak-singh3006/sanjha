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
      return apiSuccess([
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
          recommendedHarvestDate: "2026-12-07",
          status: "growing",
          driScore: 42,
          marketPressure: 68,
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
          driScore: 28,
          marketPressure: 35,
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
          recommendedHarvestDate: "2026-12-03",
          status: "harvest_ready",
          driScore: 55,
          marketPressure: 72,
          estimatedYieldKg: 7800,
        },
      ]);
    }

    let query = admin
      .from("crop_plans")
      .select(`
        id, farm_id, crop_name, variety, season, area_acres, sowing_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, estimated_yield_kg, notes, created_at,
        farms (id, name, village, district, soil_type, owner_id)
      `)
      .order("expected_harvest_date", { ascending: true })
      .limit(limit);

    if (farmId) query = query.eq("farm_id", farmId);
    if (cropName) query = query.ilike("crop_name", `%${cropName}%`);
    if (status) query = query.eq("status", status);
    if (season) query = query.eq("season", season);

    const { data, error } = await query;
    if (error) {
      return apiError(`Failed to fetch crop plans: ${error.message}`, { status: 500, details: error });
    }

    const results = (data || []).map((cp: any) => ({
      id: cp.id,
      farmId: cp.farm_id,
      farmName: cp.farms?.name,
      village: cp.farms?.village,
      district: cp.farms?.district,
      soilType: cp.farms?.soil_type,
      cropName: cp.crop_name,
      variety: cp.variety,
      season: cp.season,
      areaAcres: cp.area_acres,
      sowingDate: cp.sowing_date,
      expectedHarvestDate: cp.expected_harvest_date,
      recommendedHarvestDate: cp.recommended_harvest_date,
      status: cp.status,
      driScore: cp.dri_score,
      marketPressure: cp.market_pressure,
      estimatedYieldKg: cp.estimated_yield_kg,
      notes: cp.notes,
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
        variety: val.variety,
        season: val.season,
        area_acres: val.areaAcres,
        sowing_date: val.sowingDate,
        expected_harvest_date: val.expectedHarvestDate,
        recommended_harvest_date: val.recommendedHarvestDate || val.expectedHarvestDate,
        status: val.status,
        estimated_yield_kg: val.estimatedYieldKg,
        notes: val.notes,
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
