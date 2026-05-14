import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";
import {
  formatZodError,
  soilAnalyzeBodySchema,
} from "@/lib/validations/soil";
import { runSoilAnalysis } from "@/lib/soil/soil-engine";
import { enhanceSoilWithGemini, formatGeminiAdvisory } from "@/services/soil-gemini";

/** POST /api/soil/analyze */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = soilAnalyzeBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 400 });
    }

    const { farmId, previousCrop, soilType, farmingMethod, weeksSinceHarvest, useAi } = parsed.data;

    const admin = getSupabaseAdmin();

    const { data: farm, error: farmErr } = await admin.from("farms").select("id").eq("id", farmId).maybeSingle();

    if (farmErr) {
      return Response.json({ error: "Failed to verify farm", details: farmErr.message }, { status: 500 });
    }
    if (!farm) {
      return Response.json({ error: "farmId not found in farms table", farmId }, { status: 404 });
    }

    const engine = await runSoilAnalysis(admin, {
      farmId,
      previousCrop,
      soilType,
      farmingMethod,
      weeksSinceHarvest,
    });

    let gemini_advisory: string | null = null;
    if (useAi) {
      const { parsed: insights } = await enhanceSoilWithGemini(
        {
          previousCrop,
          soilType,
          farmingMethod,
          weeksSinceHarvest,
        },
        engine,
      );
      gemini_advisory = formatGeminiAdvisory(insights);
    }

    const insertRow = {
      farm_id: farmId,
      previous_crop: previousCrop,
      soil_type: soilType,
      farming_method: farmingMethod,
      weeks_since_harvest: weeksSinceHarvest,
      nitrogen_score: engine.nitrogen_score,
      phosphorus_score: engine.phosphorus_score,
      potassium_score: engine.potassium_score,
      stress_score: engine.stress_score,
      recovery_weeks: engine.recovery_weeks,
      recommended_crop: engine.recommended_crop,
      compost_plan: engine.compost_plan,
      green_manure_plan: engine.green_manure_plan,
      gemini_advisory,
    };

    const { data: saved, error: saveErr } = await admin.from("soil_analyses").insert(insertRow).select().single();

    if (saveErr) {
      return Response.json({ error: "Failed to save soil analysis", details: saveErr }, { status: 500 });
    }

    return Response.json({
      ...saved,
      rotation_rationale: engine.rotation_rationale,
      engine_meta: engine.meta,
    });
  } catch (e) {
    console.error("[api/soil/analyze]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
