import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { updateFarmSchema } from "@/lib/validations/farm";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      return apiSuccess({
        id,
        name: "Gowda South Field",
        acres: 3.5,
        village: "Hunasagi",
        district: "Yadgir",
        state: "Karnataka",
        soilType: "loamy",
        surveyNumber: "SY-142/B",
        irrigationType: "drip",
        lat: 16.452,
        lng: 76.448,
        owner: {
          id: "a1000000-0000-0000-0000-000000000001",
          fullName: "Sharanappa Gowda",
          phone: "+91 98450 12345",
        },
        group: {
          id: "b1000000-0000-0000-0000-000000000001",
          name: "Hunasagi Progressive Farmers Cluster",
          code: "HUN-01",
        },
        activeCrops: [
          {
            id: "d1000000-0000-0000-0000-000000000001",
            cropName: "Tomato",
            variety: "Abhinav Hybrid",
            areaAcres: 1.5,
            status: "growing",
            expectedHarvestDate: "2026-12-05",
            driScore: 42,
          },
        ],
        recentSoilAnalyses: [],
      });
    }

    const { data: farm, error } = await admin
      .from("farms")
      .select(`
        id, owner_id, group_id, name, acres, village, district, state, soil_type, survey_number, irrigation_type, lat, lng, created_at,
        users (id, full_name, phone, village),
        farmer_groups (id, name, code, village)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiError(`Failed to fetch farm: ${error.message}`, { status: 500, details: error });
    }
    if (!farm) {
      return apiError(`Farm with ID ${id} not found`, { status: 404, code: "NOT_FOUND" });
    }

    // Fetch crop plans for this farm
    const { data: cropPlans } = await admin
      .from("crop_plans")
      .select("id, crop_name, variety, season, area_acres, sowing_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure")
      .eq("farm_id", id)
      .order("created_at", { ascending: false });

    // Fetch recent soil analyses
    const { data: soilAnalyses } = await admin
      .from("soil_analyses")
      .select("id, previous_crop, soil_type, nitrogen_score, phosphorus_score, potassium_score, stress_score, recovery_weeks, recommended_crop, created_at")
      .eq("farm_id", id)
      .order("created_at", { ascending: false })
      .limit(5);

    return apiSuccess({
      ...farm,
      owner: farm.users,
      group: farm.farmer_groups,
      activeCrops: cropPlans || [],
      recentSoilAnalyses: soilAnalyses || [],
    });
  } catch (e) {
    return handleCatchError(e, "api/farms/[id] GET");
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const json = await req.json();
    const parsed = updateFarmSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({ id, ...val, updated: true, isDemo: true });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (val.name) updates.name = val.name;
    if (val.acres !== undefined) updates.acres = val.acres;
    if (val.village) updates.village = val.village;
    if (val.district) updates.district = val.district;
    if (val.state) updates.state = val.state;
    if (val.soilType) updates.soil_type = val.soilType;
    if (val.surveyNumber !== undefined) updates.survey_number = val.surveyNumber;
    if (val.irrigationType) updates.irrigation_type = val.irrigationType;
    if (val.lat !== undefined) updates.lat = val.lat;
    if (val.lng !== undefined) updates.lng = val.lng;
    if (val.groupId !== undefined) updates.group_id = val.groupId;

    const { data, error } = await admin
      .from("farms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError(`Failed to update farm: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess(data);
  } catch (e) {
    return handleCatchError(e, "api/farms/[id] PATCH");
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({ id, deleted: true, isDemo: true });
    }

    const { error } = await admin.from("farms").delete().eq("id", id);
    if (error) {
      return apiError(`Failed to delete farm: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess({ id, deleted: true });
  } catch (e) {
    return handleCatchError(e, "api/farms/[id] DELETE");
  }
}
