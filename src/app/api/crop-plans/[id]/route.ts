import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { updateCropPlanSchema } from "@/lib/validations/crop-plan";

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
        notes: "Breaker stage anticipated in 10 days; staggered harvesting to evade market glut.",
      });
    }

    const { data: cp, error } = await admin
      .from("crop_plans")
      .select(`
        id, farm_id, crop_name, sow_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, quantity_kg, created_at,
        farms (id, name, area_acres, soil_type, cluster_id)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiError(`Failed to fetch crop plan: ${error.message}`, { status: 500, details: error });
    }
    if (!cp) {
      return apiError(`Crop plan with ID ${id} not found`, { status: 404, code: "NOT_FOUND" });
    }

    const farmObj: any = Array.isArray(cp.farms) ? cp.farms[0] : cp.farms;

    return apiSuccess({
      id: cp.id,
      farmId: cp.farm_id,
      farmName: farmObj?.name,
      cropName: cp.crop_name,
      variety: "Hybrid Selection",
      season: "Kharif",
      areaAcres: Number(farmObj?.area_acres || 2.5),
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
      farm: farmObj,
    });
  } catch (e) {
    return handleCatchError(e, "api/crop-plans/[id] GET");
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const json = await req.json();
    const parsed = updateCropPlanSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({ id, ...val, updated: true, isDemo: true });
    }

    const updates: Record<string, unknown> = {};
    if (val.cropName) updates.crop_name = val.cropName;
    if (val.sowingDate) updates.sow_date = val.sowingDate;
    if (val.expectedHarvestDate) updates.expected_harvest_date = val.expectedHarvestDate;
    if (val.recommendedHarvestDate !== undefined) updates.recommended_harvest_date = val.recommendedHarvestDate;
    if (val.status) updates.status = val.status;
    if (val.driScore !== undefined) updates.dri_score = val.driScore;
    if (val.marketPressure !== undefined) updates.market_pressure = val.marketPressure;
    if (val.estimatedYieldKg !== undefined) updates.quantity_kg = val.estimatedYieldKg;

    const { data, error } = await admin
      .from("crop_plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError(`Failed to update crop plan: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess(data);
  } catch (e) {
    return handleCatchError(e, "api/crop-plans/[id] PATCH");
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

    const { error } = await admin.from("crop_plans").delete().eq("id", id);
    if (error) {
      return apiError(`Failed to delete crop plan: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess({ id, deleted: true });
  } catch (e) {
    return handleCatchError(e, "api/crop-plans/[id] DELETE");
  }
}
