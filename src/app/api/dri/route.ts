import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const { farmId, cropName, clusterId, expectedHarvestDate, soilType, cropPlanId } = await req.json();

    const cropKey = String(cropName || "").toLowerCase();
    const admin = getSupabaseAdminOptional();

    let weatherScore = 25;
    let peerCount = 8;

    if (admin) {
      try {
        const { data: weather } = await admin
          .from("weather_cache")
          .select("rainfall_mm, temp_max")
          .eq("cluster_id", clusterId)
          .order("date", { ascending: false })
          .limit(3);

        const rows = weather ?? [];
        if (rows.length > 0) {
          const avgRain = rows.reduce((s, w) => s + (w.rainfall_mm || 0), 0) / (rows.length || 1);
          const avgTemp = rows.reduce((s, w) => s + (w.temp_max || 30), 0) / (rows.length || 1);
          weatherScore = Math.min(avgRain * 4 + (avgTemp > 38 ? (avgTemp - 38) * 3 : 0), 100);
        }

        const { data: peers } = await admin
          .from("crop_plans")
          .select("id, farm_id")
          .eq("crop_name", cropName)
          .eq("status", "growing")
          .neq("farm_id", farmId);

        peerCount = peers?.length ?? 8;
      } catch (err) {
        console.warn("[api/dri] database lookup skipped, using heuristic fallback:", err);
      }
    }

    const marketPressure = Math.min((peerCount / 50) * 100, 100);

    const soilScores: Record<string, Record<string, number>> = {
      loamy: { tomato: 20, onion: 15, chilli: 20, wheat: 10 },
      clay: { tomato: 50, onion: 60, chilli: 55, wheat: 25 },
      sandy: { tomato: 35, onion: 40, chilli: 30, wheat: 45 },
      red: { tomato: 30, onion: 35, chilli: 25, wheat: 30 },
      black: { tomato: 25, onion: 20, chilli: 22, wheat: 15 },
    };
    const soilScore = soilScores[soilType]?.[cropKey] ?? 35;

    const dri = weatherScore * 0.35 + marketPressure * 0.4 + soilScore * 0.25;

    const delayDays = Math.floor(peerCount > 0 ? (1 / (peerCount + 1)) * 14 : 0);
    const base = expectedHarvestDate ? new Date(expectedHarvestDate) : new Date();
    base.setDate(base.getDate() + delayDays);
    const recommendedDate = base.toISOString().split("T")[0];

    if (admin && cropPlanId) {
      try {
        await admin
          .from("crop_plans")
          .update({
            dri_score: Math.round(dri),
            market_pressure: Math.round(marketPressure),
            recommended_harvest_date: recommendedDate,
          })
          .eq("id", cropPlanId);
      } catch (e) {
        console.warn("[api/dri] crop_plans update skipped:", e);
      }
    }

    return Response.json({
      dri: Math.round(dri),
      marketPressure: Math.round(marketPressure),
      weatherScore: Math.round(weatherScore),
      recommendedDate,
      delayDays,
      verdict: dri < 30 ? "Harvest now" : dri < 60 ? "Can wait a few days" : "Delay recommended",
    });
  } catch (e) {
    console.error("[api/dri]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
