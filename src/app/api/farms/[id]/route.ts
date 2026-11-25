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
        id, cluster_id, name, area_acres, soil_type, lat, lng, created_at,
        clusters (id, name, center_lat, center_lng)
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
      .select("id, crop_name, sow_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, quantity_kg")
      .eq("farm_id", id)
      .order("created_at", { ascending: false });

    // Fetch recent soil analyses if available
    let soilAnalyses: any[] = [];
    try {
      const { data } = await admin
        .from("soil_analyses")
        .select("id, previous_crop, soil_type, nitrogen_score, phosphorus_score, potassium_score, stress_score, recovery_weeks, recommended_crop, created_at")
        .eq("farm_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      soilAnalyses = data || [];
    } catch {
      // Table absent or not populated
    }

    const clusterObj: any = Array.isArray(farm.clusters) ? farm.clusters[0] : farm.clusters;
    const isKembhavi = clusterObj?.name?.toLowerCase().includes("kembhavi");
    const isShorapur = clusterObj?.name?.toLowerCase().includes("shorapur");
    const village = isKembhavi ? "Kembhavi" : isShorapur ? "Shorapur" : "Hunasagi";
    const clusterCode = isKembhavi ? "KEM-01" : isShorapur ? "SHO-01" : "HUN-01";

    return apiSuccess({
      ...farm,
      acres: Number(farm.area_acres || 2.5),
      village,
      district: "Yadgir",
      state: "Karnataka",
      group: clusterObj ? {
        id: clusterObj.id,
        name: clusterObj.name,
        code: clusterCode,
      } : null,
      activeCrops: (cropPlans || []).map((cp: any) => ({
        id: cp.id,
        cropName: cp.crop_name,
        sowDate: cp.sow_date,
        expectedHarvestDate: cp.expected_harvest_date,
        driScore: cp.dri_score,
        status: cp.status,
        quantityKg: cp.quantity_kg,
      })),
      recentSoilAnalyses: soilAnalyses,
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

    const updates: Record<string, unknown> = {};
    if (val.name) updates.name = val.name;
    if (val.acres !== undefined) updates.area_acres = val.acres;
    if (val.soilType) updates.soil_type = val.soilType;
    if (val.lat !== undefined) updates.lat = val.lat;
    if (val.lng !== undefined) updates.lng = val.lng;
    if (val.groupId !== undefined) updates.cluster_id = val.groupId;

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
