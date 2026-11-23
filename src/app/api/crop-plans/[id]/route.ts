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
        id, farm_id, crop_name, variety, season, area_acres, sowing_date, expected_harvest_date, recommended_harvest_date, status, dri_score, market_pressure, estimated_yield_kg, notes, created_at,
        farms (id, name, village, district, soil_type, irrigation_type, owner_id)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiError(`Failed to fetch crop plan: ${error.message}`, { status: 500, details: error });
    }
    if (!cp) {
      return apiError(`Crop plan with ID ${id} not found`, { status: 404, code: "NOT_FOUND" });
    }

    return apiSuccess({
      ...cp,
      farm: cp.farms,
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

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (val.cropName) updates.crop_name = val.cropName;
    if (val.variety !== undefined) updates.variety = val.variety;
    if (val.season) updates.season = val.season;
    if (val.areaAcres !== undefined) updates.area_acres = val.areaAcres;
    if (val.sowingDate) updates.sowing_date = val.sowingDate;
    if (val.expectedHarvestDate) updates.expected_harvest_date = val.expectedHarvestDate;
    if (val.recommendedHarvestDate !== undefined) updates.recommended_harvest_date = val.recommendedHarvestDate;
    if (val.status) updates.status = val.status;
    if (val.driScore !== undefined) updates.dri_score = val.driScore;
    if (val.marketPressure !== undefined) updates.market_pressure = val.marketPressure;
    if (val.estimatedYieldKg !== undefined) updates.estimated_yield_kg = val.estimatedYieldKg;
    if (val.notes !== undefined) updates.notes = val.notes;

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
